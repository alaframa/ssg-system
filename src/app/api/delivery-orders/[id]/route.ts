// src/app/api/delivery-orders/route.ts
// GET  /api/delivery-orders?branchId=&status=&poId=&search=&page=&limit=
// POST /api/delivery-orders — create DO, MUST reference a valid SupplierPo id

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId") ?? undefined;
  const poId = searchParams.get("poId") ?? undefined;
  const search = searchParams.get("search") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
  const statuses = searchParams.getAll("status");

  const where: any = {};
  if (branchId) where.branchId = branchId;
  if (statuses.length) where.status = { in: statuses };
  // poId is stored in notes as "po:<id>" — filter via notes contains
  if (poId) where.notes = { contains: poId };
  if (search) {
    where.OR = [
      { doNumber: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
      { driverName: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.deliveryOrder.count({ where }),
    prisma.deliveryOrder.findMany({
      where,
      include: {
        branch: { select: { id: true, code: true, name: true } },
        customer: { select: { id: true, code: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { doDate: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({ total, page, limit, rows });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const errors: Record<string, string> = {};

  // ── HARD RULE: DO cannot exist without a PO ──────────────────────────────
  if (!body.poId)
    errors.poId = "A Purchase Order is required to create a Delivery Order.";

  if (!body.branchId) errors.branchId = "Branch is required.";
  if (!body.customerId) errors.customerId = "Customer is required.";
  if (!body.doNumber?.trim()) errors.doNumber = "DO number is required.";
  if (!body.doDate) errors.doDate = "DO date is required.";
  if (!body.cylinderSize) errors.cylinderSize = "Cylinder size is required.";
  if (!body.orderedQty || Number(body.orderedQty) < 1)
    errors.orderedQty = "Ordered qty must be ≥ 1.";
  if (!body.pricePerUnit || Number(body.pricePerUnit) < 0)
    errors.pricePerUnit = "Price per unit is required.";

  if (Object.keys(errors).length)
    return NextResponse.json({ errors }, { status: 422 });

  // Verify PO exists and is not cancelled/completed already
  const po = await prisma.supplierPo.findUnique({ where: { id: body.poId } });
  if (!po)
    return NextResponse.json(
      { errors: { poId: "Purchase order not found." } },
      { status: 404 },
    );
  if (po.status === "CANCELLED")
    return NextResponse.json(
      { errors: { poId: "Cannot issue DO against a cancelled PO." } },
      { status: 422 },
    );

  const sessionUser = (session as any).user;
  const dbUser = await prisma.user.findFirst({
    where: { email: sessionUser?.email ?? "" },
    select: { id: true },
  });
  if (!dbUser)
    return NextResponse.json({ error: "User not found." }, { status: 401 });

  // Duplicate DO number check
  const dup = await prisma.deliveryOrder.findUnique({
    where: { doNumber: body.doNumber.trim() },
  });
  if (dup)
    return NextResponse.json(
      { errors: { doNumber: "DO number already exists." } },
      { status: 409 },
    );

  try {
    const doRecord = await prisma.deliveryOrder.create({
      data: {
        branchId: body.branchId,
        customerId: body.customerId,
        doNumber: body.doNumber.trim(),
        doDate: new Date(body.doDate + "T00:00:00.000Z"),
        cylinderSize: body.cylinderSize,
        orderedQty: Number(body.orderedQty),
        deliveredQty: 0,
        pricePerUnit: Number(body.pricePerUnit),
        status: "PENDING",
        driverName: body.driverName?.trim() || null,
        vehicleNo: body.vehicleNo?.trim() || null,
        // Store poId in notes for soft-link (existing schema has no poId FK)
        notes: `po:${body.poId}${body.notes ? "\n" + body.notes.trim() : ""}`,
        createdById: dbUser.id,
      },
      include: {
        branch: { select: { id: true, code: true, name: true } },
        customer: { select: { id: true, code: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    // Bump PO status to CONFIRMED if still SUBMITTED/DRAFT
    if (po.status === "DRAFT" || po.status === "SUBMITTED") {
      await prisma.supplierPo.update({
        where: { id: body.poId },
        data: { status: "CONFIRMED" },
      });
    }

    return NextResponse.json(doRecord, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002")
      return NextResponse.json(
        { errors: { doNumber: "DO number already exists." } },
        { status: 409 },
      );
    return NextResponse.json(
      { error: "Failed to create DO." },
      { status: 500 },
    );
  }
}
