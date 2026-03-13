// src/app/api/customers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search   = searchParams.get("search")   ?? "";
  const branch   = searchParams.get("branch")   ?? "";   // branchId
  const status   = searchParams.get("status")   ?? "";   // "active" | "inactive" | ""
  const type     = searchParams.get("type")      ?? "";   // CustomerType enum
  const page     = parseInt(searchParams.get("page") ?? "1");
  const pageSize = 20;

  const where: any = {};

  if (search) {
    where.OR = [
      { name:  { contains: search, mode: "insensitive" } },
      { code:  { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (branch)          where.branchId     = branch;
  if (status === "active")   where.isActive = true;
  if (status === "inactive") where.isActive = false;
  if (type)            where.customerType = type;

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: { branch: { select: { id: true, code: true, name: true } } },
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.customer.count({ where }),
  ]);

  return NextResponse.json({
    customers,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}