// src/app/api/warehouse/inbound/route.ts
// GET  /api/warehouse/inbound?branchId=&page=&limit=
// POST /api/warehouse/inbound — create GR, bump WarehouseStock.fullQty, update PO receivedQty

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId") ?? undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "30"));

  const where = { ...(branchId && { branchId }) };

  const [total, rows] = await Promise.all([
    prisma.inboundReceiving.count({ where }),
    prisma.inboundReceiving.findMany({
      where,
      include: {
        branch: { select: { id: true, code: true, name: true } },
        supplierPo: { select: { id: true, poNumber: true } },
        receivedBy: { select: { id: true, name: true } },
      },
      orderBy: { receivedDate: "desc" },
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

  if (!body.branchId) errors.branchId = "Branch is required.";
  if (!body.supplierPoId) errors.supplierPoId = "PO is required.";
  if (!body.grNumber) errors.grNumber = "GR number is required.";
  if (!body.receivedDate) errors.receivedDate = "Date is required.";
  if (!body.cylinderSize) errors.cylinderSize = "Cylinder size is required.";
  if (!body.receivedQty || body.receivedQty < 1)
    errors.receivedQty = "Received qty must be ≥ 1.";
  if (body.goodQty === undefined || body.goodQty === null || body.goodQty < 0)
    errors.goodQty = "Good qty is required.";
  if (Number(body.goodQty) > Number(body.receivedQty))
    errors.goodQty = "Good qty cannot exceed received qty.";

  if (Object.keys(errors).length > 0)
    return NextResponse.json({ errors }, { status: 422 });

  // Duplicate GR number check
  const dup = await prisma.inboundReceiving.findUnique({
    where: { grNumber: body.grNumber },
  });
  if (dup)
    return NextResponse.json(
      { error: "GR number already exists." },
      { status: 409 },
    );

  const sessionUser = (session as any).user;
  const dbUser = await prisma.user.findFirst({
    where: { email: sessionUser?.email ?? "" },
    select: { id: true },
  });
  if (!dbUser)
    return NextResponse.json({ error: "User not found." }, { status: 401 });

  const receivedDate = new Date(body.receivedDate + "T00:00:00.000Z");
  const receivedQty = Number(body.receivedQty);
  const goodQty = Number(body.goodQty);
  const rejectQty = receivedQty - goodQty;

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create GR record
    const gr = await tx.inboundReceiving.create({
      data: {
        branchId: body.branchId,
        supplierPoId: body.supplierPoId,
        grNumber: body.grNumber,
        receivedDate,
        cylinderSize: body.cylinderSize,
        receivedQty,
        goodQty,
        rejectQty,
        notes: body.notes ?? null,
        receivedById: dbUser.id,
      },
      include: {
        branch: { select: { id: true, code: true, name: true } },
        supplierPo: { select: { id: true, poNumber: true } },
        receivedBy: { select: { id: true, name: true } },
      },
    });

    // 2. Upsert WarehouseStock — add goodQty to fullQty for today
    const existing = await tx.warehouseStock.findUnique({
      where: {
        branchId_cylinderSize_stockDate: {
          branchId: body.branchId,
          cylinderSize: body.cylinderSize,
          stockDate: receivedDate,
        },
      },
    });

    if (existing) {
      await tx.warehouseStock.update({
        where: { id: existing.id },
        data: { fullQty: existing.fullQty + goodQty },
      });
    } else {
      // Carry forward latest snapshot
      const latest = await tx.warehouseStock.findFirst({
        where: { branchId: body.branchId, cylinderSize: body.cylinderSize },
        orderBy: { stockDate: "desc" },
      });
      await tx.warehouseStock.create({
        data: {
          branchId: body.branchId,
          cylinderSize: body.cylinderSize,
          stockDate: receivedDate,
          fullQty: (latest?.fullQty ?? 0) + goodQty,
          emptyQty: latest?.emptyQty ?? 0,
          onTransitQty: latest?.onTransitQty ?? 0,
        },
      });
    }

    // 3. Update PO receivedQty — increment
    const po = await tx.supplierPo.findUnique({
      where: { id: body.supplierPoId },
      select: { receivedQty: true, orderedQty: true },
    });
    if (po) {
      const newReceived = (po.receivedQty ?? 0) + goodQty;
      const newStatus =
        newReceived >= po.orderedQty ? "COMPLETED" : "PARTIALLY_RECEIVED";
      await tx.supplierPo.update({
        where: { id: body.supplierPoId },
        data: { receivedQty: newReceived, status: newStatus },
      });
    }

    return gr;
  });

  return NextResponse.json(result, { status: 201 });
}
