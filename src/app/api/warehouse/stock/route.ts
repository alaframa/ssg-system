// src/app/api/warehouse/stock/route.ts
// GET  /api/warehouse/stock?branchId=&date=YYYY-MM-DD
//      Returns latest snapshot per cylinderSize for the branch.
//      If no date given, returns today's or latest available.
// POST /api/warehouse/stock
//      Upsert a stock snapshot (manual adjustment or daily close).

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId");
  const dateStr = searchParams.get("date"); // YYYY-MM-DD optional

  if (!branchId)
    return NextResponse.json(
      { error: "branchId is required." },
      { status: 400 },
    );

  // If date given, find that exact snapshot; otherwise latest per cylinderSize
  if (dateStr) {
    const stockDate = new Date(dateStr + "T00:00:00.000Z");
    const rows = await prisma.warehouseStock.findMany({
      where: { branchId, stockDate },
      orderBy: { cylinderSize: "asc" },
    });
    return NextResponse.json(rows);
  }

  // Latest snapshot per cylinder size — subquery via raw or just get last 90 days
  const rows = await prisma.warehouseStock.findMany({
    where: {
      branchId,
      stockDate: { gte: new Date(Date.now() - 90 * 86400_000) },
    },
    orderBy: { stockDate: "desc" },
  });

  // De-dupe: keep only the latest record per cylinderSize
  const latest = new Map<string, (typeof rows)[0]>();
  for (const r of rows) {
    if (!latest.has(r.cylinderSize)) latest.set(r.cylinderSize, r);
  }

  return NextResponse.json(Array.from(latest.values()));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { branchId, cylinderSize, stockDate, fullQty, emptyQty, onTransitQty } =
    body;

  if (!branchId || !cylinderSize || !stockDate)
    return NextResponse.json(
      { error: "branchId, cylinderSize, stockDate required." },
      { status: 400 },
    );

  const date = new Date(stockDate + "T00:00:00.000Z");

  const row = await prisma.warehouseStock.upsert({
    where: {
      branchId_cylinderSize_stockDate: {
        branchId,
        cylinderSize,
        stockDate: date,
      },
    },
    create: {
      branchId,
      cylinderSize,
      stockDate: date,
      fullQty: Number(fullQty ?? 0),
      emptyQty: Number(emptyQty ?? 0),
      onTransitQty: Number(onTransitQty ?? 0),
    },
    update: {
      fullQty: Number(fullQty ?? 0),
      emptyQty: Number(emptyQty ?? 0),
      onTransitQty: Number(onTransitQty ?? 0),
    },
  });

  return NextResponse.json(row, { status: 201 });
}
