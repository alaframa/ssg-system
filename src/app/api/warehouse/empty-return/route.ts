// src/app/api/warehouse/empty-return/route.ts
// GET  /api/warehouse/empty-return?branchId=&page=&limit=
// POST /api/warehouse/empty-return  — record return, bump WarehouseStock.emptyQty

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
    prisma.emptyReturn.count({ where }),
    prisma.emptyReturn.findMany({
      where,
      include: {
        branch: { select: { id: true, code: true, name: true } },
        recordedBy: { select: { id: true, name: true } },
      },
      orderBy: { returnDate: "desc" },
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
  if (!body.returnNumber) errors.returnNumber = "Return number is required.";
  if (!body.returnDate) errors.returnDate = "Return date is required.";
  if (!body.cylinderSize) errors.cylinderSize = "Cylinder size is required.";
  if (!body.returnedQty || body.returnedQty < 1)
    errors.returnedQty = "Returned qty must be ≥ 1.";
  if (!body.sourceType) errors.sourceType = "Source type is required.";

  if (Object.keys(errors).length > 0)
    return NextResponse.json({ errors }, { status: 422 });

  // Check return number unique
  const dup = await prisma.emptyReturn.findUnique({
    where: { returnNumber: body.returnNumber },
  });
  if (dup)
    return NextResponse.json(
      { error: "Return number already exists." },
      { status: 409 },
    );

  const sessionUser = (session as any).user;
  const dbUser = await prisma.user.findFirst({
    where: { email: sessionUser?.email ?? "" },
    select: { id: true },
  });
  if (!dbUser)
    return NextResponse.json({ error: "User not found." }, { status: 401 });

  const returnDate = new Date(body.returnDate + "T00:00:00.000Z");
  const returnedQty = Number(body.returnedQty);

  const result = await prisma.$transaction(async (tx) => {
    const ret = await tx.emptyReturn.create({
      data: {
        branchId: body.branchId,
        returnNumber: body.returnNumber,
        returnDate,
        cylinderSize: body.cylinderSize,
        returnedQty,
        sourceType: body.sourceType, // 'CUSTOMER' | 'DRIVER' | 'DEPOT'
        sourceRef: body.sourceRef ?? null,
        notes: body.notes ?? null,
        recordedById: dbUser.id,
      },
      include: {
        branch: { select: { id: true, code: true, name: true } },
        recordedBy: { select: { id: true, name: true } },
      },
    });

    // Bump today's WarehouseStock.emptyQty
    const existing = await tx.warehouseStock.findUnique({
      where: {
        branchId_cylinderSize_stockDate: {
          branchId: body.branchId,
          cylinderSize: body.cylinderSize,
          stockDate: returnDate,
        },
      },
    });

    if (existing) {
      await tx.warehouseStock.update({
        where: { id: existing.id },
        data: { emptyQty: existing.emptyQty + returnedQty },
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
          stockDate: returnDate,
          fullQty: latest?.fullQty ?? 0,
          emptyQty: (latest?.emptyQty ?? 0) + returnedQty,
          onTransitQty: latest?.onTransitQty ?? 0,
        },
      });
    }

    return ret;
  });

  return NextResponse.json(result, { status: 201 });
}
