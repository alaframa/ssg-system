// src/app/api/delivery-orders/[id]/route.ts
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

  const doRecord = await prisma.deliveryOrder.findUnique({
    where: { id: params.id },
    include: {
      branch: { select: { id: true, code: true, name: true } },
      customer: { select: { id: true, code: true, name: true } },
      createdBy: { select: { id: true, name: true } },
    },
  });

  if (!doRecord)
    return NextResponse.json(
      { error: "Delivery order not found." },
      { status: 404 },
    );

  return NextResponse.json(doRecord);
}

// ─── PATCH: update status / deliveredQty / driver info ───────────────────────
// KEY RULE: when status → DELIVERED, linked PO is auto-completed
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const validStatuses = [
    "PENDING",
    "IN_TRANSIT",
    "DELIVERED",
    "PARTIAL",
    "CANCELLED",
  ];
  if (body.status && !validStatuses.includes(body.status))
    return NextResponse.json({ error: "Invalid status." }, { status: 422 });

  // Fetch current DO (need notes to extract poId)
  const current = await prisma.deliveryOrder.findUnique({
    where: { id: params.id },
  });
  if (!current)
    return NextResponse.json(
      { error: "Delivery order not found." },
      { status: 404 },
    );

  const allowed = [
    "status",
    "deliveredQty",
    "driverName",
    "vehicleNo",
    "notes",
    "deliveredAt",
  ];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  // Auto-set deliveredAt when marking delivered
  if (body.status === "DELIVERED" && !data.deliveredAt) {
    data.deliveredAt = new Date();
  }

  // Derive deliveredQty for PO sync
  const deliveredQty =
    body.deliveredQty !== undefined
      ? Number(body.deliveredQty)
      : current.deliveredQty;

  try {
    const updated = await prisma.deliveryOrder.update({
      where: { id: params.id },
      data,
      include: {
        branch: { select: { id: true, code: true, name: true } },
        customer: { select: { id: true, code: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    // ── PO sync: when DO is delivered, close the linked PO ──────────────────
    if (body.status === "DELIVERED") {
      // Extract soft-linked poId from notes: "po: <id>"
      const notesText = current.notes ?? "";
      const poMatch = notesText.match(/\npo:\s*(\S+)|^po:\s*(\S+)/m);
      const poId = poMatch ? poMatch[1] || poMatch[2] : null;

      if (poId) {
        const po = await prisma.supplierPo.findUnique({ where: { id: poId } });
        if (po && po.status !== "COMPLETED" && po.status !== "CANCELLED") {
          const newReceivedQty = po.receivedQty + deliveredQty;
          const newStatus =
            newReceivedQty >= po.orderedQty
              ? "COMPLETED"
              : "PARTIALLY_RECEIVED";

          await prisma.supplierPo.update({
            where: { id: poId },
            data: { receivedQty: newReceivedQty, status: newStatus },
          });
        }
      }
    }

    return NextResponse.json(updated);
  } catch (e: any) {
    if (e.code === "P2025")
      return NextResponse.json(
        { error: "Delivery order not found." },
        { status: 404 },
      );
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }
}
