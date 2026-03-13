// src/app/api/customers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

// ─── GET (list + filter, existing) ───────────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search   = searchParams.get("search")   ?? "";
  const branch   = searchParams.get("branch")   ?? "";
  const status   = searchParams.get("status")   ?? "";
  const type     = searchParams.get("type")     ?? "";
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
  if (branch)               where.branchId     = branch;
  if (status === "active")   where.isActive     = true;
  if (status === "inactive") where.isActive     = false;
  if (type)                 where.customerType = type;

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: { branch: { select: { id: true, code: true, name: true } } },
      orderBy: { name: "asc" },
      skip:    (page - 1) * pageSize,
      take:    pageSize,
    }),
    prisma.customer.count({ where }),
  ]);

  return NextResponse.json({ customers, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

// ─── POST (create single customer) ───────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // ── Validate required fields ──
  const errors: Record<string, string> = {};

  if (!body.branchId?.trim())     errors.branchId     = "Branch is required.";
  if (!body.name?.trim())         errors.name         = "Name is required.";
  if (!body.customerType?.trim()) errors.customerType = "Customer type is required.";

  const validTypes = ["RETAIL", "AGEN", "INDUSTRI"];
  if (body.customerType && !validTypes.includes(body.customerType)) {
    errors.customerType = "Must be RETAIL, AGEN, or INDUSTRI.";
  }

  // Address required for AGEN / INDUSTRI
  if (["AGEN", "INDUSTRI"].includes(body.customerType) && !body.address?.trim()) {
    errors.address = "Address is required for Agen and Industri customers.";
  }

  // Phone: must be Indonesian format if provided
  if (body.phone?.trim()) {
    const phoneClean = body.phone.replace(/\s+/g, "");
    if (!/^(\+62|62|0)[0-9]{8,13}$/.test(phoneClean)) {
      errors.phone = "Phone must be Indonesian format, e.g. 0812xxxxxxx or +62812xxxxxxx.";
    }
  }

  // Email format
  if (body.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    errors.email = "Invalid email format.";
  }

  // Credit limit: must be >= 0
  if (body.creditLimit !== undefined && body.creditLimit !== "") {
    if (isNaN(Number(body.creditLimit)) || Number(body.creditLimit) < 0) {
      errors.creditLimit = "Credit limit must be a non-negative number.";
    }
  }

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  // ── Generate customer code if not provided ──
  let code = body.code?.trim();
  if (!code) {
    // Auto-generate: fetch branch code, count existing customers in branch
    const branch = await prisma.branch.findUnique({ where: { id: body.branchId }, select: { code: true } });
    if (!branch) return NextResponse.json({ errors: { branchId: "Branch not found." } }, { status: 422 });
    const count = await prisma.customer.count({ where: { branchId: body.branchId } });
    const seq = String(count + 1).padStart(4, "0");
    const typePrefix = body.customerType === "RETAIL" ? "RET" : body.customerType === "AGEN" ? "AGN" : "IND";
    code = `${branch.code}-${typePrefix}-${seq}`;
  }

  // ── Check duplicate code ──
  const existing = await prisma.customer.findUnique({ where: { code } });
  if (existing) return NextResponse.json({ errors: { code: `Customer code "${code}" already exists.` } }, { status: 422 });

  try {
    const customer = await prisma.customer.create({
      data: {
        branchId:     body.branchId,
        code,
        name:         body.name.trim(),
        customerType: body.customerType,
        phone:        body.phone?.trim()  || null,
        email:        body.email?.trim()  || null,
        address:      body.address?.trim() || null,
        npwp:         body.npwp?.trim()   || null,
        creditLimit:  Number(body.creditLimit) || 0,
        isActive:     body.isActive ?? true,
      },
      include: { branch: { select: { id: true, code: true, name: true } } },
    });
    return NextResponse.json(customer, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ errors: { code: "Customer code already exists." } }, { status: 422 });
    }
    console.error(e);
    return NextResponse.json({ error: "Failed to create customer." }, { status: 500 });
  }
}