// src/app/api/warehouse/inbound/[id]/route.ts
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

  const gr = await prisma.inboundReceiving.findUnique({
    where: { id: params.id },
    include: {
      branch: { select: { id: true, code: true, name: true } },
      supplierPo: {
        select: {
          id: true,
          poNumber: true,
          cylinderSize: true,
          orderedQty: true,
        },
      },
      receivedBy: { select: { id: true, name: true } },
    },
  });

  if (!gr)
    return NextResponse.json({ error: "Record not found." }, { status: 404 });

  return NextResponse.json(gr);
}
