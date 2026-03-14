// src/app/api/customer-pos/route.ts
// GET  /api/customer-pos?branchId=&status=&customerId=&search=&page=&limit=
// POST /api/customer-pos — create new Customer PO (customer orders from SSG)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId") ?? undefined;
  const customerId = searchParams.get("customerId") ?? undefined;
  const search = searchParams.get("search") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
  const statuses = searchParams.getAll("status");

  const where: any = {};
  if (branchId) where.branchId = branchId;
  if (customerId) where.customerId = customerId;
  if (statuses.length) where.status = { in: statuses };
  if (search) {
    where.OR = [
      { poNumber: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
      { notes: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.customerPo.count({ where }),
    prisma.customerPo.findMany({
      where,
      include: {
        branch: { select: { id: true, code: true, name: true } },
        customer: { select: { id: true, code: true, name: true, phone: true } },
        createdBy: { select: { id: true, name: true } },
        _count: { select: { deliveryOrders: true } },
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
  const dup = await prisma.customerPo.findUnique({
    where: { poNumber: body.poNumber.trim() },
  });
  if (dup)
    return NextResponse.json(
      { errors: { poNumber: "PO number already exists." } },
      { status: 409 },
    );

  try {
    const po = await prisma.customerPo.create({
      data: {
        branchId: body.branchId,
        customerId: body.customerId,
        poNumber: body.poNumber.trim(),
        poDate: new Date(body.poDate + "T00:00:00.000Z"),
        cylinderSize: body.cylinderSize,
        orderedQty: Number(body.orderedQty),
        confirmedQty: Number(body.confirmedQty ?? body.orderedQty),
        fulfilledQty: 0,
        pricePerUnit: Number(body.pricePerUnit),
        status: "SUBMITTED",
        orderChannel: body.orderChannel ?? "WHATSAPP",
        notes: body.notes?.trim() || null,
        createdById: dbUser.id,
      },
      include: {
        branch: { select: { id: true, code: true, name: true } },
        customer: { select: { id: true, code: true, name: true, phone: true } },
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
      { error: "Failed to create Customer PO." },
      { status: 500 },
    );
  }
}
