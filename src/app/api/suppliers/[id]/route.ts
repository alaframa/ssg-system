// src/app/api/suppliers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supplier = await prisma.supplier.findUnique({
    where: { id: params.id },
    include: {
      supplierHmtQuotas: {
        include: { branch: { select: { id: true, code: true, name: true } } },
        orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }, { cylinderSize: "asc" }],
      },
      _count: { select: { supplierPos: true } },
    },
  });

  if (!supplier)
    return NextResponse.json({ error: "Supplier not found." }, { status: 404 });

  return NextResponse.json(supplier);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body    = await req.json();
  const allowed = ["name", "npwp", "address", "phone", "email", "isActive"];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  try {
    const updated = await prisma.supplier.update({ where: { id: params.id }, data });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }
}