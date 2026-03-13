// src/app/api/warehouse/writeoff/route.ts
// GET  /api/warehouse/writeoff?branchId=&page=&limit=
// POST /api/warehouse/writeoff  — create WO, decrement fullQty, bump HMT usedQty

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
    prisma.cylinderWriteoff.count({ where }),
    prisma.cylinderWriteoff.findMany({
      where,
      include: {
        branch: { select: { id: true, code: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
      },
      orderBy: { writeoffDate: "desc" },
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
  if (!body.writeoffNumber)
    errors.writeoffNumber = "Write-off number is required.";
  if (!body.writeoffDate) errors.writeoffDate = "Date is required.";
  if (!body.cylinderSize) errors.cylinderSize = "Cylinder size is required.";
  if (!body.qty || body.qty < 1) errors.qty = "Qty must be ≥ 1.";
  if (!body.reason) errors.reason = "Reason is required.";

  const VALID_REASONS = [
    "RUSAK_BERAT",
    "HILANG",
    "KADALUARSA_UJI",
    "BOCOR_PARAH",
  ];
  if (body.reason && !VALID_REASONS.includes(body.reason))
    errors.reason = `Must be one of: ${VALID_REASONS.join(", ")}`;

  if (Object.keys(errors).length > 0)
    return NextResponse.json({ errors }, { status: 422 });

  // Unique check
  const dup = await prisma.cylinderWriteoff.findUnique({
    where: { writeoffNumber: body.writeoffNumber },
  });
  if (dup)
    return NextResponse.json(
      { error: "Write-off number already exists." },
      { status: 409 },
    );

  const sessionUser = (session as any).user;
  const dbUser = await prisma.user.findFirst({
    where: { email: sessionUser?.email ?? "" },
    select: { id: true },
  });
  if (!dbUser)
    return NextResponse.json({ error: "User not found." }, { status: 401 });

  const writeoffDate = new Date(body.writeoffDate + "T00:00:00.000Z");
  const qty = Number(body.qty);
  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const wo = await tx.cylinderWriteoff.create({
      data: {
        branchId: body.branchId,
        writeoffNumber: body.writeoffNumber,
        writeoffDate,
        cylinderSize: body.cylinderSize,
        qty,
        reason: body.reason,
        serialNumbers: body.serialNumbers ?? null,
        notes: body.notes ?? null,
        createdById: dbUser.id,
      },
      include: {
        branch: { select: { id: true, code: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    // Decrement WarehouseStock.fullQty
    const existing = await tx.warehouseStock.findUnique({
      where: {
        branchId_cylinderSize_stockDate: {
          branchId: body.branchId,
          cylinderSize: body.cylinderSize,
          stockDate: writeoffDate,
        },
      },
    });

    if (existing) {
      await tx.warehouseStock.update({
        where: { id: existing.id },
        data: { fullQty: Math.max(0, existing.fullQty - qty) },
      });
    } else {
      const latest = await tx.warehouseStock.findFirst({
        where: { branchId: body.branchId, cylinderSize: body.cylinderSize },
        orderBy: { stockDate: "desc" },
      });
      await tx.warehouseStock.create({
        data: {
          branchId: body.branchId,
          cylinderSize: body.cylinderSize,
          stockDate: writeoffDate,
          fullQty: Math.max(0, (latest?.fullQty ?? 0) - qty),
          emptyQty: latest?.emptyQty ?? 0,
          onTransitQty: latest?.onTransitQty ?? 0,
        },
      });
    }

    // Bump HMT usedQty for current month
    await tx.supplierHmtQuota.updateMany({
      where: {
        branchId: body.branchId,
        cylinderSize: body.cylinderSize,
        periodMonth: now.getMonth() + 1,
        periodYear: now.getFullYear(),
      },
      data: { usedQty: { increment: qty } },
    });

    return wo;
  });

  return NextResponse.json(result, { status: 201 });
}
