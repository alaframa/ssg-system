// src/app/api/branches/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const branches = await prisma.branch.findMany({
    select: { id: true, code: true, name: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(branches);
}