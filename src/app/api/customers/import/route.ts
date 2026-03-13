// src/app/api/customers/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";

// ── Types ──────────────────────────────────────────────────────────────────────
interface ImportRow {
  branch_code:    string;
  customer_code:  string;
  name:           string;
  customer_type:  string;
  phone?:         string;
  email?:         string;
  address?:       string;
  npwp?:          string;
  credit_limit?:  string | number;
  is_active?:     string | boolean;
}

interface RowResult {
  row:     number;
  code:    string;
  name:    string;
  status:  "imported" | "skipped" | "error";
  reason?: string;
}

// ── Validation helpers ─────────────────────────────────────────────────────────
const VALID_BRANCHES  = ["SBY", "YOG"] as const;
const VALID_TYPES     = ["RETAIL", "AGEN", "INDUSTRI"] as const;
const PHONE_RE        = /^(\+62|62|0)[0-9]{8,13}$/;
const EMAIL_RE        = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function str(v: unknown): string { return String(v ?? "").trim(); }
function parseBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  return ["true", "1", "yes", "aktif", "active"].includes(String(v).toLowerCase().trim());
}

// ── POST handler ───────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Parse multipart form data
  const formData = await req.formData();
  const file     = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file uploaded." }, { status: 400 });

  const buffer    = Buffer.from(await file.arrayBuffer());
  const workbook  = XLSX.read(buffer, { type: "buffer" });

  // Accept sheet named "CUSTOMERS" or first sheet
  const sheetName = workbook.SheetNames.includes("CUSTOMERS")
    ? "CUSTOMERS"
    : workbook.SheetNames[0];

  const worksheet = workbook.Sheets[sheetName];

  // Read from row 4 onwards (rows 1-3 are title/header/notes in template)
  const rawRows = XLSX.utils.sheet_to_json<ImportRow>(worksheet, {
    header: ["branch_code","customer_code","name","customer_type","phone","email","address","npwp","credit_limit","is_active"],
    range:  3, // 0-indexed: skip rows 0,1,2 (rows 1,2,3 in Excel)
    defval: "",
  });

  if (rawRows.length > 500) {
    return NextResponse.json({ error: "Max 500 rows per import." }, { status: 400 });
  }

  // Prefetch branches into a map { "SBY": id, "YOG": id }
  const branches = await prisma.branch.findMany({ select: { id: true, code: true } });
  const branchMap: Record<string, string> = {};
  for (const b of branches) branchMap[b.code] = b.id;

  // Prefetch existing customer codes to detect dupes quickly
  const existingCodes = new Set(
    (await prisma.customer.findMany({ select: { code: true } })).map((c) => c.code)
  );

  const results:   RowResult[] = [];
  const toCreate:  Parameters<typeof prisma.customer.create>[0]["data"][] = [];
  const seenCodes = new Set<string>(); // dupes within the same file

  for (let i = 0; i < rawRows.length; i++) {
    const row     = rawRows[i];
    const rowNum  = i + 4; // 1-indexed, accounting for 3 header rows
    const code    = str(row.customer_code);
    const name    = str(row.name);
    const brCode  = str(row.branch_code).toUpperCase();
    const custType = str(row.customer_type).toUpperCase();

    // Skip completely empty rows
    if (!code && !name && !brCode) continue;

    // Required field checks
    if (!brCode || !VALID_BRANCHES.includes(brCode as any)) {
      results.push({ row: rowNum, code, name, status: "error", reason: `Invalid branch_code "${brCode}". Must be SBY or YOG.` });
      continue;
    }
    if (!code) {
      results.push({ row: rowNum, code, name, status: "error", reason: "customer_code is required." });
      continue;
    }
    if (!name) {
      results.push({ row: rowNum, code, name, status: "error", reason: "name is required." });
      continue;
    }
    if (!VALID_TYPES.includes(custType as any)) {
      results.push({ row: rowNum, code, name, status: "error", reason: `Invalid customer_type "${custType}". Must be RETAIL, AGEN, or INDUSTRI.` });
      continue;
    }

    // Duplicate detection
    if (existingCodes.has(code) || seenCodes.has(code)) {
      results.push({ row: rowNum, code, name, status: "skipped", reason: `Customer code "${code}" already exists — skipped.` });
      continue;
    }

    // Optional field validation
    const phone = str(row.phone).replace(/\s+/g, "");
    if (phone && !PHONE_RE.test(phone)) {
      results.push({ row: rowNum, code, name, status: "error", reason: `Invalid phone "${phone}". Expected Indonesian format.` });
      continue;
    }
    const email = str(row.email);
    if (email && !EMAIL_RE.test(email)) {
      results.push({ row: rowNum, code, name, status: "error", reason: `Invalid email "${email}".` });
      continue;
    }
    const address = str(row.address);
    if (["AGEN", "INDUSTRI"].includes(custType) && !address) {
      results.push({ row: rowNum, code, name, status: "error", reason: "Address is required for AGEN and INDUSTRI." });
      continue;
    }
    const creditLimit = Number(row.credit_limit) || 0;
    if (creditLimit < 0) {
      results.push({ row: rowNum, code, name, status: "error", reason: "credit_limit must be >= 0." });
      continue;
    }

    seenCodes.add(code);
    toCreate.push({
      branchId:     branchMap[brCode],
      code,
      name,
      customerType: custType as any,
      phone:        phone   || null,
      email:        email   || null,
      address:      address || null,
      npwp:         str(row.npwp) || null,
      creditLimit,
      isActive:     parseBool(row.is_active ?? true),
    });
    results.push({ row: rowNum, code, name, status: "imported" });
  }

  // Bulk insert in chunks of 50 to avoid overwhelming the DB
  let importedCount = 0;
  const CHUNK = 50;
  for (let i = 0; i < toCreate.length; i += CHUNK) {
    const chunk = toCreate.slice(i, i + CHUNK);
    await prisma.customer.createMany({ data: chunk as any, skipDuplicates: true });
    importedCount += chunk.length;
  }

  const skippedCount = results.filter((r) => r.status === "skipped").length;
  const errorCount   = results.filter((r) => r.status === "error").length;

  return NextResponse.json({
    summary: {
      total:    rawRows.length,
      imported: importedCount,
      skipped:  skippedCount,
      errors:   errorCount,
    },
    results,
  });
}