// src/app/api/customer-pos/[id]/route.ts
// GET   /api/customer-pos/:id  — single PO with DOs
// PATCH /api/customer-pos/:id  — update status / confirmedQty

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const po = await prisma.customerPo.findUnique({
    where: { id: params.id },
    include: {
      branch: { select: { id: true, code: true, name: true } },
      customer: { select: { id: true, code: true, name: true, phone: true } },
      createdBy: { select: { id: true, name: true } },
      deliveryOrders: {
        select: {
          id: true,
          doNumber: true,
          doDate: true,
          cylinderSize: true,
          orderedQty: true,
          deliveredQty: true,
          status: true,
          driverName: true,
        },
        orderBy: { doDate: "desc" },
      },
    },
  });

  if (!po) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json(po);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const po = await prisma.customerPo.findUnique({ where: { id: params.id } });
  if (!po) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const validStatuses = [
    "DRAFT",
    "SUBMITTED",
    "CONFIRMED",
    "PARTIALLY_RECEIVED",
    "COMPLETED",
    "CANCELLED",
  ];
  if (body.status && !validStatuses.includes(body.status))
    return NextResponse.json({ error: "Invalid status." }, { status: 422 });

  const updated = await prisma.customerPo.update({
    where: { id: params.id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.confirmedQty !== undefined && {
        confirmedQty: Number(body.confirmedQty),
      }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
    include: {
      branch: { select: { id: true, code: true, name: true } },
      customer: { select: { id: true, code: true, name: true } },
    },
  });

  return NextResponse.json(updated);
}
