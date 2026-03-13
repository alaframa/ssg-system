// src/app/api/purchase-orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const po = await prisma.supplierPo.findUnique({
    where: { id: params.id },
    include: {
      branch:             { select: { id: true, code: true, name: true } },
      supplier:           { select: { id: true, code: true, name: true } },
      createdBy:          { select: { id: true, name: true } },
      inboundReceivings:  {
        orderBy: { receivedDate: "desc" },
        include: { receivedBy: { select: { id: true, name: true } } },
      },
    },
  });

  if (!po)
    return NextResponse.json({ error: "Purchase order not found." }, { status: 404 });

  return NextResponse.json(po);
}

// PATCH: update status, confirmedQty, notes
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body    = await req.json();
  const allowed = ["status", "confirmedQty", "notes", "pricePerUnit", "orderedQty"];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  const validStatuses = ["DRAFT", "SUBMITTED", "CONFIRMED", "PARTIALLY_RECEIVED", "COMPLETED", "CANCELLED"];
  if (data.status && !validStatuses.includes(data.status as string))
    return NextResponse.json({ error: "Invalid status." }, { status: 422 });

  try {
    const updated = await prisma.supplierPo.update({
      where: { id: params.id },
      data,
      include: {
        branch:    { select: { id: true, code: true, name: true } },
        supplier:  { select: { id: true, code: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    if (e.code === "P2025")
      return NextResponse.json({ error: "Purchase order not found." }, { status: 404 });
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }
}