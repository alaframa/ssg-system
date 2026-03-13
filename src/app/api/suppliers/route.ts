// src/app/api/suppliers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { supplierPos: true, supplierHmtQuotas: true },
      },
    },
  });

  return NextResponse.json(suppliers);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const errors: Record<string, string> = {};

  if (!body.code?.trim()) errors.code = "Supplier code is required.";
  if (!body.name?.trim()) errors.name = "Supplier name is required.";

  if (Object.keys(errors).length > 0)
    return NextResponse.json({ errors }, { status: 422 });

  try {
    const supplier = await prisma.supplier.create({
      data: {
        code:     body.code.trim().toUpperCase(),
        name:     body.name.trim(),
        npwp:     body.npwp?.trim()    || null,
        address:  body.address?.trim() || null,
        phone:    body.phone?.trim()   || null,
        email:    body.email?.trim()   || null,
        isActive: body.isActive ?? true,
      },
    });
    return NextResponse.json(supplier, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002")
      return NextResponse.json({ errors: { code: "Supplier code already exists." } }, { status: 422 });
    return NextResponse.json({ error: "Failed to create supplier." }, { status: 500 });
  }
}