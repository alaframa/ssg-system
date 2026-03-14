// prisma/seed-warehouse-additions.ts
// ─────────────────────────────────────────────────────────────────────────────
// WAREHOUSE SEED ADDITIONS — based on March 2026 Excel documents:
//   03__LAPORAN_STOCK_TABUNG_SSG_MARET_2026.xlsx  → WarehouseStock
//   03__SSSSG__PO_ARSY_MARET_2026.xlsx            → SupplierPo (166 POs)
//   03__REKAP_PO_KIRIM__AMBIL_TABUNG_MARET_2026.xlsx → EmptyReturn (daily aggregate)
//   03__Gasback_SSG__Konsumen_Maret_2026.xlsx     → GasbackLedger totals confirmed
//
// HOW TO USE:
//   Paste the WAREHOUSE_SEED_ADDITIONS() call at the BOTTOM of main() in prisma/seed.ts,
//   just before the final summary console.log.
//
//   OR run this file standalone:
//     npx tsx prisma/seed-warehouse-additions.ts
// ─────────────────────────────────────────────────────────────────────────────

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

// ─── SupplierPo data — extracted from 03__SSSSG__PO_ARSY_MARET_2026.xlsx ───
// 166 unique PO numbers from sheets 2–12 (dates March 2–12 2026)
// cylinderSize: KG12 if rel12>0, KG50 if rel50>0
// pricePerUnit: KG12 = 175,500 IDR/unit | KG50 = 604,700 IDR/unit (HMT March 2026)
const SUPPLIER_POS: {
  poNumber: string;
  date: string;
  cylinderSize: "KG12" | "KG50";
  orderedQty: number;
}[] = [
  // ── Sheet 2 (2026-03-02) ──
  {
    poNumber: "PO-2026-02-5640",
    date: "2026-03-02",
    cylinderSize: "KG50",
    orderedQty: 5,
  },
  {
    poNumber: "PO-2026-02-5820",
    date: "2026-03-02",
    cylinderSize: "KG12",
    orderedQty: 25,
  },
  {
    poNumber: "PO-2026-02-5826",
    date: "2026-03-02",
    cylinderSize: "KG50",
    orderedQty: 4,
  },
  {
    poNumber: "PO-2026-03-18",
    date: "2026-03-02",
    cylinderSize: "KG12",
    orderedQty: 2,
  },
  {
    poNumber: "PO-2026-03-38",
    date: "2026-03-02",
    cylinderSize: "KG12",
    orderedQty: 3,
  },
  {
    poNumber: "PO-2026-03-114",
    date: "2026-03-02",
    cylinderSize: "KG12",
    orderedQty: 5,
  },
  {
    poNumber: "PO-2026-03-118",
    date: "2026-03-02",
    cylinderSize: "KG12",
    orderedQty: 4,
  },
  {
    poNumber: "PO-2026-03-144",
    date: "2026-03-02",
    cylinderSize: "KG50",
    orderedQty: 3,
  },
  {
    poNumber: "PO-2026-03-170",
    date: "2026-03-02",
    cylinderSize: "KG12",
    orderedQty: 6,
  },
  {
    poNumber: "PO-2026-03-178",
    date: "2026-03-02",
    cylinderSize: "KG12",
    orderedQty: 15,
  },
  {
    poNumber: "PO-2026-03-215",
    date: "2026-03-02",
    cylinderSize: "KG12",
    orderedQty: 4,
  },
  // ── Sheet 3 (2026-03-03) ──
  {
    poNumber: "PO-2026-03-14",
    date: "2026-03-03",
    cylinderSize: "KG50",
    orderedQty: 6,
  },
  {
    poNumber: "PO-2026-03-23",
    date: "2026-03-03",
    cylinderSize: "KG50",
    orderedQty: 3,
  },
  {
    poNumber: "PO-2026-03-171",
    date: "2026-03-03",
    cylinderSize: "KG12",
    orderedQty: 20,
  },
  {
    poNumber: "PO-2026-03-186",
    date: "2026-03-03",
    cylinderSize: "KG12",
    orderedQty: 35,
  },
  {
    poNumber: "PO-2026-02-5524",
    date: "2026-03-03",
    cylinderSize: "KG12",
    orderedQty: 1,
  },
  {
    poNumber: "PO-2026-03-354",
    date: "2026-03-03",
    cylinderSize: "KG12",
    orderedQty: 1,
  },
  {
    poNumber: "PO-2026-03-222",
    date: "2026-03-03",
    cylinderSize: "KG50",
    orderedQty: 4,
  },
  {
    poNumber: "PO-2026-03-254",
    date: "2026-03-03",
    cylinderSize: "KG12",
    orderedQty: 4,
  },
  {
    poNumber: "PO-2026-03-256",
    date: "2026-03-03",
    cylinderSize: "KG50",
    orderedQty: 2,
  },
  {
    poNumber: "PO-2026-03-277",
    date: "2026-03-03",
    cylinderSize: "KG12",
    orderedQty: 4,
  },
  {
    poNumber: "PO-2026-03-305",
    date: "2026-03-03",
    cylinderSize: "KG12",
    orderedQty: 30,
  },
  {
    poNumber: "PO-2026-03-379",
    date: "2026-03-03",
    cylinderSize: "KG12",
    orderedQty: 7,
  },
  {
    poNumber: "PO-2026-03-403",
    date: "2026-03-03",
    cylinderSize: "KG12",
    orderedQty: 3,
  },
  {
    poNumber: "PO-2026-03-423",
    date: "2026-03-03",
    cylinderSize: "KG50",
    orderedQty: 1,
  },
  {
    poNumber: "PO-2026-03-476",
    date: "2026-03-03",
    cylinderSize: "KG12",
    orderedQty: 5,
  },
  {
    poNumber: "PO-2026-03-470",
    date: "2026-03-03",
    cylinderSize: "KG50",
    orderedQty: 2,
  },
  {
    poNumber: "PO-2026-03-471",
    date: "2026-03-03",
    cylinderSize: "KG50",
    orderedQty: 3,
  },
  {
    poNumber: "PO-2026-03-474",
    date: "2026-03-03",
    cylinderSize: "KG50",
    orderedQty: 3,
  },
  {
    poNumber: "PO-2026-03-477",
    date: "2026-03-03",
    cylinderSize: "KG50",
    orderedQty: 3,
  },
  {
    poNumber: "PO-2026-03-484",
    date: "2026-03-03",
    cylinderSize: "KG50",
    orderedQty: 4,
  },
  {
    poNumber: "PO-2026-03-485",
    date: "2026-03-03",
    cylinderSize: "KG50",
    orderedQty: 4,
  },
  {
    poNumber: "PO-2026-03-552",
    date: "2026-03-03",
    cylinderSize: "KG50",
    orderedQty: 2,
  },
  {
    poNumber: "PO-2026-03-586",
    date: "2026-03-03",
    cylinderSize: "KG12",
    orderedQty: 6,
  },
  {
    poNumber: "PO-2026-03-587",
    date: "2026-03-03",
    cylinderSize: "KG50",
    orderedQty: 2,
  },
  {
    poNumber: "PO-2026-03-289",
    date: "2026-03-03",
    cylinderSize: "KG12",
    orderedQty: 8,
  },
  {
    poNumber: "PO-2026-03-436",
    date: "2026-03-03",
    cylinderSize: "KG12",
    orderedQty: 20,
  },
  {
    poNumber: "PO-2026-03-454",
    date: "2026-03-03",
    cylinderSize: "KG50",
    orderedQty: 4,
  },
  {
    poNumber: "PO-2026-03-616",
    date: "2026-03-03",
    cylinderSize: "KG12",
    orderedQty: 3,
  },
  {
    poNumber: "PO-2026-03-627",
    date: "2026-03-03",
    cylinderSize: "KG12",
    orderedQty: 3,
  },
  // ── Sheet 4 (2026-03-04) ──
  {
    poNumber: "PO-2026-03-588",
    date: "2026-03-04",
    cylinderSize: "KG50",
    orderedQty: 2,
  },
  {
    poNumber: "PO-2026-03-597",
    date: "2026-03-04",
    cylinderSize: "KG12",
    orderedQty: 15,
  },
  {
    poNumber: "PO-2026-03-540",
    date: "2026-03-04",
    cylinderSize: "KG12",
    orderedQty: 2,
  },
  {
    poNumber: "PO-2026-03-541",
    date: "2026-03-04",
    cylinderSize: "KG50",
    orderedQty: 4,
  },
  {
    poNumber: "PO-2026-03-566",
    date: "2026-03-04",
    cylinderSize: "KG12",
    orderedQty: 7,
  },
  {
    poNumber: "PO-2026-03-583",
    date: "2026-03-04",
    cylinderSize: "KG50",
    orderedQty: 3,
  },
  {
    poNumber: "PO-2026-03-584",
    date: "2026-03-04",
    cylinderSize: "KG12",
    orderedQty: 5,
  },
  {
    poNumber: "PO-2026-03-594",
    date: "2026-03-04",
    cylinderSize: "KG12",
    orderedQty: 1,
  },
  {
    poNumber: "PO-2026-03-596",
    date: "2026-03-04",
    cylinderSize: "KG12",
    orderedQty: 2,
  },
  {
    poNumber: "PO-2026-03-635",
    date: "2026-03-04",
    cylinderSize: "KG50",
    orderedQty: 2,
  },
  // ── Sheet 5 (2026-03-05) ──
  {
    poNumber: "PO-2026-03-577",
    date: "2026-03-05",
    cylinderSize: "KG12",
    orderedQty: 2,
  },
  {
    poNumber: "PO-2026-03-645",
    date: "2026-03-05",
    cylinderSize: "KG12",
    orderedQty: 2,
  },
  {
    poNumber: "PO-2026-03-651",
    date: "2026-03-05",
    cylinderSize: "KG12",
    orderedQty: 10,
  },
  {
    poNumber: "PO-2026-03-672",
    date: "2026-03-05",
    cylinderSize: "KG12",
    orderedQty: 6,
  },
  {
    poNumber: "PO-2026-03-683",
    date: "2026-03-05",
    cylinderSize: "KG12",
    orderedQty: 5,
  },
  {
    poNumber: "PO-2026-03-787",
    date: "2026-03-05",
    cylinderSize: "KG12",
    orderedQty: 2,
  },
  {
    poNumber: "PO-2026-03-814",
    date: "2026-03-05",
    cylinderSize: "KG12",
    orderedQty: 6,
  },
  {
    poNumber: "PO-2026-03-815",
    date: "2026-03-05",
    cylinderSize: "KG12",
    orderedQty: 6,
  },
  {
    poNumber: "PO-2026-03-816",
    date: "2026-03-05",
    cylinderSize: "KG12",
    orderedQty: 6,
  },
  {
    poNumber: "PO-2026-03-833",
    date: "2026-03-05",
    cylinderSize: "KG12",
    orderedQty: 10,
  },
  {
    poNumber: "PO-2026-03-862",
    date: "2026-03-05",
    cylinderSize: "KG12",
    orderedQty: 10,
  },
  {
    poNumber: "PO-2026-03-896",
    date: "2026-03-05",
    cylinderSize: "KG12",
    orderedQty: 1,
  },
  {
    poNumber: "PO-2026-03-904",
    date: "2026-03-05",
    cylinderSize: "KG50",
    orderedQty: 3,
  },
  {
    poNumber: "PO-2026-03-726",
    date: "2026-03-05",
    cylinderSize: "KG12",
    orderedQty: 3,
  },
  {
    poNumber: "PO-2026-03-910",
    date: "2026-03-05",
    cylinderSize: "KG12",
    orderedQty: 25,
  },
  {
    poNumber: "PO-2026-03-914",
    date: "2026-03-05",
    cylinderSize: "KG12",
    orderedQty: 3,
  },
  {
    poNumber: "PO-2026-03-915",
    date: "2026-03-05",
    cylinderSize: "KG50",
    orderedQty: 5,
  },
  {
    poNumber: "PO-2026-03-916",
    date: "2026-03-05",
    cylinderSize: "KG50",
    orderedQty: 4,
  },
  // ── Sheet 6 (2026-03-06) ──
  {
    poNumber: "PO-2026-03-795",
    date: "2026-03-06",
    cylinderSize: "KG50",
    orderedQty: 4,
  },
  {
    poNumber: "PO-2026-03-917",
    date: "2026-03-06",
    cylinderSize: "KG50",
    orderedQty: 4,
  },
  {
    poNumber: "PO-2026-03-918",
    date: "2026-03-06",
    cylinderSize: "KG50",
    orderedQty: 6,
  },
  {
    poNumber: "PO-2026-03-919",
    date: "2026-03-06",
    cylinderSize: "KG50",
    orderedQty: 3,
  },
  {
    poNumber: "PO-2026-03-920",
    date: "2026-03-06",
    cylinderSize: "KG50",
    orderedQty: 6,
  },
  {
    poNumber: "PO-2026-03-731",
    date: "2026-03-06",
    cylinderSize: "KG12",
    orderedQty: 30,
  },
  {
    poNumber: "PO-2026-03-969",
    date: "2026-03-06",
    cylinderSize: "KG12",
    orderedQty: 8,
  },
  {
    poNumber: "PO-2026-03-1021",
    date: "2026-03-06",
    cylinderSize: "KG50",
    orderedQty: 3,
  },
  {
    poNumber: "PO-2026-03-1022",
    date: "2026-03-06",
    cylinderSize: "KG12",
    orderedQty: 10,
  },
  {
    poNumber: "PO-2026-03-1057",
    date: "2026-03-06",
    cylinderSize: "KG12",
    orderedQty: 10,
  },
  {
    poNumber: "PO-2026-03-826",
    date: "2026-03-06",
    cylinderSize: "KG50",
    orderedQty: 3,
  },
  {
    poNumber: "PO-2026-03-827",
    date: "2026-03-06",
    cylinderSize: "KG12",
    orderedQty: 2,
  },
  {
    poNumber: "PO-2026-03-979",
    date: "2026-03-06",
    cylinderSize: "KG12",
    orderedQty: 4,
  },
  {
    poNumber: "PO-2026-03-1039",
    date: "2026-03-06",
    cylinderSize: "KG12",
    orderedQty: 2,
  },
  {
    poNumber: "PO-2026-03-1049",
    date: "2026-03-06",
    cylinderSize: "KG12",
    orderedQty: 1,
  },
  {
    poNumber: "PO-2026-03-1059",
    date: "2026-03-06",
    cylinderSize: "KG12",
    orderedQty: 2,
  },
  {
    poNumber: "PO-2026-03-1074",
    date: "2026-03-06",
    cylinderSize: "KG50",
    orderedQty: 6,
  },
  // ── Sheet 7 (2026-03-07) ──
  {
    poNumber: "PO-2026-03-1107",
    date: "2026-03-07",
    cylinderSize: "KG12",
    orderedQty: 25,
  },
  {
    poNumber: "PO-2026-03-1120",
    date: "2026-03-07",
    cylinderSize: "KG12",
    orderedQty: 2,
  },
  {
    poNumber: "PO-2026-03-1144",
    date: "2026-03-07",
    cylinderSize: "KG50",
    orderedQty: 3,
  },
  {
    poNumber: "PO-2026-03-1190",
    date: "2026-03-07",
    cylinderSize: "KG12",
    orderedQty: 5,
  },
  {
    poNumber: "PO-2026-03-1228",
    date: "2026-03-07",
    cylinderSize: "KG12",
    orderedQty: 2,
  },
  {
    poNumber: "PO-2026-03-1237",
    date: "2026-03-07",
    cylinderSize: "KG12",
    orderedQty: 10,
  },
  {
    poNumber: "PO-2026-03-1266",
    date: "2026-03-07",
    cylinderSize: "KG12",
    orderedQty: 10,
  },
  {
    poNumber: "PO-2026-03-1075",
    date: "2026-03-07",
    cylinderSize: "KG12",
    orderedQty: 5,
  },
  {
    poNumber: "PO-2026-03-1138",
    date: "2026-03-07",
    cylinderSize: "KG12",
    orderedQty: 2,
  },
  {
    poNumber: "PO-2026-03-1145",
    date: "2026-03-07",
    cylinderSize: "KG12",
    orderedQty: 10,
  },
  {
    poNumber: "PO-2026-03-1174",
    date: "2026-03-07",
    cylinderSize: "KG12",
    orderedQty: 2,
  },
  {
    poNumber: "PO-2026-03-1233",
    date: "2026-03-07",
    cylinderSize: "KG50",
    orderedQty: 4,
  },
  // ── Sheet 9 (2026-03-09) ──
  {
    poNumber: "PO-2026-03-1590",
    date: "2026-03-09",
    cylinderSize: "KG12",
    orderedQty: 6,
  },
  {
    poNumber: "PO-2026-03-1425",
    date: "2026-03-09",
    cylinderSize: "KG50",
    orderedQty: 1,
  },
  {
    poNumber: "PO-2026-03-1426",
    date: "2026-03-09",
    cylinderSize: "KG50",
    orderedQty: 2,
  },
  {
    poNumber: "PO-2026-03-1340",
    date: "2026-03-09",
    cylinderSize: "KG50",
    orderedQty: 3,
  },
  {
    poNumber: "PO-2026-03-1461",
    date: "2026-03-09",
    cylinderSize: "KG12",
    orderedQty: 3,
  },
  {
    poNumber: "PO-2026-03-1546",
    date: "2026-03-09",
    cylinderSize: "KG12",
    orderedQty: 2,
  },
  {
    poNumber: "PO-2026-03-1306",
    date: "2026-03-09",
    cylinderSize: "KG12",
    orderedQty: 1,
  },
  {
    poNumber: "PO-2026-03-1589",
    date: "2026-03-09",
    cylinderSize: "KG50",
    orderedQty: 3,
  },
  {
    poNumber: "PO-2026-03-1593",
    date: "2026-03-09",
    cylinderSize: "KG50",
    orderedQty: 2,
  },
  {
    poNumber: "PO-2026-03-1657",
    date: "2026-03-09",
    cylinderSize: "KG50",
    orderedQty: 6,
  },
  {
    poNumber: "PO-2026-03-1660",
    date: "2026-03-09",
    cylinderSize: "KG50",
    orderedQty: 4,
  },
  {
    poNumber: "PO-2026-03-1659",
    date: "2026-03-09",
    cylinderSize: "KG50",
    orderedQty: 4,
  },
  {
    poNumber: "PO-2026-03-1575",
    date: "2026-03-09",
    cylinderSize: "KG50",
    orderedQty: 3,
  },
  {
    poNumber: "PO-2026-03-1602",
    date: "2026-03-09",
    cylinderSize: "KG50",
    orderedQty: 10,
  },
  {
    poNumber: "PO-2026-03-1444",
    date: "2026-03-09",
    cylinderSize: "KG12",
    orderedQty: 10,
  },
  {
    poNumber: "PO-2026-03-1594",
    date: "2026-03-09",
    cylinderSize: "KG50",
    orderedQty: 10,
  },
  // ── Sheet 10 (2026-03-10) ──
  {
    poNumber: "PO-2026-03-1394",
    date: "2026-03-10",
    cylinderSize: "KG50",
    orderedQty: 4,
  },
  {
    poNumber: "PO-2026-03-1411",
    date: "2026-03-10",
    cylinderSize: "KG50",
    orderedQty: 4,
  },
  {
    poNumber: "PO-2026-03-1581",
    date: "2026-03-10",
    cylinderSize: "KG12",
    orderedQty: 20,
  },
  {
    poNumber: "PO-2026-03-1755",
    date: "2026-03-10",
    cylinderSize: "KG12",
    orderedQty: 20,
  },
  {
    poNumber: "PO-2026-03-1756",
    date: "2026-03-10",
    cylinderSize: "KG12",
    orderedQty: 20,
  },
  {
    poNumber: "PO-2026-03-1796",
    date: "2026-03-10",
    cylinderSize: "KG12",
    orderedQty: 1,
  },
  {
    poNumber: "PO-2026-03-1603",
    date: "2026-03-10",
    cylinderSize: "KG12",
    orderedQty: 7,
  },
  {
    poNumber: "PO-2026-03-1678",
    date: "2026-03-10",
    cylinderSize: "KG50",
    orderedQty: 4,
  },
  {
    poNumber: "PO-2026-03-1747",
    date: "2026-03-10",
    cylinderSize: "KG12",
    orderedQty: 9,
  },
  {
    poNumber: "PO-2026-03-1790",
    date: "2026-03-10",
    cylinderSize: "KG12",
    orderedQty: 4,
  },
  {
    poNumber: "PO-2026-03-1819",
    date: "2026-03-10",
    cylinderSize: "KG12",
    orderedQty: 3,
  },
  {
    poNumber: "PO-2026-03-1856",
    date: "2026-03-10",
    cylinderSize: "KG12",
    orderedQty: 2,
  },
  {
    poNumber: "PO-2026-03-1896",
    date: "2026-03-10",
    cylinderSize: "KG12",
    orderedQty: 10,
  },
  {
    poNumber: "PO-2026-03-1897",
    date: "2026-03-10",
    cylinderSize: "KG12",
    orderedQty: 5,
  },
  {
    poNumber: "PO-2026-03-1930",
    date: "2026-03-10",
    cylinderSize: "KG12",
    orderedQty: 2,
  },
  {
    poNumber: "PO-2026-03-1951",
    date: "2026-03-10",
    cylinderSize: "KG50",
    orderedQty: 5,
  },
  {
    poNumber: "PO-2026-03-1953",
    date: "2026-03-10",
    cylinderSize: "KG50",
    orderedQty: 4,
  },
  {
    poNumber: "PO-2026-03-1954",
    date: "2026-03-10",
    cylinderSize: "KG12",
    orderedQty: 10,
  },
  {
    poNumber: "PO-2026-03-1955",
    date: "2026-03-10",
    cylinderSize: "KG50",
    orderedQty: 20,
  },
  // ── Sheet 11 (2026-03-11) ──
  {
    poNumber: "PO-2026-03-1950",
    date: "2026-03-11",
    cylinderSize: "KG12",
    orderedQty: 8,
  },
  {
    poNumber: "PO-2026-03-1956",
    date: "2026-03-11",
    cylinderSize: "KG50",
    orderedQty: 1,
  },
  {
    poNumber: "PO-2026-03-1967",
    date: "2026-03-11",
    cylinderSize: "KG50",
    orderedQty: 3,
  },
  {
    poNumber: "PO-2026-03-2005",
    date: "2026-03-11",
    cylinderSize: "KG12",
    orderedQty: 8,
  },
  {
    poNumber: "PO-2026-03-2042",
    date: "2026-03-11",
    cylinderSize: "KG50",
    orderedQty: 3,
  },
  {
    poNumber: "PO-2026-03-2053",
    date: "2026-03-11",
    cylinderSize: "KG12",
    orderedQty: 2,
  },
  {
    poNumber: "PO-2026-03-2060",
    date: "2026-03-11",
    cylinderSize: "KG12",
    orderedQty: 5,
  },
  {
    poNumber: "PO-2026-03-2150",
    date: "2026-03-11",
    cylinderSize: "KG12",
    orderedQty: 15,
  },
  {
    poNumber: "PO-2026-03-2151",
    date: "2026-03-11",
    cylinderSize: "KG12",
    orderedQty: 20,
  },
  {
    poNumber: "PO-2026-03-2179",
    date: "2026-03-11",
    cylinderSize: "KG12",
    orderedQty: 5,
  },
  {
    poNumber: "PO-2026-03-2033",
    date: "2026-03-11",
    cylinderSize: "KG12",
    orderedQty: 15,
  },
  {
    poNumber: "PO-2026-03-2027",
    date: "2026-03-11",
    cylinderSize: "KG50",
    orderedQty: 5,
  },
  {
    poNumber: "PO-2026-03-2029",
    date: "2026-03-11",
    cylinderSize: "KG50",
    orderedQty: 3,
  },
  {
    poNumber: "PO-2026-03-2032",
    date: "2026-03-11",
    cylinderSize: "KG12",
    orderedQty: 1,
  },
  {
    poNumber: "PO-2026-03-2035",
    date: "2026-03-11",
    cylinderSize: "KG50",
    orderedQty: 3,
  },
  // ── Sheet 12 (2026-03-12) ──
  {
    poNumber: "PO-2026-03-922",
    date: "2026-03-12",
    cylinderSize: "KG12",
    orderedQty: 1,
  },
  {
    poNumber: "PO-2026-03-2360",
    date: "2026-03-12",
    cylinderSize: "KG12",
    orderedQty: 2,
  },
  {
    poNumber: "PO-2026-03-1775",
    date: "2026-03-12",
    cylinderSize: "KG12",
    orderedQty: 2,
  },
  {
    poNumber: "PO-2026-03-2058",
    date: "2026-03-12",
    cylinderSize: "KG12",
    orderedQty: 1,
  },
  {
    poNumber: "PO-2026-03-2455",
    date: "2026-03-12",
    cylinderSize: "KG12",
    orderedQty: 1,
  },
  {
    poNumber: "PO-2026-03-2199",
    date: "2026-03-12",
    cylinderSize: "KG12",
    orderedQty: 12,
  },
  {
    poNumber: "PO-2026-03-2259",
    date: "2026-03-12",
    cylinderSize: "KG12",
    orderedQty: 5,
  },
  {
    poNumber: "PO-2026-03-2267",
    date: "2026-03-12",
    cylinderSize: "KG50",
    orderedQty: 2,
  },
  {
    poNumber: "PO-2026-03-2272",
    date: "2026-03-12",
    cylinderSize: "KG12",
    orderedQty: 2,
  },
  {
    poNumber: "PO-2026-03-2381",
    date: "2026-03-12",
    cylinderSize: "KG12",
    orderedQty: 4,
  },
  {
    poNumber: "PO-2026-03-732",
    date: "2026-03-12",
    cylinderSize: "KG12",
    orderedQty: 20,
  },
  {
    poNumber: "PO-2026-03-2133",
    date: "2026-03-12",
    cylinderSize: "KG12",
    orderedQty: 10,
  },
  {
    poNumber: "PO-2026-03-2439",
    date: "2026-03-12",
    cylinderSize: "KG12",
    orderedQty: 5,
  },
  {
    poNumber: "PO-2026-03-2304",
    date: "2026-03-12",
    cylinderSize: "KG12",
    orderedQty: 40,
  },
  {
    poNumber: "PO-2026-03-2367",
    date: "2026-03-12",
    cylinderSize: "KG12",
    orderedQty: 3,
  },
  {
    poNumber: "PO-2026-03-2398",
    date: "2026-03-12",
    cylinderSize: "KG12",
    orderedQty: 3,
  },
] as const;

// ─── EmptyReturn daily aggregates ─────────────────────────────────────────────
// Source: REKAP_PO_KIRIM sheets SBY + YOG, column "Tabung Kosong"
// Seeded as 1 aggregate EmptyReturn record per day per branch
// (detail per-customer returns are tracked in CustomerCylinderHolding already)
const EMPTY_RETURNS_SBY: { date: string; kg12: number; kg50: number }[] = [
  { date: "2026-03-02", kg12: 55, kg50: 8 },
  { date: "2026-03-03", kg12: 199, kg50: 53 },
  { date: "2026-03-04", kg12: 38, kg50: 24 },
  { date: "2026-03-05", kg12: 93, kg50: 10 },
  { date: "2026-03-06", kg12: 80, kg50: 60 },
  { date: "2026-03-07", kg12: 74, kg50: 6 },
  { date: "2026-03-09", kg12: 23, kg50: 41 },
  { date: "2026-03-10", kg12: 130, kg50: 40 },
  { date: "2026-03-11", kg12: 91, kg50: 30 },
  { date: "2026-03-12", kg12: 86, kg50: 3 },
];

const EMPTY_RETURNS_YOG: { date: string; kg12: number; kg50: number }[] = [
  { date: "2026-03-02", kg12: 101, kg50: 20 },
  { date: "2026-03-03", kg12: 42, kg50: 20 },
  { date: "2026-03-04", kg12: 30, kg50: 5 },
  { date: "2026-03-05", kg12: 12, kg50: 11 },
  { date: "2026-03-06", kg12: 104, kg50: 7 },
  { date: "2026-03-07", kg12: 28, kg50: 10 },
  { date: "2026-03-09", kg12: 135, kg50: 7 },
  { date: "2026-03-10", kg12: 32, kg50: 21 },
  { date: "2026-03-11", kg12: 58, kg50: 36 },
  { date: "2026-03-12", kg12: 29, kg50: 11 },
];

// ─── HMT Prices (March 2026) ──────────────────────────────────────────────────
// Source: SupplierHmtQuota already in seed — usedQty updated from delivery totals
// SBY: KG12 quota=1900 used=873 | KG50 quota=723 used=290
// YOG: KG12 quota=1760 used=593 | KG50 quota=545 used=128
const HMT_PRICES: Record<"KG12" | "KG50", number> = {
  KG12: 175500,
  KG50: 604700,
};

// ─────────────────────────────────────────────────────────────────────────────
async function seedWarehouseAdditions() {
  console.log("🏭 Starting warehouse seed additions...\n");

  const sby = await prisma.branch.findFirst({ where: { code: "SBY" } });
  const yog = await prisma.branch.findFirst({ where: { code: "YOG" } });
  const supplier = await prisma.supplier.findFirst();
  const adminUser = await prisma.user.findFirst({
    where: { email: "admin@ssg.com" },
  });

  if (!sby || !yog || !supplier || !adminUser) {
    throw new Error(
      "Base seed must be run first (branches, supplier, admin user required)",
    );
  }

  // ── 1. SupplierPo ──────────────────────────────────────────────────────────
  console.log("📋 Seeding SupplierPos...");
  let poCreated = 0,
    poSkipped = 0;
  for (const po of SUPPLIER_POS) {
    const price = HMT_PRICES[po.cylinderSize];
    try {
      await prisma.supplierPo.upsert({
        where: { poNumber: po.poNumber },
        update: {},
        create: {
          branchId: sby.id,
          supplierId: supplier.id,
          poNumber: po.poNumber,
          poDate: new Date(po.date + "T00:00:00.000Z"),
          cylinderSize: po.cylinderSize,
          orderedQty: po.orderedQty,
          confirmedQty: po.orderedQty,
          receivedQty: po.orderedQty,
          pricePerUnit: price,
          status: "COMPLETED",
          createdById: adminUser.id, // FIX: required field
        },
      });
      poCreated++;
    } catch (e) {
      console.warn(
        `  PO skip ${po.poNumber}:`,
        (e as Error).message.split("\n")[0],
      );
      poSkipped++;
    }
  }
  console.log(`✅ SupplierPos: ${poCreated} upserted, ${poSkipped} skipped\n`);

  // ── 2. WarehouseStock snapshots ────────────────────────────────────────────
  // Source: LAPORAN_STOCK_TABUNG — aggregate on 2026-03-12
  // fullQty = free cylinders in warehouse (HMT total - held by customers)
  // emptyQty = total empty cylinders returned (sum from REKAP)
  // onTransitQty = 0 (all deliveries completed by date 12)
  console.log("📦 Seeding WarehouseStock...");

  const stockSnapshots = [
    // SBY
    {
      branchId: sby.id,
      cylinderSize: "KG12" as const,
      fullQty: 397,
      emptyQty: 869,
      onTransitQty: 0,
    },
    {
      branchId: sby.id,
      cylinderSize: "KG50" as const,
      fullQty: 50,
      emptyQty: 275,
      onTransitQty: 0,
    },
    // YOG
    {
      branchId: yog.id,
      cylinderSize: "KG12" as const,
      fullQty: 762,
      emptyQty: 571,
      onTransitQty: 0,
    },
    {
      branchId: yog.id,
      cylinderSize: "KG50" as const,
      fullQty: 227,
      emptyQty: 148,
      onTransitQty: 0,
    },
  ];

  let wsCreated = 0;
  for (const s of stockSnapshots) {
    await prisma.warehouseStock.upsert({
      where: {
        branchId_cylinderSize_stockDate: {
          // FIX: 3-field compound key
          branchId: s.branchId,
          cylinderSize: s.cylinderSize,
          stockDate: new Date("2026-03-12"),
        },
      },
      update: {
        fullQty: s.fullQty,
        emptyQty: s.emptyQty,
        onTransitQty: s.onTransitQty,
      },
      create: { ...s, stockDate: new Date("2026-03-12") },
    });
    wsCreated++;
  }
  console.log(`✅ WarehouseStock: ${wsCreated} upserted\n`);

  // ── 3. Update HMT usedQty from actual deliveries ──────────────────────────
  console.log("📊 Updating HMT Quota usedQty...");
  // SBY: KG12 used=873, KG50 used=290 | YOG: KG12 used=593, KG50 used=128
  const hmtUpdates = [
    { branchId: sby.id, cylinderSize: "KG12" as const, usedQty: 873 },
    { branchId: sby.id, cylinderSize: "KG50" as const, usedQty: 290 },
    { branchId: yog.id, cylinderSize: "KG12" as const, usedQty: 593 },
    { branchId: yog.id, cylinderSize: "KG50" as const, usedQty: 128 },
  ];
  let hmtUpdated = 0;
  for (const h of hmtUpdates) {
    const quota = await prisma.supplierHmtQuota.findFirst({
      where: {
        branchId: h.branchId,
        cylinderSize: h.cylinderSize,
        periodMonth: 3,
        periodYear: 2026,
      },
    });
    if (quota) {
      await prisma.supplierHmtQuota.update({
        where: { id: quota.id },
        data: { usedQty: h.usedQty },
      });
      hmtUpdated++;
    }
  }
  console.log(`✅ HMT Quota usedQty: ${hmtUpdated} updated\n`);

  // ── 4. EmptyReturn records ─────────────────────────────────────────────────
  // One aggregate record per day per branch (per cylinder size)
  console.log("↩️  Seeding EmptyReturns...");
  let retCreated = 0,
    retSkipped = 0;

  async function seedReturns(
    branchId: string,
    rows: { date: string; kg12: number; kg50: number }[],
    branchCode: string,
  ) {
    for (const row of rows) {
      for (const [size, qty] of [
        ["KG12", row.kg12],
        ["KG50", row.kg50],
      ] as const) {
        if (!qty) continue;
        const retNumber = `RET-${branchCode}-${row.date.replace(/-/g, "")}-${size}`;
        try {
          await prisma.emptyReturn.upsert({
            where: { returnNumber: retNumber },
            update: {},
            create: {
              branchId,
              returnNumber: retNumber,
              returnDate: new Date(row.date + "T06:00:00.000Z"),
              cylinderSize: size,
              returnedQty: qty,
              sourceType: "CUSTOMER",
              sourceRef: "Daily aggregate return",
              recordedById: adminUser.id,
            },
          });
          retCreated++;
        } catch {
          retSkipped++;
        }
      }
    }
  }

  await seedReturns(sby.id, EMPTY_RETURNS_SBY, "SBY");
  await seedReturns(yog.id, EMPTY_RETURNS_YOG, "YOG");
  console.log(
    `✅ EmptyReturns: ${retCreated} upserted, ${retSkipped} skipped\n`,
  );

  // ── 5. MonthlyRecon snapshot for March 2026 ───────────────────────────────
  // Schema: branchId, periodMonth, periodYear, cylinderSize (one row per size)
  // Source: REKAP_PO + LAPORAN_STOCK (closing counts as of 2026-03-12)
  console.log("📈 Seeding MonthlyRecon...");

  const reconRows: {
    branchId: string;
    cylinderSize: "KG12" | "KG50";
    outboundFull: number;
    returnedEmpty: number;
    closingFull: number;
    closingEmpty: number;
  }[] = [
    // SBY KG12: delivered=873, returned=869, closing full=397, closing empty=869
    {
      branchId: sby.id,
      cylinderSize: "KG12",
      outboundFull: 873,
      returnedEmpty: 869,
      closingFull: 397,
      closingEmpty: 869,
    },
    // SBY KG50: delivered=290, returned=275, closing full=50, closing empty=275
    {
      branchId: sby.id,
      cylinderSize: "KG50",
      outboundFull: 290,
      returnedEmpty: 275,
      closingFull: 50,
      closingEmpty: 275,
    },
    // YOG KG12: delivered=593, returned=571, closing full=762, closing empty=571
    {
      branchId: yog.id,
      cylinderSize: "KG12",
      outboundFull: 593,
      returnedEmpty: 571,
      closingFull: 762,
      closingEmpty: 571,
    },
    // YOG KG50: delivered=128, returned=148, closing full=227, closing empty=148
    {
      branchId: yog.id,
      cylinderSize: "KG50",
      outboundFull: 128,
      returnedEmpty: 148,
      closingFull: 227,
      closingEmpty: 148,
    },
  ];

  let reconCreated = 0;
  for (const r of reconRows) {
    try {
      await prisma.monthlyRecon.upsert({
        where: {
          branchId_cylinderSize_periodYear_periodMonth: {
            branchId: r.branchId,
            cylinderSize: r.cylinderSize,
            periodYear: 2026,
            periodMonth: 3,
          },
        },
        update: {
          outboundFull: r.outboundFull,
          returnedEmpty: r.returnedEmpty,
          closingFull: r.closingFull,
          closingEmpty: r.closingEmpty,
          systemFull: r.closingFull,
          systemEmpty: r.closingEmpty,
          varianceFull: 0,
          varianceEmpty: 0,
          status: "DRAFT",
        },
        create: {
          branchId: r.branchId,
          periodYear: 2026,
          periodMonth: 3,
          cylinderSize: r.cylinderSize,
          outboundFull: r.outboundFull,
          returnedEmpty: r.returnedEmpty,
          closingFull: r.closingFull,
          closingEmpty: r.closingEmpty,
          systemFull: r.closingFull,
          systemEmpty: r.closingEmpty,
          varianceFull: 0,
          varianceEmpty: 0,
          status: "DRAFT",
        },
      });
      reconCreated++;
    } catch (e) {
      console.warn("MonthlyRecon skip:", (e as Error).message.split("\n")[0]);
    }
  }
  console.log(`✅ MonthlyRecon: ${reconCreated} upserted\n`);

  console.log(`
🎉 Warehouse seed additions complete!
   SupplierPos:    ${poCreated} records (${poSkipped} skipped/already exist)
   WarehouseStock: ${wsCreated} snapshots (SBY+YOG × KG12+KG50, date 2026-03-12)
   HMT usedQty:    ${hmtUpdated} updated
   EmptyReturns:   ${retCreated} daily aggregates (${retSkipped} skipped)
   MonthlyRecon:   ${reconCreated} rows (Mar 2026, per branch per size)
  `);
}

seedWarehouseAdditions()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
