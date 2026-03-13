// src/app/api/delivery-orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const branchId = searchParams.get("branch") ?? "";
  const status = searchParams.get("status") ?? "";
  const driver = searchParams.get("driver") ?? "";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = 20;

  const where: any = {};

  if (search) {
    where.OR = [
      { doNumber: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
      { driverName: { contains: search, mode: "insensitive" } },
    ];
  }
  if (branchId) where.branchId = branchId;
  if (status) where.status = status;
  if (driver) where.driverName = { contains: driver, mode: "insensitive" };
  if (dateFrom || dateTo) {
    where.doDate = {};
    if (dateFrom) where.doDate.gte = new Date(dateFrom);
    if (dateTo) where.doDate.lte = new Date(dateTo);
  }

  const [dos, total] = await Promise.all([
    prisma.deliveryOrder.findMany({
      where,
      include: {
        branch: { select: { id: true, code: true, name: true } },
        customer: { select: { id: true, code: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: [{ doDate: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.deliveryOrder.count({ where }),
  ]);

  return NextResponse.json({
    dos,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const errors: Record<string, string> = {};

  if (!body.poId?.trim()) errors.poId = "Purchase Order is required.";
  if (!body.doDate) errors.doDate = "DO date is required.";
  if (!body.orderedQty || body.orderedQty <= 0)
    errors.orderedQty = "Ordered quantity must be > 0.";

  if (Object.keys(errors).length > 0)
    return NextResponse.json({ errors }, { status: 422 });

  // ── Resolve PO — branch, cylinder, price, customer all come from here ──
  const po = await prisma.supplierPo.findUnique({
    where: { id: body.poId },
    select: {
      id: true,
      branchId: true,
      cylinderSize: true,
      pricePerUnit: true,
      customerId: true,
    },
  });
  if (!po)
    return NextResponse.json(
      { errors: { poId: "Purchase Order not found." } },
      { status: 422 },
    );

  // ── Auto-generate DO number ──
  let doNumber = body.doNumber?.trim();
  if (!doNumber) {
    const date = new Date(body.doDate);
    const yyyymm = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
    const branch = await prisma.branch.findUnique({
      where: { id: po.branchId },
      select: { code: true },
    });
    if (!branch)
      return NextResponse.json(
        { errors: { poId: "Branch not found for this PO." } },
        { status: 422 },
      );

    const count = await prisma.deliveryOrder.count({
      where: {
        branchId: po.branchId,
        doDate: {
          gte: new Date(
            `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`,
          ),
          lt: new Date(date.getFullYear(), date.getMonth() + 1, 1),
        },
      },
    });
    doNumber = `DO-${branch.code}-${yyyymm}-${String(count + 1).padStart(4, "0")}`;
  }

  const existing = await prisma.deliveryOrder.findUnique({
    where: { doNumber },
  });
  if (existing)
    return NextResponse.json(
      { errors: { doNumber: `DO number "${doNumber}" already exists.` } },
      { status: 422 },
    );

  // ── Resolve session user ──
  const user = await prisma.user.findUnique({
    where: { email: session.user?.email! },
    select: { id: true },
  });
  if (!user)
    return NextResponse.json(
      { error: "Session user not found." },
      { status: 401 },
    );

  // ── Build notes: helper name + soft PO reference ──
  let notes = body.notes?.trim() || "";
  if (body.helperName?.trim()) {
    notes = `helper: ${body.helperName.trim()}${notes ? `\n${notes}` : ""}`;
  }
  // Always store PO reference for sync on delivery
  notes = notes ? `${notes}\npo: ${body.poId}` : `po: ${body.poId}`;

  try {
    const doRecord = await prisma.deliveryOrder.create({
      data: {
        branchId: po.branchId,
        customerId: po.customerId,
        doNumber,
        doDate: new Date(body.doDate),
        cylinderSize: po.cylinderSize,
        orderedQty: Number(body.orderedQty),
        deliveredQty: 0,
        pricePerUnit: po.pricePerUnit,
        status: "PENDING",
        vehicleNo: body.vehicleNo?.trim() || null,
        driverName: body.driverName?.trim() || null,
        notes,
        createdById: user.id,
      },
      include: {
        branch: { select: { id: true, code: true, name: true } },
        customer: { select: { id: true, code: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(doRecord, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002")
      return NextResponse.json(
        { errors: { doNumber: "DO number already exists." } },
        { status: 422 },
      );
    console.error(e);
    return NextResponse.json(
      { error: "Failed to create DO." },
      { status: 500 },
    );
  }
}
