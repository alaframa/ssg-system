// src/app/api/purchase-orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

// ─── GET: list POs with filters ───────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const branchId = searchParams.get("branch") ?? "";
  const supplierId = searchParams.get("supplier") ?? "";
  const status = searchParams.get("status") ?? "";
  const cylinderSize = searchParams.get("cylinderSize") ?? "";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = 20;

  const where: any = {};

  if (search) {
    where.OR = [
      { poNumber: { contains: search, mode: "insensitive" } },
      { supplier: { name: { contains: search, mode: "insensitive" } } },
    ];
  }
  if (branchId) where.branchId = branchId;
  if (supplierId) where.supplierId = supplierId;
  if (status) where.status = status;
  if (cylinderSize) where.cylinderSize = cylinderSize;
  if (dateFrom || dateTo) {
    where.poDate = {};
    if (dateFrom) where.poDate.gte = new Date(dateFrom);
    if (dateTo) where.poDate.lte = new Date(dateTo);
  }

  const [pos, total] = await Promise.all([
    prisma.supplierPo.findMany({
      where,
      include: {
        branch: { select: { id: true, code: true, name: true } },
        supplier: { select: { id: true, code: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: [{ poDate: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.supplierPo.count({ where }),
  ]);

  return NextResponse.json({
    pos,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

// ─── POST: create a new PO ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const errors: Record<string, string> = {};

  if (!body.branchId?.trim()) errors.branchId = "Branch is required.";
  if (!body.supplierId?.trim()) errors.supplierId = "Supplier is required.";
  if (!body.poDate) errors.poDate = "PO date is required.";
  if (!body.cylinderSize) errors.cylinderSize = "Cylinder size is required.";
  if (!body.orderedQty || body.orderedQty <= 0)
    errors.orderedQty = "Ordered quantity must be > 0.";
  if (body.pricePerUnit === undefined || body.pricePerUnit < 0)
    errors.pricePerUnit = "Price per unit must be ≥ 0.";

  const validSizes = ["KG12", "KG50"];
  if (body.cylinderSize && !validSizes.includes(body.cylinderSize))
    errors.cylinderSize = "Invalid cylinder size.";

  if (Object.keys(errors).length > 0)
    return NextResponse.json({ errors }, { status: 422 });

  // ── Auto-generate PO number if not provided ──
  let poNumber = body.poNumber?.trim();
  if (!poNumber) {
    const date = new Date(body.poDate);
    const yyyymm = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
    const branch = await prisma.branch.findUnique({
      where: { id: body.branchId },
      select: { code: true },
    });
    if (!branch)
      return NextResponse.json(
        { errors: { branchId: "Branch not found." } },
        { status: 422 },
      );

    const count = await prisma.supplierPo.count({
      where: {
        branchId: body.branchId,
        poDate: {
          gte: new Date(
            `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`,
          ),
          lt: new Date(date.getFullYear(), date.getMonth() + 1, 1),
        },
      },
    });
    poNumber = `PO-${branch.code}-${yyyymm}-${String(count + 1).padStart(4, "0")}`;
  }

  // ── Check duplicate poNumber ──
  const existing = await prisma.supplierPo.findUnique({ where: { poNumber } });
  if (existing)
    return NextResponse.json(
      { errors: { poNumber: `PO number "${poNumber}" already exists.` } },
      { status: 422 },
    );

  // ── Resolve createdById from session ──
  const user = await prisma.user.findUnique({
    where: { email: session.user?.email! },
    select: { id: true },
  });
  if (!user)
    return NextResponse.json(
      { error: "Session user not found." },
      { status: 401 },
    );

  try {
    const po = await prisma.supplierPo.create({
      data: {
        branchId: body.branchId,
        supplierId: body.supplierId,
        poNumber,
        poDate: new Date(body.poDate),
        cylinderSize: body.cylinderSize,
        orderedQty: Number(body.orderedQty),
        pricePerUnit: Number(body.pricePerUnit),
        confirmedQty: 0,
        receivedQty: 0,
        status: "DRAFT",
        notes: body.notes?.trim() || null,
        createdById: user.id,
      },
      include: {
        branch: { select: { id: true, code: true, name: true } },
        supplier: { select: { id: true, code: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(po, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002")
      return NextResponse.json(
        { errors: { poNumber: "PO number already exists." } },
        { status: 422 },
      );
    console.error(e);
    return NextResponse.json(
      { error: "Failed to create PO." },
      { status: 500 },
    );
  }
}
