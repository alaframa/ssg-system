// src/app/api/suppliers/[id]/hmt-quota/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

// GET — list all quotas for this supplier, optionally filtered by year/month
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year  = searchParams.get("year")  ? parseInt(searchParams.get("year")!)  : undefined;
  const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : undefined;

  const quotas = await prisma.supplierHmtQuota.findMany({
    where: {
      supplierId:  params.id,
      ...(year  !== undefined && { periodYear:  year  }),
      ...(month !== undefined && { periodMonth: month }),
    },
    include: { branch: { select: { id: true, code: true, name: true } } },
    orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }, { branchId: "asc" }, { cylinderSize: "asc" }],
  });

  return NextResponse.json(quotas);
}

// PUT — upsert a single quota entry
// Body: { branchId, cylinderSize, periodMonth, periodYear, quotaQty, pricePerUnit }
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body   = await req.json();
  const errors: Record<string, string> = {};

  if (!body.branchId)      errors.branchId      = "Branch is required.";
  if (!body.cylinderSize)  errors.cylinderSize  = "Cylinder size is required.";
  if (!body.periodMonth || body.periodMonth < 1 || body.periodMonth > 12)
                           errors.periodMonth   = "Month must be 1–12.";
  if (!body.periodYear || body.periodYear < 2020)
                           errors.periodYear    = "Year must be 2020 or later.";
  if (body.quotaQty === undefined || body.quotaQty < 0)
                           errors.quotaQty      = "Quota must be ≥ 0.";
  if (body.pricePerUnit === undefined || body.pricePerUnit < 0)
                           errors.pricePerUnit  = "Price per unit must be ≥ 0.";

  if (Object.keys(errors).length > 0)
    return NextResponse.json({ errors }, { status: 422 });

  const quota = await prisma.supplierHmtQuota.upsert({
    where: {
      supplierId_branchId_cylinderSize_periodMonth_periodYear: {
        supplierId:   params.id,
        branchId:     body.branchId,
        cylinderSize: body.cylinderSize,
        periodMonth:  body.periodMonth,
        periodYear:   body.periodYear,
      },
    },
    create: {
      supplierId:   params.id,
      branchId:     body.branchId,
      cylinderSize: body.cylinderSize,
      periodMonth:  body.periodMonth,
      periodYear:   body.periodYear,
      quotaQty:     body.quotaQty,
      pricePerUnit: body.pricePerUnit,
      usedQty:      0,
    },
    update: {
      quotaQty:     body.quotaQty,
      pricePerUnit: body.pricePerUnit,
    },
    include: { branch: { select: { id: true, code: true, name: true } } },
  });

  return NextResponse.json(quota);
}
