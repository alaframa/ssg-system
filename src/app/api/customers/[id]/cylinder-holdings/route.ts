// src/app/api/customers/[id]/cylinder-holdings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const holdings = await prisma.customerCylinderHolding.findMany({
    where:   { customerId: params.id },
    orderBy: { cylinderSize: "asc" },
  });

  return NextResponse.json(holdings);
}