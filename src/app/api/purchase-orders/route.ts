// src/app/api/purchase-orders/route.ts
// GET  /api/purchase-orders?branchId=&status=&search=&page=&limit=
// POST /api/purchase-orders — create new PO (SSG → Customer)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId") ?? undefined;
  const search = searchParams.get("search") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
  const statuses = searchParams.getAll("status");

  const where: any = {};
  if (branchId) where.branchId = branchId;
  if (statuses.length) where.status = { in: statuses };
  if (search) {
    where.OR = [
      { poNumber: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
      { notes: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.supplierPo.count({ where }),
    prisma.supplierPo.findMany({
      where,
      include: {
        branch: { select: { id: true, code: true, name: true } },
        supplier: { select: { id: true, code: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        _count: { select: { inboundReceivings: true } },
      },
      orderBy: { poDate: "desc" },
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
  if (!body.supplierId) errors.supplierId = "Supplier is required.";
  if (!body.customerId) errors.customerId = "Customer is required.";
  if (!body.poNumber?.trim()) errors.poNumber = "PO number is required.";
  if (!body.poDate) errors.poDate = "PO date is required.";
  if (!body.cylinderSize) errors.cylinderSize = "Cylinder size is required.";
  if (!body.orderedQty || Number(body.orderedQty) < 1)
    errors.orderedQty = "Ordered qty must be ≥ 1.";
  if (
    body.pricePerUnit === undefined ||
    body.pricePerUnit === "" ||
    Number(body.pricePerUnit) < 0
  )
    errors.pricePerUnit = "Price per unit is required.";

  if (Object.keys(errors).length)
    return NextResponse.json({ errors }, { status: 422 });

  const sessionUser = (session as any).user;
  const dbUser = await prisma.user.findFirst({
    where: { email: sessionUser?.email ?? "" },
    select: { id: true },
  });
  if (!dbUser)
    return NextResponse.json({ error: "User not found." }, { status: 401 });

  // Duplicate PO number check
  const dup = await prisma.supplierPo.findUnique({
    where: { poNumber: body.poNumber.trim() },
  });
  if (dup)
    return NextResponse.json(
      { errors: { poNumber: "PO number already exists." } },
      { status: 409 },
    );

  try {
    const po = await prisma.supplierPo.create({
      data: {
        branchId: body.branchId,
        supplierId: body.supplierId,
        customerId: body.customerId, // ← SSG → Customer link
        poNumber: body.poNumber.trim(),
        poDate: new Date(body.poDate + "T00:00:00.000Z"),
        cylinderSize: body.cylinderSize,
        orderedQty: Number(body.orderedQty),
        confirmedQty: Number(body.confirmedQty ?? body.orderedQty),
        pricePerUnit: Number(body.pricePerUnit),
        status: body.status ?? "SUBMITTED",
        notes: body.notes?.trim() || null,
        createdById: dbUser.id,
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
        { status: 409 },
      );
    return NextResponse.json(
      { error: "Failed to create PO." },
      { status: 500 },
    );
  }
}
