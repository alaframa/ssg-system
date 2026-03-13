// prisma/seed.ts
// Seeds:
//   ✅ 1 admin user
//   ✅ 2 branches (SBY, YOG)
//   ✅ 1 supplier (PT. Arsygas Nix Indonesia / NIX)
//   ✅ 384 real customers (217 SBY + 167 YOG) from March 2026 data
//   ✅ GasbackLedger entries — final March 2026 balance per customer
//   ✅ CustomerCylinderHolding — end-of-March 2026 stock per customer
//   ✅ SupplierHmtQuota — March 2026 HMT quotas (SBY + YOG, 12kg + 50kg)
//   ✅ DeliveryOrder + DeliveryOrderItem — 164 SBY orders (Mar 2-12 2026)
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma  = new PrismaClient({ adapter } as any);

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function makeCode(branch: string, name: string, seq: number): string {
  const prefix = branch === "SBY" ? "SBY" : "YOG";
  const slug   = name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6).padEnd(3, "X");
  return `${prefix}-${slug}-${String(seq).padStart(4, "0")}`;
}

const CUSTOMER_DATA: {
  name: string; branch: "SBY" | "YOG"; type: "RETAIL" | "AGEN" | "INDUSTRI";
  gasback: number; kg12: number; kg50: number;
}[] = [
  // ── SURABAYA ──────────────────────────────────────────────────────────────────────
  { name: "1966 Coffee House", branch: "SBY", type: "RETAIL", gasback: 10.12, kg12: 11, kg50: 0 },
  { name: "Agis Restaurant", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Agis Restorant", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Akabar SIIP", branch: "SBY", type: "RETAIL", gasback: 351.83, kg12: 89, kg50: 0 },
  { name: "Al-Hikmah Gayungsari", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 75, kg50: 0 },
  { name: "Al-Himah Gayungsari", branch: "SBY", type: "RETAIL", gasback: 16.07, kg12: 0, kg50: 0 },
  { name: "Amdtirdam Caffee Roastery", branch: "SBY", type: "RETAIL", gasback: 10.93, kg12: 8, kg50: 0 },
  { name: "Amor Restauran & Coffee", branch: "SBY", type: "RETAIL", gasback: 4.15, kg12: 0, kg50: 5 },
  { name: "Apotik Indah", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Apotik Indah Farma", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Asap Asap Sda", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Asap Asap Sidoarjo", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Asshofa", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Azzahra Catering", branch: "SBY", type: "RETAIL", gasback: 33.42, kg12: 21, kg50: 0 },
  { name: "Azzhofa", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Bajawa Flores NTT Sby", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Bakso Cak Pitung Pandaan", branch: "SBY", type: "RETAIL", gasback: 7.8, kg12: 24, kg50: 0 },
  { name: "Bakso Mamayo Maspion SBY", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Bakso Mamayo Ponti Sda", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Baradjawa Gayungsari", branch: "SBY", type: "RETAIL", gasback: 3.01, kg12: 9, kg50: 0 },
  { name: "Bebek Madura", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Bebek Madura Candi Sda", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Bicopi", branch: "SBY", type: "RETAIL", gasback: 1.76, kg12: 0, kg50: 0 },
  { name: "Burger Bangor Bukit Dharmawangsa", branch: "SBY", type: "RETAIL", gasback: 14.36, kg12: 5, kg50: 0 },
  { name: "Burger Bangor Bukit Geluran", branch: "SBY", type: "RETAIL", gasback: 6.28, kg12: 4, kg50: 0 },
  { name: "Burger Bangor Bukit Gwalk", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 4, kg50: 0 },
  { name: "Burger Bangor Bukit Karangpilang", branch: "SBY", type: "RETAIL", gasback: 3.04, kg12: 4, kg50: 0 },
  { name: "Burger Bangor Bukit Krian", branch: "SBY", type: "RETAIL", gasback: 0.85, kg12: 8, kg50: 0 },
  { name: "Burger Bangor Bukit Mulyosari", branch: "SBY", type: "RETAIL", gasback: 7.35, kg12: 5, kg50: 0 },
  { name: "Burger Bangor Bukit Palma", branch: "SBY", type: "RETAIL", gasback: 13.68, kg12: 5, kg50: 0 },
  { name: "Burger Bangor Bukit Perak", branch: "SBY", type: "RETAIL", gasback: 2.11, kg12: 4, kg50: 0 },
  { name: "Burger Bangor Bukit Tenggilis", branch: "SBY", type: "RETAIL", gasback: 0.58, kg12: 5, kg50: 0 },
  { name: "CV. Gunung Emas Nusantara", branch: "SBY", type: "INDUSTRI", gasback: 206.79, kg12: 13, kg50: 23 },
  { name: "CV. Mata Multimedia Utama", branch: "SBY", type: "INDUSTRI", gasback: 1797.42, kg12: 168, kg50: 276 },
  { name: "CV. Oofy Nusantara Adidaya", branch: "SBY", type: "INDUSTRI", gasback: 10.94, kg12: 0, kg50: 0 },
  { name: "CV. Ooofy Nusantara Adidaya", branch: "SBY", type: "INDUSTRI", gasback: 0.0, kg12: 11, kg50: 10 },
  { name: "CV. Pawon Enggal Sekawan", branch: "SBY", type: "INDUSTRI", gasback: 0.68, kg12: 0, kg50: 0 },
  { name: "CV. Pelangi Sepuluh Bersaudara", branch: "SBY", type: "INDUSTRI", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Café La Babat", branch: "SBY", type: "RETAIL", gasback: 66.29, kg12: 0, kg50: 0 },
  { name: "Carolina Perdana", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Centra Kitchen Padma", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 3 },
  { name: "Central Kitchen Padma", branch: "SBY", type: "RETAIL", gasback: 11.3, kg12: 0, kg50: 0 },
  { name: "Clara", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Confera Social Eatery", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Confera Sosial Eatery", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Crunchaus Gwalk", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Crunhous Gwalk", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Dapur Aqiqoh Sidoarjo", branch: "SBY", type: "RETAIL", gasback: 164.43, kg12: 27, kg50: 0 },
  { name: "Dapur Aqiqoh Surabaya", branch: "SBY", type: "RETAIL", gasback: 0.32, kg12: 10, kg50: 1 },
  { name: "Dapur Bakso Mamayo & Kebab Baba Rafi", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Dapur Gizi", branch: "SBY", type: "RETAIL", gasback: 318.69, kg12: 19, kg50: 32 },
  { name: "Dapur Kedungpring", branch: "SBY", type: "RETAIL", gasback: 57.37, kg12: 0, kg50: 0 },
  { name: "Dapur MBG Tosari Pasuruan", branch: "SBY", type: "RETAIL", gasback: 346.98, kg12: 0, kg50: 0 },
  { name: "Dapur Mamayo baba rafi", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Dapur Maranatha Plaosan", branch: "SBY", type: "RETAIL", gasback: 122.75, kg12: 0, kg50: 0 },
  { name: "Dapur RJ", branch: "SBY", type: "RETAIL", gasback: 15.41, kg12: 10, kg50: 0 },
  { name: "Dapur Sehat", branch: "SBY", type: "RETAIL", gasback: 252.05, kg12: 32, kg50: 54 },
  { name: "Depot Bakso Perawan", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Dewa Seafood", branch: "SBY", type: "RETAIL", gasback: 9.57, kg12: 28, kg50: 0 },
  { name: "Dimsum Kobar", branch: "SBY", type: "RETAIL", gasback: 49.08, kg12: 12, kg50: 0 },
  { name: "Dioarsygas", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Djoko Parmono Arsy", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Edelweis Catering", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Ekata Resto", branch: "SBY", type: "RETAIL", gasback: 24.45, kg12: 0, kg50: 3 },
  { name: "Flamboyan Laundry", branch: "SBY", type: "INDUSTRI", gasback: 48.05, kg12: 55, kg50: 0 },
  { name: "Fork Resto Tunjungan", branch: "SBY", type: "RETAIL", gasback: 34.88, kg12: 22, kg50: 0 },
  { name: "Front One Hotel", branch: "SBY", type: "INDUSTRI", gasback: 0.44, kg12: 2, kg50: 3 },
  { name: "GOLF GRAHA FAMILI", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Global Teknik", branch: "SBY", type: "INDUSTRI", gasback: 1.44, kg12: 24, kg50: 6 },
  { name: "Gokana Resto", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Grandia Eatery", branch: "SBY", type: "RETAIL", gasback: 2.61, kg12: 4, kg50: 0 },
  { name: "Hotel Bekizar", branch: "SBY", type: "INDUSTRI", gasback: 19.48, kg12: 5, kg50: 7 },
  { name: "Hotel Neo Gubeng Sby", branch: "SBY", type: "INDUSTRI", gasback: 10.8, kg12: 11, kg50: 0 },
  { name: "Hotel SRV Surabaya", branch: "SBY", type: "INDUSTRI", gasback: 0.2, kg12: 5, kg50: 0 },
  { name: "Hotel Varna Culture", branch: "SBY", type: "INDUSTRI", gasback: 46.2, kg12: 2, kg50: 9 },
  { name: "Hotways Pondok Jati Sda", branch: "SBY", type: "RETAIL", gasback: 44.01, kg12: 0, kg50: 6 },
  { name: "House Club", branch: "SBY", type: "RETAIL", gasback: 0.7, kg12: 110, kg50: 34 },
  { name: "Ibu Amik", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Ibu Erna", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 2, kg50: 0 },
  { name: "Iwaka Catering", branch: "SBY", type: "RETAIL", gasback: 10.93, kg12: 4, kg50: 0 },
  { name: "Kebon Kota Sby", branch: "SBY", type: "RETAIL", gasback: 1.86, kg12: 0, kg50: 0 },
  { name: "Kedai Cik Abin", branch: "SBY", type: "RETAIL", gasback: 2.71, kg12: 0, kg50: 0 },
  { name: "Kedai Mak Liem", branch: "SBY", type: "RETAIL", gasback: 4.42, kg12: 0, kg50: 0 },
  { name: "Kedai Mal Liem", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 4, kg50: 0 },
  { name: "Kembang merah", branch: "SBY", type: "RETAIL", gasback: 131.59, kg12: 12, kg50: 0 },
  { name: "King Claypot", branch: "SBY", type: "RETAIL", gasback: 0.74, kg12: 0, kg50: 0 },
  { name: "Koat café", branch: "SBY", type: "RETAIL", gasback: 6.96, kg12: 0, kg50: 0 },
  { name: "Koat café Sda", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 9, kg50: 0 },
  { name: "Kofind Coffe Sby", branch: "SBY", type: "RETAIL", gasback: 16.96, kg12: 5, kg50: 0 },
  { name: "Kopi Padma", branch: "SBY", type: "RETAIL", gasback: 95.84, kg12: 0, kg50: 3 },
  { name: "Kwetiau AKANG SBY", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 8, kg50: 0 },
  { name: "Lesehan Seafood Sampang", branch: "SBY", type: "RETAIL", gasback: 190.27, kg12: 29, kg50: 0 },
  { name: "Lestari Kitchen - Lakarsantri", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "M1 Resto", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "MB Sedap Malam", branch: "SBY", type: "RETAIL", gasback: 7.33, kg12: 0, kg50: 4 },
  { name: "MBG Barengkrajan Krian", branch: "SBY", type: "RETAIL", gasback: 2.78, kg12: 0, kg50: 0 },
  { name: "Mahakam Seefood", branch: "SBY", type: "RETAIL", gasback: 13.61, kg12: 7, kg50: 0 },
  { name: "Mazaya Sby", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Mellys Laundry", branch: "SBY", type: "INDUSTRI", gasback: 0.0, kg12: 2, kg50: 0 },
  { name: "Midnight Baker Imam Bonjol", branch: "SBY", type: "RETAIL", gasback: 10.04, kg12: 0, kg50: 6 },
  { name: "Midnight Bakery", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 8, kg50: 6 },
  { name: "Mie Banglades SDA", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 2, kg50: 0 },
  { name: "NIKITOKO", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Nasi Kebuli Jawa", branch: "SBY", type: "RETAIL", gasback: 0.96, kg12: 0, kg50: 0 },
  { name: "Nita Jaya Catering", branch: "SBY", type: "RETAIL", gasback: 23.63, kg12: 13, kg50: 0 },
  { name: "Nusantara NUCO", branch: "SBY", type: "RETAIL", gasback: 0.22, kg12: 0, kg50: 2 },
  { name: "PT Delifru Gresik", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "PT. BSI", branch: "SBY", type: "INDUSTRI", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "PT. Bebekku Jalan Jalan ke Surabaya", branch: "SBY", type: "INDUSTRI", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "PT. Bebekku Jalan-Jalan ke Surabaya", branch: "SBY", type: "INDUSTRI", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "PT. Corporanesa Sangdipa Sahwahita", branch: "SBY", type: "INDUSTRI", gasback: 1.1, kg12: 6, kg50: 0 },
  { name: "PT. FIHAN AGROPANGAN INDONESIA", branch: "SBY", type: "INDUSTRI", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "PT. Fihan Agropangan Indonesia", branch: "SBY", type: "INDUSTRI", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "PT. INSAN CITRAPRIMA SEJAHTERA", branch: "SBY", type: "INDUSTRI", gasback: 13.03, kg12: 0, kg50: 0 },
  { name: "PT. Insan Citraprima Sejahtera", branch: "SBY", type: "INDUSTRI", gasback: 0.0, kg12: 78, kg50: 0 },
  { name: "PT. Panggumg Electric Citrabuana", branch: "SBY", type: "INDUSTRI", gasback: 7.64, kg12: 0, kg50: 0 },
  { name: "PT. Panggung Electric Citrabuana", branch: "SBY", type: "INDUSTRI", gasback: 0.0, kg12: 0, kg50: 7 },
  { name: "PT. Seacon Bintang Sejahtera", branch: "SBY", type: "INDUSTRI", gasback: 1.43, kg12: 0, kg50: 0 },
  { name: "PT. Surya Pasific SDA", branch: "SBY", type: "INDUSTRI", gasback: 26.5, kg12: 9, kg50: 0 },
  { name: "Padang Legenda", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Panahouse", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Pasir Ris Seafood", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Pia Calista", branch: "SBY", type: "RETAIL", gasback: 55.86, kg12: 22, kg50: 0 },
  { name: "Poro Tuna Surabaya", branch: "SBY", type: "RETAIL", gasback: 76.88, kg12: 0, kg50: 4 },
  { name: "RM Sumringah", branch: "SBY", type: "RETAIL", gasback: 136.28, kg12: 58, kg50: 0 },
  { name: "RM Sumringah 2", branch: "SBY", type: "RETAIL", gasback: 66.46, kg12: 15, kg50: 0 },
  { name: "RPA FAQIH Buduran", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "RPHU", branch: "SBY", type: "INDUSTRI", gasback: 8.21, kg12: 3, kg50: 2 },
  { name: "RS MMCS", branch: "SBY", type: "INDUSTRI", gasback: 62.92, kg12: 11, kg50: 0 },
  { name: "RSIA Sby", branch: "SBY", type: "INDUSTRI", gasback: 57.38, kg12: 4, kg50: 6 },
  { name: "RSUD dr. R Koesma Kab.Tuban/ Intalasi Gizi", branch: "SBY", type: "INDUSTRI", gasback: 377.67, kg12: 0, kg50: 0 },
  { name: "RSUD dr. R Koesma Kab.Tuban/ Laundry", branch: "SBY", type: "INDUSTRI", gasback: 30.65, kg12: 0, kg50: 0 },
  { name: "RSUD dr. R. Koesma Kab.Tuban/ Intalasi Gizi", branch: "SBY", type: "INDUSTRI", gasback: 0.0, kg12: 5, kg50: 9 },
  { name: "RSUD dr. R. Koesma Kab.Tuban/ Laundray", branch: "SBY", type: "INDUSTRI", gasback: 0.0, kg12: 0, kg50: 9 },
  { name: "Rahang Tuna Sby", branch: "SBY", type: "RETAIL", gasback: 6.65, kg12: 3, kg50: 5 },
  { name: "Ramenqu", branch: "SBY", type: "RETAIL", gasback: 28.91, kg12: 9, kg50: 0 },
  { name: "Resto Huandi Sby", branch: "SBY", type: "RETAIL", gasback: 50.62, kg12: 4, kg50: 3 },
  { name: "Resto Ngelencer", branch: "SBY", type: "RETAIL", gasback: 4.22, kg12: 0, kg50: 0 },
  { name: "Restoran Sederhana Padang Sby", branch: "SBY", type: "RETAIL", gasback: 3.2, kg12: 16, kg50: 3 },
  { name: "Risyaad Rizky", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Rumah Sakit Siti Miriam", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "SPPG AL-Bukhori Lembanah Pragaan Sumenep", branch: "SBY", type: "INDUSTRI", gasback: 68.36, kg12: 0, kg50: 0 },
  { name: "SPPG Al-Bukhori Lembanah Pragaan Sumenep", branch: "SBY", type: "INDUSTRI", gasback: 0.0, kg12: 4, kg50: 7 },
  { name: "SPPG BU Adissa", branch: "SBY", type: "INDUSTRI", gasback: 154.2, kg12: 0, kg50: 13 },
  { name: "SPPG Banjarbendo", branch: "SBY", type: "INDUSTRI", gasback: 19.36, kg12: 0, kg50: 6 },
  { name: "SPPG Berkah Nusantara Peduli", branch: "SBY", type: "INDUSTRI", gasback: 366.09, kg12: 0, kg50: 9 },
  { name: "SPPG Budi Utomo Magetan", branch: "SBY", type: "INDUSTRI", gasback: 218.71, kg12: 0, kg50: 0 },
  { name: "SPPG Bulak Banteng", branch: "SBY", type: "INDUSTRI", gasback: 0.0, kg12: 0, kg50: 6 },
  { name: "SPPG Bulak Banteng Sby", branch: "SBY", type: "INDUSTRI", gasback: 286.79, kg12: 0, kg50: 0 },
  { name: "SPPG Damarsi Buduran", branch: "SBY", type: "INDUSTRI", gasback: 204.61, kg12: 24, kg50: 0 },
  { name: "SPPG Gayungsari Ketintang 3", branch: "SBY", type: "INDUSTRI", gasback: 6.44, kg12: 4, kg50: 0 },
  { name: "SPPG Jl. Bromo Magetan", branch: "SBY", type: "INDUSTRI", gasback: 85.49, kg12: 1, kg50: 12 },
  { name: "SPPG Kedungpring, Lamongan", branch: "SBY", type: "INDUSTRI", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "SPPG Lentera Gizi", branch: "SBY", type: "INDUSTRI", gasback: 0.1, kg12: 0, kg50: 0 },
  { name: "SPPG Maranata Magetan", branch: "SBY", type: "INDUSTRI", gasback: 0.0, kg12: 12, kg50: 7 },
  { name: "SPPG Mlajah Bangkalan", branch: "SBY", type: "INDUSTRI", gasback: 355.38, kg12: 0, kg50: 6 },
  { name: "SPPG Ponpes AL-Ahyar Bangkalan", branch: "SBY", type: "INDUSTRI", gasback: 6.94, kg12: 0, kg50: 0 },
  { name: "SPPG Ponpes Al Ahyar Bangkalan", branch: "SBY", type: "INDUSTRI", gasback: 0.0, kg12: 4, kg50: 6 },
  { name: "SPPG Purwodadi 1", branch: "SBY", type: "INDUSTRI", gasback: 2.44, kg12: 3, kg50: 0 },
  { name: "SPPG SPPG Budi Utomo", branch: "SBY", type: "INDUSTRI", gasback: 0.0, kg12: 0, kg50: 9 },
  { name: "SPPG Sengonagung 1", branch: "SBY", type: "INDUSTRI", gasback: 16.98, kg12: 0, kg50: 9 },
  { name: "SPPG Sumbergedong Trenggalek", branch: "SBY", type: "INDUSTRI", gasback: 149.22, kg12: 25, kg50: 7 },
  { name: "SPPG T.A Kusuma Dewi", branch: "SBY", type: "INDUSTRI", gasback: 36.97, kg12: 15, kg50: 0 },
  { name: "SPPG Tosari Pasuruan", branch: "SBY", type: "INDUSTRI", gasback: 0.0, kg12: 66, kg50: 0 },
  { name: "Samudra Powder", branch: "SBY", type: "INDUSTRI", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Samudra Powder Coating", branch: "SBY", type: "INDUSTRI", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Sanlong", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Sanlong Steamboat", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Sego Sambel Wonokromo", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Sei Sapi Blimbing", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Sei Sapi Dukuh Sarinadi Sda", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Sei Sapi Gayungsari", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Sei Sapi Gresik", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Sei Sapi Gubeng", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Sei Sapi Klojen", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Sei Sapi Lowokwaru", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Sei Sapi Mojokerto", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Sei Sapi Rungkut", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Sei Sapi Semampir", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Sei Sapi Sukolilo", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Sei Sapi Wiyung", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Seidnoesia Pasuruan", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Seindonesia Dukuh Pakis", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Seindonesia Juanda", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Seindonesia Kenjeran", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Seindonesia Madiun", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Seindonesia Manukan", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Seindonesia Pasuruan", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Sin Cia Po", branch: "SBY", type: "RETAIL", gasback: 3.88, kg12: 10, kg50: 3 },
  { name: "Sitara", branch: "SBY", type: "RETAIL", gasback: 12.27, kg12: 0, kg50: 0 },
  { name: "Sitara Indian Restaurant", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 6, kg50: 11 },
  { name: "Soes Merdeka", branch: "SBY", type: "RETAIL", gasback: 23.31, kg12: 14, kg50: 0 },
  { name: "Spiffy Laundry", branch: "SBY", type: "INDUSTRI", gasback: 11.44, kg12: 6, kg50: 0 },
  { name: "Sukardi Ayam", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Sukardi Peternak Ayam", branch: "SBY", type: "INDUSTRI", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Sutrisno Ayam", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Sutrisno Peternak Ayam", branch: "SBY", type: "INDUSTRI", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Tanamera Graha Famili", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Tanamera Trunojoyo", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Teman Setia Claypot", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Teman setia", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Tera Makan HARARU", branch: "SBY", type: "RETAIL", gasback: 27.5, kg12: 0, kg50: 0 },
  { name: "Teras Makan HARARU", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 2, kg50: 0 },
  { name: "Thrty3 Brew", branch: "SBY", type: "RETAIL", gasback: 1.75, kg12: 0, kg50: 0 },
  { name: "Toko Grosir kebonsari", branch: "SBY", type: "RETAIL", gasback: 5.37, kg12: 0, kg50: 2 },
  { name: "UD. Levis", branch: "SBY", type: "INDUSTRI", gasback: 51.01, kg12: 0, kg50: 6 },
  { name: "UD. Sampurna Pabrik Roti", branch: "SBY", type: "INDUSTRI", gasback: 66.74, kg12: 0, kg50: 6 },
  { name: "US Pizza", branch: "SBY", type: "RETAIL", gasback: 42.53, kg12: 0, kg50: 0 },
  { name: "Valor Private Space & Bar", branch: "SBY", type: "RETAIL", gasback: 82.19, kg12: 0, kg50: 0 },
  { name: "Waroeng Bamboe", branch: "SBY", type: "RETAIL", gasback: 31.3, kg12: 78, kg50: 0 },
  { name: "Wedang Joglo", branch: "SBY", type: "RETAIL", gasback: 25.76, kg12: 12, kg50: 0 },
  { name: "Wisata Rasa Rungkut Sby", branch: "SBY", type: "RETAIL", gasback: 0.04, kg12: 0, kg50: 0 },
  { name: "Wisnu Dewa", branch: "SBY", type: "RETAIL", gasback: 8.4, kg12: 16, kg50: 0 },
  { name: "Yayasan IBNU BACHIR", branch: "SBY", type: "RETAIL", gasback: 61.02, kg12: 2, kg50: 7 },
  { name: "Yayasan Khayzan Arfadhhio G", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Yayasan Khayzan Arfadhio G.", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "café Tugu Malang", branch: "SBY", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  // ── YOGYAKARTA ──────────────────────────────────────────────────────────────────────
  { name: "AL-IMDAD", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 21, kg50: 6 },
  { name: "Al-IMDAD", branch: "YOG", type: "RETAIL", gasback: 47.92, kg12: 0, kg50: 0 },
  { name: "Antologi Koperasi Ken8", branch: "YOG", type: "RETAIL", gasback: 3.02, kg12: 3, kg50: 0 },
  { name: "Arkadewi Resto XT Square", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Ayam Goreng NINIT 1983 Jakal", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 8, kg50: 0 },
  { name: "Ayam Goreng NINIT 1983 Nogotirto", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 3, kg50: 0 },
  { name: "Ayam Goreng NINIT Lempuyangan", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 4, kg50: 0 },
  { name: "Ayam Goreng Ninit 1983 Jakal", branch: "YOG", type: "RETAIL", gasback: 9.16, kg12: 0, kg50: 0 },
  { name: "Ayam Goreng Ninit 1983 Nogotirto", branch: "YOG", type: "RETAIL", gasback: 0.12, kg12: 0, kg50: 0 },
  { name: "Ayam Goreng Ninit Lempuyangan", branch: "YOG", type: "RETAIL", gasback: 0.17, kg12: 0, kg50: 0 },
  { name: "Ayam Ninit 1983 Palagan", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Ayam Panggang Mbah MO", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Ayam Panggang Mbah Mo", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Bakul Sekul", branch: "YOG", type: "RETAIL", gasback: 2.66, kg12: 8, kg50: 0 },
  { name: "Baleroso", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Baleroso Godean 3", branch: "YOG", type: "RETAIL", gasback: 241.0, kg12: 32, kg50: 0 },
  { name: "Baleroso Jakal", branch: "YOG", type: "RETAIL", gasback: 316.8, kg12: 25, kg50: 0 },
  { name: "Baleroso Prambanan", branch: "YOG", type: "RETAIL", gasback: 178.67, kg12: 38, kg50: 0 },
  { name: "Bebek Carok", branch: "YOG", type: "RETAIL", gasback: 0.4, kg12: 0, kg50: 1 },
  { name: "Bebex Cuex", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 2, kg50: 0 },
  { name: "Budi Mulia Culinary School", branch: "YOG", type: "RETAIL", gasback: 3.42, kg12: 0, kg50: 1 },
  { name: "Burger Bangor Achmad Dahlan", branch: "YOG", type: "RETAIL", gasback: 9.7, kg12: 7, kg50: 0 },
  { name: "Burger Bangor Demangan", branch: "YOG", type: "RETAIL", gasback: 25.92, kg12: 7, kg50: 0 },
  { name: "Burger Bangor Jakal 88", branch: "YOG", type: "RETAIL", gasback: 9.07, kg12: 8, kg50: 0 },
  { name: "Burger Bangor Jakal Uii", branch: "YOG", type: "RETAIL", gasback: 7.58, kg12: 10, kg50: 0 },
  { name: "Burger Bangor Janti", branch: "YOG", type: "RETAIL", gasback: 61.2, kg12: 6, kg50: 0 },
  { name: "Burger Bangor Piyungan", branch: "YOG", type: "RETAIL", gasback: 0.29, kg12: 4, kg50: 0 },
  { name: "CV. Djava Kasih Karunia", branch: "YOG", type: "INDUSTRI", gasback: 3.4, kg12: 17, kg50: 0 },
  { name: "Catering Bosskid", branch: "YOG", type: "RETAIL", gasback: 113.98, kg12: 73, kg50: 0 },
  { name: "Catering Cassava", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Catering Rahayu", branch: "YOG", type: "RETAIL", gasback: 9.31, kg12: 1, kg50: 0 },
  { name: "Catering Sirikit", branch: "YOG", type: "RETAIL", gasback: 22.73, kg12: 12, kg50: 0 },
  { name: "Chaniago Padang Resto", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Coconut Coffe Eatry", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Daniel", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Danika", branch: "YOG", type: "RETAIL", gasback: 12.75, kg12: 17, kg50: 0 },
  { name: "Dapur SPPG Gulurejo Lendah", branch: "YOG", type: "INDUSTRI", gasback: 26.05, kg12: 0, kg50: 11 },
  { name: "Dil Restaurant", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Easy Peasy Kitchen", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Gajah Mada", branch: "YOG", type: "RETAIL", gasback: 549.49, kg12: 0, kg50: 28 },
  { name: "Garage Steak", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Garage Steal", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Gudeg Wijilan Bu Lies", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Ichiban Sushi", branch: "YOG", type: "RETAIL", gasback: 0.66, kg12: 0, kg50: 3 },
  { name: "Iga Bakar Bali", branch: "YOG", type: "RETAIL", gasback: 0.59, kg12: 8, kg50: 0 },
  { name: "Ikan Bakar Kintamani", branch: "YOG", type: "RETAIL", gasback: 7.11, kg12: 7, kg50: 0 },
  { name: "JEEVA", branch: "YOG", type: "RETAIL", gasback: 13.45, kg12: 5, kg50: 0 },
  { name: "Jamur Jawon Resto", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Kampung Alit", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Kandang Ary Nugroho", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 65, kg50: 0 },
  { name: "Kandang Tosca", branch: "YOG", type: "RETAIL", gasback: 263.21, kg12: 16, kg50: 0 },
  { name: "Kanzania Roti", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Kedai Ucle J", branch: "YOG", type: "RETAIL", gasback: 17.85, kg12: 0, kg50: 0 },
  { name: "Kedai Uncle J", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 1, kg50: 3 },
  { name: "Ketan Susu", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Kevin", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Kims Bar and Kitchen", branch: "YOG", type: "RETAIL", gasback: 89.93, kg12: 0, kg50: 0 },
  { name: "Kims bar and Kitchen", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 5, kg50: 4 },
  { name: "Koat Coffe Jakal", branch: "YOG", type: "RETAIL", gasback: 2.77, kg12: 6, kg50: 0 },
  { name: "Koat Coffe Palagan", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 11, kg50: 0 },
  { name: "Koat Kopi Seturan", branch: "YOG", type: "RETAIL", gasback: 0.63, kg12: 11, kg50: 0 },
  { name: "Koat Kopi Umy", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Koat coffe Palagan", branch: "YOG", type: "RETAIL", gasback: 25.12, kg12: 0, kg50: 0 },
  { name: "Kolana Resto", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 2, kg50: 0 },
  { name: "Kolona Kitchen and Coffee", branch: "YOG", type: "RETAIL", gasback: 0.16, kg12: 0, kg50: 0 },
  { name: "Kolona Resto", branch: "YOG", type: "RETAIL", gasback: 0.64, kg12: 0, kg50: 0 },
  { name: "Kopontren Al Mumtaz", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 5 },
  { name: "Kopontren Al Muntaz", branch: "YOG", type: "RETAIL", gasback: 3.01, kg12: 0, kg50: 0 },
  { name: "Laundrifirst", branch: "YOG", type: "INDUSTRI", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Ledok Sambi", branch: "YOG", type: "RETAIL", gasback: 12.04, kg12: 66, kg50: 0 },
  { name: "Linglung Kopi", branch: "YOG", type: "RETAIL", gasback: 21.11, kg12: 10, kg50: 0 },
  { name: "Loroblonyo Catering", branch: "YOG", type: "RETAIL", gasback: 25.49, kg12: 7, kg50: 0 },
  { name: "M Tsalis Abd Jabbar", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "MBG Jetis", branch: "YOG", type: "RETAIL", gasback: 17.98, kg12: 0, kg50: 0 },
  { name: "MBG Joglo Yoso", branch: "YOG", type: "RETAIL", gasback: 210.31, kg12: 20, kg50: 6 },
  { name: "Moshi", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Nasi Hainan MeiWei", branch: "YOG", type: "RETAIL", gasback: 1.42, kg12: 4, kg50: 0 },
  { name: "Ojo Takon", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Omah Bebek", branch: "YOG", type: "RETAIL", gasback: 74.19, kg12: 22, kg50: 0 },
  { name: "Omah Bebek Jakal", branch: "YOG", type: "RETAIL", gasback: 0.51, kg12: 17, kg50: 0 },
  { name: "Omah Kopi Cokrowijayan", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Oman Kopi Cokrowijayan", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Oman Njonja", branch: "YOG", type: "RETAIL", gasback: 18.92, kg12: 11, kg50: 0 },
  { name: "PT. API", branch: "YOG", type: "INDUSTRI", gasback: 1.45, kg12: 1, kg50: 0 },
  { name: "PT. IGP International Pyungan", branch: "YOG", type: "INDUSTRI", gasback: 22.91, kg12: 0, kg50: 0 },
  { name: "PT. Lalawuh Sunda Sejati", branch: "YOG", type: "INDUSTRI", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "PT. Lawuh Sunda Sejati", branch: "YOG", type: "INDUSTRI", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "PT. Setiap Hari Beruntung", branch: "YOG", type: "INDUSTRI", gasback: 0.16, kg12: 1, kg50: 7 },
  { name: "PT. TIGA KETAPANG", branch: "YOG", type: "INDUSTRI", gasback: 58.27, kg12: 0, kg50: 1 },
  { name: "Penyetan Sedep Mantep", branch: "YOG", type: "RETAIL", gasback: 260.41, kg12: 0, kg50: 5 },
  { name: "Pibee Resto Jogja", branch: "YOG", type: "RETAIL", gasback: 6.17, kg12: 1, kg50: 0 },
  { name: "Pondok Bakaran", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Pondok Bakaran Manding", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Prima SR Hotel", branch: "YOG", type: "INDUSTRI", gasback: 0.77, kg12: 9, kg50: 5 },
  { name: "RD Harjono", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Racikan Resto", branch: "YOG", type: "RETAIL", gasback: 34.54, kg12: 11, kg50: 0 },
  { name: "Rahayu Catering", branch: "YOG", type: "RETAIL", gasback: 102.38, kg12: 10, kg50: 0 },
  { name: "Ramayana Garden Resto", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Raos Djogja", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Resto Jati Kuno", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Resto Lembah Kalasan", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Restoran", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Restoran Jejamuran", branch: "YOG", type: "RETAIL", gasback: 79.59, kg12: 11, kg50: 14 },
  { name: "Roni", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Roti Kolonial", branch: "YOG", type: "RETAIL", gasback: 0.65, kg12: 10, kg50: 0 },
  { name: "SPPG AL-IMDAD Triwidadi", branch: "YOG", type: "INDUSTRI", gasback: 51.43, kg12: 15, kg50: 9 },
  { name: "SPPG Baleharjo Wonosari 001", branch: "YOG", type: "INDUSTRI", gasback: 633.24, kg12: 2, kg50: 9 },
  { name: "SPPG Banjarharjo Kalibawang", branch: "YOG", type: "INDUSTRI", gasback: 0.0, kg12: 1, kg50: 1 },
  { name: "SPPG Bawuran (Hj. Siwi Catering)", branch: "YOG", type: "INDUSTRI", gasback: 190.92, kg12: 0, kg50: 6 },
  { name: "SPPG Bibis Bangunjiwo", branch: "YOG", type: "INDUSTRI", gasback: 8.28, kg12: 5, kg50: 7 },
  { name: "SPPG Depok Caturtunggal", branch: "YOG", type: "INDUSTRI", gasback: 0.08, kg12: 0, kg50: 2 },
  { name: "SPPG Depok Nologaten", branch: "YOG", type: "INDUSTRI", gasback: 83.61, kg12: 9, kg50: 7 },
  { name: "SPPG Dlingo", branch: "YOG", type: "INDUSTRI", gasback: 0.44, kg12: 0, kg50: 5 },
  { name: "SPPG GIWANGAN 2", branch: "YOG", type: "INDUSTRI", gasback: 329.95, kg12: 8, kg50: 8 },
  { name: "SPPG GROBOGAN GEYER GEYER", branch: "YOG", type: "INDUSTRI", gasback: 12.89, kg12: 13, kg50: 9 },
  { name: "SPPG Gunung Payung", branch: "YOG", type: "INDUSTRI", gasback: 208.78, kg12: 0, kg50: 11 },
  { name: "SPPG Kalikotes", branch: "YOG", type: "INDUSTRI", gasback: 257.63, kg12: 6, kg50: 6 },
  { name: "SPPG Klampok Ghodong", branch: "YOG", type: "INDUSTRI", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "SPPG Klampok Godong", branch: "YOG", type: "INDUSTRI", gasback: 458.71, kg12: 0, kg50: 0 },
  { name: "SPPG Kricak Tegalrejo", branch: "YOG", type: "INDUSTRI", gasback: 142.42, kg12: 8, kg50: 10 },
  { name: "SPPG LEDOKDAWAN SITARDA", branch: "YOG", type: "INDUSTRI", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "SPPG Nurul Qur\'an", branch: "YOG", type: "INDUSTRI", gasback: 159.19, kg12: 5, kg50: 9 },
  { name: "SPPG Pendowoharjo", branch: "YOG", type: "INDUSTRI", gasback: 0.0, kg12: 1, kg50: 1 },
  { name: "SPPG Playen", branch: "YOG", type: "INDUSTRI", gasback: 0.44, kg12: 0, kg50: 5 },
  { name: "SPPG Ponjong", branch: "YOG", type: "INDUSTRI", gasback: 309.6, kg12: 69, kg50: 0 },
  { name: "SPPG Purwobinangun", branch: "YOG", type: "INDUSTRI", gasback: 17.06, kg12: 0, kg50: 5 },
  { name: "SPPG SAMBAK DANYANG", branch: "YOG", type: "INDUSTRI", gasback: 122.97, kg12: 10, kg50: 13 },
  { name: "SPPG SEMBUNG WEDI KLATEN", branch: "YOG", type: "INDUSTRI", gasback: 193.34, kg12: 0, kg50: 5 },
  { name: "SPPG SMK MUHAMMADIYAH Cangkringan", branch: "YOG", type: "INDUSTRI", gasback: 35.94, kg12: 8, kg50: 10 },
  { name: "SPPG Sendangtirto", branch: "YOG", type: "INDUSTRI", gasback: 16.72, kg12: 2, kg50: 5 },
  { name: "SPPG Srimartani 3", branch: "YOG", type: "INDUSTRI", gasback: 0.86, kg12: 3, kg50: 3 },
  { name: "SPPG Tegalrejo", branch: "YOG", type: "INDUSTRI", gasback: 71.51, kg12: 0, kg50: 2 },
  { name: "SPPG Timbulharjo 3 Sewon", branch: "YOG", type: "INDUSTRI", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "SPPG Timulharjo 3 Sewon", branch: "YOG", type: "INDUSTRI", gasback: 0.0, kg12: 1, kg50: 1 },
  { name: "SPPG Toroh Boloh", branch: "YOG", type: "INDUSTRI", gasback: 35.67, kg12: 36, kg50: 0 },
  { name: "SPPG Trihanggo Gamping", branch: "YOG", type: "INDUSTRI", gasback: 410.52, kg12: 4, kg50: 17 },
  { name: "SPPG WI Ngemplak", branch: "YOG", type: "INDUSTRI", gasback: 0.0, kg12: 0, kg50: 2 },
  { name: "SPPG WI Tridadi", branch: "YOG", type: "INDUSTRI", gasback: 0.18, kg12: 0, kg50: 2 },
  { name: "STATE Café and Brasserie", branch: "YOG", type: "RETAIL", gasback: 58.87, kg12: 5, kg50: 6 },
  { name: "Sampai Villa", branch: "YOG", type: "RETAIL", gasback: 0.29, kg12: 30, kg50: 0 },
  { name: "Savita Indonesia", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Selo Coffe", branch: "YOG", type: "RETAIL", gasback: 1.52, kg12: 9, kg50: 0 },
  { name: "Selo Coffe 2", branch: "YOG", type: "RETAIL", gasback: 0.38, kg12: 12, kg50: 0 },
  { name: "Seoltan Café And Eatery", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Silol Kopi", branch: "YOG", type: "RETAIL", gasback: 324.93, kg12: 7, kg50: 6 },
  { name: "Smile Laundry", branch: "YOG", type: "INDUSTRI", gasback: 12.43, kg12: 4, kg50: 0 },
  { name: "Soeltan Café And Eatery", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 2, kg50: 0 },
  { name: "Star Laundry", branch: "YOG", type: "INDUSTRI", gasback: 1.38, kg12: 23, kg50: 0 },
  { name: "Suryo Mapan", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 1, kg50: 0 },
  { name: "Tantri", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Tawan Malioboro Jogja", branch: "YOG", type: "RETAIL", gasback: 0.56, kg12: 0, kg50: 6 },
  { name: "Teduh Coffe (Ditro Grill Cofee)", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 10, kg50: 0 },
  { name: "Teduh Coffee (Ditro Grill Cofee)", branch: "YOG", type: "RETAIL", gasback: 19.35, kg12: 0, kg50: 0 },
  { name: "Teratai 78", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "The Cakala Residence", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Theory Laundry", branch: "YOG", type: "INDUSTRI", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Timbuul Roso", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Villa", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "WARUNG RABURAI JOGJA", branch: "YOG", type: "RETAIL", gasback: 19.01, kg12: 0, kg50: 0 },
  { name: "WARUNG TABURAI JOGJA", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 5 },
  { name: "Wanawatu Resto", branch: "YOG", type: "RETAIL", gasback: 116.87, kg12: 14, kg50: 8 },
  { name: "Waroeng Cukup Sambal", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Warung Makan Lodho Ayam", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Warung Watoe Gadjah", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Wijaya Boga Catering", branch: "YOG", type: "RETAIL", gasback: 0.0, kg12: 0, kg50: 0 },
  { name: "Yayasan Sahabat Anak Nusa", branch: "YOG", type: "RETAIL", gasback: 57.94, kg12: 16, kg50: 13 },
  { name: "Yomok Iki", branch: "YOG", type: "RETAIL", gasback: 0.08, kg12: 5, kg50: 4 },
];const DELIVERY_ORDERS = [
  { date:"2026-03-02", noPo:"PO-2026-02-5640", noSj:"02-735", driver:"HENDRIK/TEGUH", customer:"Hotel Vrana Culture", rel12:0, rel50:5, tonase:250.0, rec12:0, rec50:2, notes:"" },
  { date:"2026-03-02", noPo:"PO-2026-02-5820", noSj:"02-741", driver:"RUDI/WAHYU", customer:"GT AL-Hikmah Gayungsari", rel12:25, rel50:0, tonase:300.0, rec12:21, rec50:0, notes:"" },
  { date:"2026-03-02", noPo:"PO-2026-02-5826", noSj:"02-736", driver:"HENDRIK/TEGUH", customer:"Sitara Indian Restauran Kodam", rel12:0, rel50:4, tonase:200.0, rec12:0, rec50:4, notes:"" },
  { date:"2026-03-02", noPo:"PO-2026-03-18", noSj:"02-739", driver:"HENDRIK/TEGUH", customer:"Burger Bangor Dharmawangsa", rel12:2, rel50:0, tonase:24.0, rec12:3, rec50:0, notes:"" },
  { date:"2026-03-02", noPo:"PO-2026-03-38", noSj:"02-740", driver:"HENDRIK/TEGUH", customer:"Burger Bangor Tenggilis", rel12:3, rel50:0, tonase:36.0, rec12:3, rec50:0, notes:"" },
  { date:"2026-03-02", noPo:"PO-2026-03-114", noSj:"02-737", driver:"HENDRIK/TEGUH", customer:"Hotel SRV Surabaya River View", rel12:5, rel50:0, tonase:60.0, rec12:0, rec50:0, notes:"" },
  { date:"2026-03-02", noPo:"PO-2026-03-118", noSj:"02-742", driver:"RUDI/WAHYU", customer:"Burger Bangor Krian", rel12:4, rel50:0, tonase:48.0, rec12:4, rec50:0, notes:"" },
  { date:"2026-03-02", noPo:"PO-2026-03-144", noSj:"02-743", driver:"RUDI/WAHYU", customer:"Amor Resto", rel12:0, rel50:3, tonase:150.0, rec12:0, rec50:2, notes:"" },
  { date:"2026-03-02", noPo:"PO-2026-03-170", noSj:"02-738", driver:"HENDRIK/TEGUH", customer:"Flamboyan Bakery Medokan", rel12:6, rel50:0, tonase:72.0, rec12:5, rec50:0, notes:"" },
  { date:"2026-03-02", noPo:"PO-2026-03-178", noSj:"02-744", driver:"RUDI/WAHYU", customer:"Aqiqah SDA", rel12:15, rel50:0, tonase:180.0, rec12:15, rec50:0, notes:"" },
  { date:"2026-03-02", noPo:"PO-2026-03-215", noSj:"02-745", driver:"RUDI/WAHYU", customer:"Koat Coffee", rel12:4, rel50:0, tonase:48.0, rec12:4, rec50:0, notes:"" },
  { date:"2026-03-03", noPo:"PO-2026-03-14", noSj:"02-746", driver:"RUDI/WAHYU", customer:"RSUD dr. R. Koesma Tuban/ Gizi", rel12:0, rel50:6, tonase:300.0, rec12:0, rec50:6, notes:"" },
  { date:"2026-03-03", noPo:"PO-2026-03-23", noSj:"02-747", driver:"RUDI/WAHYU", customer:"RSUD dr. R. Koesma Tuban/ Laundry", rel12:0, rel50:3, tonase:150.0, rec12:0, rec50:3, notes:"" },
  { date:"2026-03-03", noPo:"PO-2026-03-171", noSj:"02-748", driver:"RUDI/WAHYU", customer:"Dewa Seafood Tuban", rel12:20, rel50:0, tonase:240.0, rec12:30, rec50:0, notes:"" },
  { date:"2026-03-03", noPo:"PO-2026-03-186", noSj:"02-749", driver:"RUDI/WAHYU", customer:"PT. Insan Citraprima Sejahtera Tuban", rel12:35, rel50:0, tonase:420.0, rec12:43, rec50:0, notes:"" },
  { date:"2026-03-03", noPo:"PO-2026-02-5524", noSj:"02-750", driver:"HENDRIK/NANANG", customer:"Burger Bangor Gwalk", rel12:1, rel50:0, tonase:12.0, rec12:0, rec50:0, notes:"" },
  { date:"2026-03-03", noPo:"PO-2026-03-354", noSj:"", driver:"", customer:"Burger Bangor Gwalk", rel12:1, rel50:0, tonase:12.0, rec12:2, rec50:0, notes:"" },
  { date:"2026-03-03", noPo:"PO-2026-03-222", noSj:"02-751", driver:"HENDRIK/NANANG", customer:"Midnight Baker Imam Bonjol", rel12:0, rel50:4, tonase:200.0, rec12:0, rec50:3, notes:"" },
  { date:"2026-03-03", noPo:"PO-2026-03-254", noSj:"02-752", driver:"HENDRIK/NANANG", customer:"Kwetiau Akang", rel12:4, rel50:0, tonase:48.0, rec12:4, rec50:0, notes:"" },
  { date:"2026-03-03", noPo:"PO-2026-03-256", noSj:"02-753", driver:"HENDRIK/NANANG", customer:"RPHU Lakarsantri", rel12:0, rel50:2, tonase:100.0, rec12:0, rec50:2, notes:"" },
  { date:"2026-03-03", noPo:"PO-2026-03-277", noSj:"02-754", driver:"HENDRIK/NANANG", customer:"Sin Cia Po", rel12:4, rel50:0, tonase:48.0, rec12:4, rec50:0, notes:"" },
  { date:"2026-03-03", noPo:"PO-2026-03-305", noSj:"02-755", driver:"HENDRIK/NANANG", customer:"Akbar SIIP", rel12:30, rel50:0, tonase:360.0, rec12:31, rec50:0, notes:"" },
  { date:"2026-03-03", noPo:"PO-2026-03-379", noSj:"02-756", driver:"HENDRIK/NANANG", customer:"Restoran Padang Sederhana Sby", rel12:7, rel50:2, tonase:184.0, rec12:6, rec50:2, notes:"" },
  { date:"2026-03-03", noPo:"PO-2026-03-403", noSj:"02-757", driver:"HENDRIK/NANANG", customer:"Burger Bangor Bukit Palma", rel12:3, rel50:0, tonase:36.0, rec12:2, rec50:0, notes:"" },
  { date:"2026-03-03", noPo:"PO-2026-03-423", noSj:"02-758", driver:"HENDRIK/NANANG", customer:"Kopi Padma Jemusari", rel12:0, rel50:1, tonase:50.0, rec12:0, rec50:1, notes:"" },
  { date:"2026-03-03", noPo:"PO-2026-03-476", noSj:"02-759", driver:"HENDRIK/NANANG", customer:"1996 Coffe House", rel12:5, rel50:0, tonase:60.0, rec12:4, rec50:0, notes:"1 Tbg Kembali Tanpa PO" },
  { date:"2026-03-03", noPo:"PO-2026-03-470", noSj:"02-760", driver:"ANTOK/TEGUH", customer:"GEN SPPG Tanah Merah Bangkalan", rel12:0, rel50:2, tonase:100.0, rec12:0, rec50:2, notes:"" },
  { date:"2026-03-03", noPo:"PO-2026-03-471", noSj:"02-761", driver:"ANTOK/TEGUH", customer:"DG GEN SPPG Durjan Kolla", rel12:0, rel50:3, tonase:150.0, rec12:0, rec50:8, notes:"" },
  { date:"2026-03-03", noPo:"PO-2026-03-474", noSj:"02-762", driver:"ANTOK/TEGUH", customer:"DG GEN SPPG Bunda Durjan", rel12:0, rel50:3, tonase:150.0, rec12:0, rec50:0, notes:"" },
  { date:"2026-03-03", noPo:"PO-2026-03-477", noSj:"02-763", driver:"ANTOK/TEGUH", customer:"DG GEN SPPG Tera\'teros Durjan Bangkalan", rel12:0, rel50:3, tonase:150.0, rec12:0, rec50:0, notes:"" },
  { date:"2026-03-03", noPo:"PO-2026-03-484", noSj:"02-764", driver:"ANTOK/TEGUH", customer:"DS SPPG Putra Barokah Ragung", rel12:0, rel50:4, tonase:200.0, rec12:0, rec50:3, notes:"" },
  { date:"2026-03-03", noPo:"PO-2026-03-616", noSj:"", driver:"ANTOK/TEGUH", customer:"DS SPPG Putra Barokah Ragung", rel12:3, rel50:0, tonase:36.0, rec12:3, rec50:0, notes:"" },
  { date:"2026-03-03", noPo:"PO-2026-03-485", noSj:"02-765", driver:"ANTOK/TEGUH", customer:"DS SPPG Putra Barokah Gulbung", rel12:0, rel50:4, tonase:200.0, rec12:0, rec50:4, notes:"" },
  { date:"2026-03-03", noPo:"PO-2026-03-627", noSj:"", driver:"ANTOK/TEGUH", customer:"DS SPPG Putra Barokah Gulbung", rel12:3, rel50:0, tonase:36.0, rec12:3, rec50:0, notes:"" },
  { date:"2026-03-03", noPo:"PO-2026-03-552", noSj:"02-766", driver:"ANTOK/TEGUH", customer:"MMU SPPG Buluh Socah", rel12:0, rel50:2, tonase:100.0, rec12:1, rec50:2, notes:"" },
  { date:"2026-03-03", noPo:"PO-2026-03-586", noSj:"02-767", driver:"ANTOK/TEGUH", customer:"MMU SPPG Mortonggak Ragung", rel12:6, rel50:3, tonase:222.0, rec12:0, rec50:5, notes:"" },
  { date:"2026-03-03", noPo:"PO-2026-03-587", noSj:"02-768", driver:"ANTOK/TEGUH", customer:"MMU SPPG Rominah Daleman", rel12:0, rel50:2, tonase:100.0, rec12:0, rec50:1, notes:"" },
  { date:"2026-03-03", noPo:"PO-2026-03-289", noSj:"02-770", driver:"NANANG/FIKRI", customer:"Wedang Joglo", rel12:8, rel50:0, tonase:96.0, rec12:4, rec50:0, notes:"" },
  { date:"2026-03-03", noPo:"PO-2026-03-436", noSj:"02-771", driver:"NANANG/FIKRI", customer:"SPPG Damarsi Buduran", rel12:20, rel50:0, tonase:240.0, rec12:20, rec50:0, notes:"" },
  { date:"2026-03-03", noPo:"PO-2026-03-454", noSj:"02-772", driver:"NANANG/FIKRI", customer:"SPPG Sengon Agung I", rel12:0, rel50:4, tonase:200.0, rec12:0, rec50:3, notes:"" },
  { date:"2026-03-03", noPo:"PO-2026-03-468", noSj:"02-773", driver:"NANANG/FIKRI", customer:"SPPG Tosari Pasuruan", rel12:50, rel50:0, tonase:600.0, rec12:41, rec50:0, notes:"" },
  { date:"2026-03-04", noPo:"PO-2026-03-588", noSj:"02-769", driver:"ANTOK/TEGUH", customer:"MMU SPPG Kramat Panglegur", rel12:0, rel50:2, tonase:100.0, rec12:0, rec50:3, notes:"" },
  { date:"2026-03-04", noPo:"PO-2026-03-597", noSj:"GB 03-001", driver:"RUDI/WAHYU", customer:"Wisata Rasa", rel12:15, rel50:0, tonase:180.0, rec12:15, rec50:0, notes:"" },
  { date:"2026-03-04", noPo:"PO-2026-03-540", noSj:"03-774", driver:"RUDI/WAHYU", customer:"Spiffy Laundry", rel12:2, rel50:0, tonase:24.0, rec12:2, rec50:0, notes:"" },
  { date:"2026-03-04", noPo:"PO-2026-03-541", noSj:"", driver:"RUDI/WAHYU", customer:"Hot Ways Pondok Jati Sda", rel12:0, rel50:4, tonase:200.0, rec12:0, rec50:4, notes:"" },
  { date:"2026-03-04", noPo:"PO-2026-03-566", noSj:"03-775", driver:"RUDI/WAHYU", customer:"Fork Resto Tunjungan", rel12:7, rel50:0, tonase:84.0, rec12:9, rec50:0, notes:"" },
  { date:"2026-03-04", noPo:"PO-2026-03-583", noSj:"03-776", driver:"RUDI/WAHYU", customer:"UD Sampurna Pabrik Roti", rel12:0, rel50:3, tonase:150.0, rec12:0, rec50:5, notes:"" },
  { date:"2026-03-04", noPo:"PO-2026-03-584", noSj:"03-777", driver:"RUDI/WAHYU", customer:"Hotel Neo", rel12:5, rel50:0, tonase:60.0, rec12:5, rec50:0, notes:"" },
  { date:"2026-03-04", noPo:"PO-2026-03-594", noSj:"03-778", driver:"RUDI/WAHYU", customer:"Huangdi Resto", rel12:1, rel50:2, tonase:112.0, rec12:2, rec50:2, notes:"" },
  { date:"2026-03-04", noPo:"PO-2026-03-596", noSj:"03-779", driver:"RUDI/WAHYU", customer:"HC Ellenoir", rel12:2, rel50:0, tonase:24.0, rec12:2, rec50:0, notes:"" },
  { date:"2026-03-04", noPo:"PO-2026-03-635", noSj:"03-780", driver:"RUDI/WAHYU", customer:"Ekata Resto", rel12:0, rel50:2, tonase:100.0, rec12:0, rec50:2, notes:"" },
  { date:"2026-03-05", noPo:"PO-2026-03-577", noSj:"03-782", driver:"RUDI/HENDRIK", customer:"Burger Bangor Mulyosari", rel12:2, rel50:0, tonase:24.0, rec12:2, rec50:0, notes:"" },
  { date:"2026-03-05", noPo:"PO-2026-03-645", noSj:"03-783", driver:"RUDI/HENDRIK", customer:"RPHU Pegirian", rel12:2, rel50:0, tonase:24.0, rec12:2, rec50:0, notes:"" },
  { date:"2026-03-05", noPo:"PO-2026-03-651", noSj:"03-784", driver:"RUDI/HENDRIK", customer:"Aqiqah Sda", rel12:10, rel50:0, tonase:120.0, rec12:10, rec50:0, notes:"" },
  { date:"2026-03-05", noPo:"PO-2026-03-672", noSj:"03-785", driver:"RUDI/HENDRIK", customer:"Flamboyan Laundry Kedung Sroko", rel12:6, rel50:0, tonase:72.0, rec12:13, rec50:0, notes:"" },
  { date:"2026-03-05", noPo:"PO-2026-03-683", noSj:"03-786", driver:"RUDI/HENDRIK", customer:"Kembang Merah", rel12:5, rel50:0, tonase:60.0, rec12:9, rec50:0, notes:"" },
  { date:"2026-03-05", noPo:"PO-2026-03-787", noSj:"03-787", driver:"RUDI/HENDRIK", customer:"Burger Bangor Dharmawangsa", rel12:2, rel50:0, tonase:24.0, rec12:2, rec50:0, notes:"" },
  { date:"2026-03-05", noPo:"PO-2026-03-814", noSj:"03-788", driver:"RUDI/HENDRIK", customer:"Flamboyan Laundry Gunung Anyar", rel12:6, rel50:0, tonase:72.0, rec12:3, rec50:0, notes:"Kembali Tanpa PO" },
  { date:"2026-03-05", noPo:"PO-2026-03-815", noSj:"03-789", driver:"RUDI/HENDRIK", customer:"Flamboyan Laondry Jojoran", rel12:6, rel50:0, tonase:72.0, rec12:5, rec50:0, notes:"" },
  { date:"2026-03-05", noPo:"PO-2026-03-816", noSj:"03-790", driver:"RUDI/HENDRIK", customer:"Flamboyan Laundry Bakery Medokan", rel12:6, rel50:0, tonase:72.0, rec12:3, rec50:0, notes:"" },
  { date:"2026-03-05", noPo:"PO-2026-03-833", noSj:"03-791", driver:"RUDI/HENDRIK", customer:"Dimsum Kobar", rel12:10, rel50:0, tonase:120.0, rec12:11, rec50:0, notes:"" },
  { date:"2026-03-05", noPo:"PO-2026-03-862", noSj:"03-792", driver:"RUDI/HENDRIK", customer:"SPPG A.T Kusuma Dewi", rel12:10, rel50:0, tonase:120.0, rec12:9, rec50:0, notes:"" },
  { date:"2026-03-05", noPo:"PO-2026-03-896", noSj:"GB 02-002", driver:"RUDI/HENDRIK", customer:"Pocan Bu Erna", rel12:1, rel50:0, tonase:12.0, rec12:1, rec50:0, notes:"" },
  { date:"2026-03-05", noPo:"PO-2026-03-904", noSj:"03-793", driver:"RUDI/HENDRIK", customer:"SPPG Bulak Banteng", rel12:0, rel50:3, tonase:150.0, rec12:0, rec50:5, notes:"" },
  { date:"2026-03-05", noPo:"PO-2026-03-726", noSj:"03-794", driver:"ANTOK/NANANG", customer:"OOF SPPG Gunung Sekar", rel12:3, rel50:3, tonase:186.0, rec12:2, rec50:3, notes:"" },
  { date:"2026-03-05", noPo:"PO-2026-03-910", noSj:"03-796", driver:"ANTOK/NANANG", customer:"SPPG Pangarengan Torjun", rel12:25, rel50:0, tonase:300.0, rec12:19, rec50:0, notes:"" },
  { date:"2026-03-05", noPo:"PO-2026-03-914", noSj:"03-797", driver:"ANTOK/NANANG", customer:"MMU SPPG Kocadur Daleman", rel12:3, rel50:4, tonase:236.0, rec12:2, rec50:2, notes:"" },
  { date:"2026-03-05", noPo:"PO-2026-03-915", noSj:"03-798", driver:"ANTOK/NANANG", customer:"MMU SPPG Gunung Rancak Robatal", rel12:0, rel50:5, tonase:250.0, rec12:0, rec50:0, notes:"" },
  { date:"2026-03-05", noPo:"PO-2026-03-916", noSj:"03-799", driver:"ANTOK/NANANG", customer:"MMU SPPG Sabe Jeruk Banyuates", rel12:0, rel50:4, tonase:200.0, rec12:0, rec50:0, notes:"" },
  { date:"2026-03-06", noPo:"PO-2026-03-795", noSj:"03-795", driver:"ANTOK/NANANG", customer:"SPPG Tamberu Barat", rel12:0, rel50:4, tonase:200.0, rec12:7, rec50:12, notes:"" },
  { date:"2026-03-06", noPo:"PO-2026-03-917", noSj:"03-800", driver:"ANTOK/NANANG", customer:"MMU SPPG Katpang Timur", rel12:0, rel50:4, tonase:200.0, rec12:0, rec50:3, notes:"" },
  { date:"2026-03-06", noPo:"PO-2026-03-918", noSj:"03-801", driver:"ANTOK/NANANG", customer:"MMU SPPG Lembung Sokobanah", rel12:0, rel50:6, tonase:300.0, rec12:2, rec50:2, notes:"" },
  { date:"2026-03-06", noPo:"PO-2026-03-919", noSj:"03-802", driver:"ANTOK/NANANG", customer:"MMU SPPG Lebak Sokobanah", rel12:0, rel50:3, tonase:150.0, rec12:0, rec50:3, notes:"" },
  { date:"2026-03-06", noPo:"PO-2026-03-920", noSj:"03-803", driver:"ANTOK/NANANG", customer:"MMU SPPG Gunung Tangis Rek Kerek", rel12:0, rel50:6, tonase:300.0, rec12:0, rec50:5, notes:"" },
  { date:"2026-03-06", noPo:"PO-2026-03-731", noSj:"03-804", driver:"HENDRIK/WAHYU", customer:"Waroeng Bamboe Batu", rel12:30, rel50:0, tonase:360.0, rec12:26, rec50:0, notes:"" },
  { date:"2026-03-06", noPo:"PO-2026-03-969", noSj:"03-805", driver:"HENDRIK/WAHYU", customer:"Amstirdam Coffee Roastery", rel12:8, rel50:0, tonase:96.0, rec12:8, rec50:0, notes:"" },
  { date:"2026-03-06", noPo:"PO-2026-03-1021", noSj:"03-806", driver:"HENDRIK/WAHYU", customer:"SPPG Pakisaji Malang", rel12:0, rel50:3, tonase:150.0, rec12:0, rec50:4, notes:"" },
  { date:"2026-03-06", noPo:"PO-2026-03-1022", noSj:"03-807", driver:"HENDRIK/WAHYU", customer:"RM Sumringah 1", rel12:10, rel50:0, tonase:120.0, rec12:20, rec50:0, notes:"" },
  { date:"2026-03-06", noPo:"PO-2026-03-1057", noSj:"03-813", driver:"HENDRIK/WAHYU", customer:"Bakso Cak Pitung", rel12:10, rel50:0, tonase:120.0, rec12:10, rec50:0, notes:"" },
  { date:"2026-03-06", noPo:"PO-2026-03-826", noSj:"03-808", driver:"RUDI/TEGUH", customer:"Sitara Indian Restauran Unesa", rel12:0, rel50:3, tonase:150.0, rec12:0, rec50:3, notes:"" },
  { date:"2026-03-06", noPo:"PO-2026-03-827", noSj:"03-809", driver:"RUDI/TEGUH", customer:"Rahang Tuna", rel12:2, rel50:4, tonase:224.0, rec12:1, rec50:4, notes:"" },
  { date:"2026-03-06", noPo:"PO-2026-03-979", noSj:"03-810", driver:"RUDI/TEGUH", customer:"Sin Cia Po", rel12:4, rel50:0, tonase:48.0, rec12:2, rec50:0, notes:"" },
  { date:"2026-03-06", noPo:"PO-2026-03-1039", noSj:"03-811", driver:"RUDI/TEGUH", customer:"Burger Bangor Gwalk", rel12:2, rel50:0, tonase:24.0, rec12:2, rec50:0, notes:"" },
  { date:"2026-03-06", noPo:"PO-2026-03-1049", noSj:"03-812", driver:"RUDI/TEGUH", customer:"Resto Huangdi Sby", rel12:1, rel50:1, tonase:62.0, rec12:0, rec50:1, notes:"" },
  { date:"2026-03-06", noPo:"PO-2026-03-1059", noSj:"03-814", driver:"RUDI/TEGUH", customer:"Burger Bangor Bukit Plama", rel12:2, rel50:0, tonase:24.0, rec12:2, rec50:0, notes:"" },
  { date:"2026-03-06", noPo:"PO-2026-03-1074", noSj:"03-815", driver:"ANTOK/NANANG", customer:"MMU SPPG AL HUSNI  Klampar, Banyumas", rel12:0, rel50:6, tonase:0.0, rec12:0, rec50:19, notes:"" },
  { date:"2026-03-07", noPo:"PO-2026-03-1107", noSj:"03-816", driver:"RUDI/TEGUH", customer:"Akbar SIIP", rel12:25, rel50:0, tonase:300.0, rec12:31, rec50:0, notes:"" },
  { date:"2026-03-07", noPo:"PO-2026-03-1120", noSj:"03-817", driver:"RUDI/TEGUH", customer:"Burger Bangor Geluran", rel12:2, rel50:0, tonase:24.0, rec12:2, rec50:0, notes:"1 Tbg Kembali Tanpa PO" },
  { date:"2026-03-07", noPo:"PO-2026-03-1144", noSj:"03-818", driver:"RUDI/TEGUH", customer:"UD Sampurna Pabrik Roti", rel12:0, rel50:3, tonase:150.0, rec12:0, rec50:3, notes:"" },
  { date:"2026-03-07", noPo:"PO-2026-03-1190", noSj:"03-819", driver:"RUDI/TEGUH", customer:"Kwetiau Akang", rel12:5, rel50:0, tonase:60.0, rec12:5, rec50:0, notes:"" },
  { date:"2026-03-07", noPo:"PO-2026-03-1228", noSj:"03-820", driver:"RUDI/TEGUH", customer:"Burger Bangor Karangpilang", rel12:2, rel50:0, tonase:24.0, rec12:2, rec50:0, notes:"" },
  { date:"2026-03-07", noPo:"PO-2026-03-1237", noSj:"03-821", driver:"RUDI/TEGUH", customer:"Pia Calista", rel12:10, rel50:0, tonase:120.0, rec12:18, rec50:0, notes:"" },
  { date:"2026-03-07", noPo:"PO-2026-03-1266", noSj:"03-822", driver:"RUDI/TEGUH", customer:"SPPG Pagesangan", rel12:10, rel50:1, tonase:170.0, rec12:0, rec50:0, notes:"" },
  { date:"2026-03-07", noPo:"PO-2026-03-1075", noSj:"03-823", driver:"HENDRIK/NANANG", customer:"RS MMC Sby", rel12:5, rel50:0, tonase:60.0, rec12:4, rec50:0, notes:"Kembali tanpa PO" },
  { date:"2026-03-07", noPo:"PO-2026-03-1138", noSj:"03-824", driver:"HENDRIK/NANANG", customer:"Burger Bangor Mulyosari", rel12:2, rel50:0, tonase:24.0, rec12:2, rec50:0, notes:"" },
  { date:"2026-03-07", noPo:"PO-2026-03-1145", noSj:"03-825", driver:"HENDRIK/NANANG", customer:"Fork Resto Tunjungan", rel12:10, rel50:0, tonase:120.0, rec12:8, rec50:0, notes:"" },
  { date:"2026-03-07", noPo:"PO-2026-03-1174", noSj:"03-826", driver:"HENDRIK/NANANG", customer:"Burger Bangor Perak", rel12:2, rel50:0, tonase:24.0, rec12:2, rec50:0, notes:"" },
  { date:"2026-03-07", noPo:"PO-2026-03-1233", noSj:"03-827", driver:"HENDRIK/NANANG", customer:"SPPG Kedungturi", rel12:0, rel50:4, tonase:200.0, rec12:0, rec50:3, notes:"" },
  { date:"2026-03-09", noPo:"PO-2026-03-1590", noSj:"", driver:"RUDI/WAHYU", customer:"Restauran Sederhana Padang Sby", rel12:6, rel50:3, tonase:222.0, rec12:6, rec50:3, notes:"" },
  { date:"2026-03-09", noPo:"PO-2026-03-1425", noSj:"", driver:"RUDI/WAHYU", customer:"Hotel Bekizaar", rel12:0, rel50:1, tonase:50.0, rec12:0, rec50:0, notes:"" },
  { date:"2026-03-09", noPo:"PO-2026-03-1426", noSj:"", driver:"RUDI/WAHYU", customer:"Hotel Bekizaar", rel12:0, rel50:2, tonase:100.0, rec12:0, rec50:4, notes:"" },
  { date:"2026-03-09", noPo:"PO-2026-03-1340", noSj:"", driver:"RUDI/WAHYU", customer:"MB Sedap Malam", rel12:0, rel50:3, tonase:150.0, rec12:0, rec50:3, notes:"" },
  { date:"2026-03-09", noPo:"PO-2026-03-1461", noSj:"", driver:"RUDI/WAHYU", customer:"Burger Bangor Tenggilis", rel12:3, rel50:0, tonase:36.0, rec12:3, rec50:0, notes:"" },
  { date:"2026-03-09", noPo:"PO-2026-03-1546", noSj:"", driver:"RUDI/WAHYU", customer:"Burger Bangor Dharmawangsa", rel12:2, rel50:0, tonase:24.0, rec12:2, rec50:0, notes:"" },
  { date:"2026-03-09", noPo:"PO-2026-03-1306", noSj:"", driver:"RUDI/WAHYU", customer:"Burger Bangor Dharmawangsa", rel12:1, rel50:0, tonase:12.0, rec12:1, rec50:0, notes:"" },
  { date:"2026-03-09", noPo:"PO-2026-03-1589", noSj:"", driver:"NANANG/TEGUH", customer:"SPPG Mlajah", rel12:0, rel50:3, tonase:150.0, rec12:0, rec50:3, notes:"" },
  { date:"2026-03-09", noPo:"PO-2026-03-1593", noSj:"", driver:"NANANG/TEGUH", customer:"DS SPPG Ningrat Kemayoran", rel12:0, rel50:2, tonase:100.0, rec12:0, rec50:0, notes:"" },
  { date:"2026-03-09", noPo:"PO-2026-03-1657", noSj:"", driver:"NANANG/TEGUH", customer:"DG SPPG Samaran, Sampang", rel12:0, rel50:6, tonase:300.0, rec12:0, rec50:5, notes:"" },
  { date:"2026-03-09", noPo:"PO-2026-03-1660", noSj:"", driver:"NANANG/TEGUH", customer:"SPPG Banyubunih 02", rel12:0, rel50:4, tonase:200.0, rec12:0, rec50:4, notes:"" },
  { date:"2026-03-09", noPo:"PO-2026-03-1659", noSj:"", driver:"NANANG/TEGUH", customer:"GEN SPPG Banyubunih 03", rel12:0, rel50:4, tonase:200.0, rec12:0, rec50:3, notes:"" },
  { date:"2026-03-09", noPo:"PO-2026-03-1575", noSj:"", driver:"ANTOK/HNEDRIK", customer:"SPPG Banjarbendo", rel12:0, rel50:3, tonase:150.0, rec12:0, rec50:4, notes:"" },
  { date:"2026-03-09", noPo:"PO-2026-03-1602", noSj:"", driver:"ANTOK/HNEDRIK", customer:"HC ACS", rel12:0, rel50:10, tonase:500.0, rec12:0, rec50:5, notes:"" },
  { date:"2026-03-09", noPo:"PO-2026-03-1444", noSj:"", driver:"ANTOK/HNEDRIK", customer:"AQIQOH", rel12:10, rel50:0, tonase:120.0, rec12:11, rec50:0, notes:"" },
  { date:"2026-03-09", noPo:"PO-2026-03-1594", noSj:"", driver:"AMBIL SENDIRI", customer:"HC ACS", rel12:0, rel50:10, tonase:500.0, rec12:0, rec50:7, notes:"" },
  { date:"2026-03-10", noPo:"PO-2026-03-1394", noSj:"03-842", driver:"RUDI/WAHYU", customer:"RSUD dr. R. Koesma Tuban/ Gizi", rel12:0, rel50:4, tonase:200.0, rec12:0, rec50:4, notes:"" },
  { date:"2026-03-10", noPo:"PO-2026-03-1411", noSj:"03-843", driver:"RUDI/WAHYU", customer:"RSUD dr. R. Koesma Tuban/ Laundry", rel12:0, rel50:4, tonase:200.0, rec12:0, rec50:4, notes:"" },
  { date:"2026-03-10", noPo:"PO-2026-03-1581", noSj:"03-844", driver:"RUDI/WAHYU", customer:"Dewa Seafood Tuban", rel12:20, rel50:0, tonase:240.0, rec12:20, rec50:0, notes:"" },
  { date:"2026-03-10", noPo:"PO-2026-03-1755", noSj:"03-845", driver:"RUDI/WAHYU", customer:"PT. Insan Citraprima Sejahtera", rel12:20, rel50:0, tonase:240.0, rec12:20, rec50:0, notes:"" },
  { date:"2026-03-10", noPo:"PO-2026-03-1756", noSj:"03-846", driver:"RUDI/WAHYU", customer:"PT. Insan Citraprima Sejahtera", rel12:20, rel50:0, tonase:240.0, rec12:35, rec50:0, notes:"" },
  { date:"2026-03-10", noPo:"PO-2026-03-1796", noSj:"03-847", driver:"RUDI/WAHYU", customer:"SPPG Sukorame Lamongan", rel12:1, rel50:5, tonase:262.0, rec12:1, rec50:5, notes:"" },
  { date:"2026-03-10", noPo:"PO-2026-03-1603", noSj:"03-848", driver:"NANANG/TEGUH", customer:"Global Teknik", rel12:7, rel50:2, tonase:184.0, rec12:7, rec50:0, notes:"" },
  { date:"2026-03-10", noPo:"PO-2026-03-1678", noSj:"03-849", driver:"NANANG/TEGUH", customer:"RSIA Merr Sby", rel12:0, rel50:4, tonase:200.0, rec12:0, rec50:4, notes:"" },
  { date:"2026-03-10", noPo:"PO-2026-03-1747", noSj:"03-850", driver:"NANANG/TEGUH", customer:"Soes Merdeka Sda", rel12:9, rel50:0, tonase:108.0, rec12:9, rec50:0, notes:"" },
  { date:"2026-03-10", noPo:"PO-2026-03-1790", noSj:"03-851", driver:"NANANG/TEGUH", customer:"Kembang Merah SDA", rel12:4, rel50:0, tonase:48.0, rec12:4, rec50:0, notes:"" },
  { date:"2026-03-10", noPo:"PO-2026-03-1819", noSj:"03-852", driver:"NANANG/TEGUH", customer:"Hotel Gubeng", rel12:3, rel50:0, tonase:36.0, rec12:3, rec50:0, notes:"" },
  { date:"2026-03-10", noPo:"PO-2026-03-1856", noSj:"03-853", driver:"NANANG/TEGUH", customer:"Siatara Indian Restauran Kodam", rel12:2, rel50:3, tonase:174.0, rec12:2, rec50:3, notes:"" },
  { date:"2026-03-10", noPo:"PO-2026-03-1896", noSj:"03-854", driver:"NANANG/TEGUH", customer:"Pia Calista", rel12:10, rel50:0, tonase:120.0, rec12:0, rec50:0, notes:"" },
  { date:"2026-03-10", noPo:"PO-2026-03-1897", noSj:"03-855", driver:"NANANG/TEGUH", customer:"Pia Calista", rel12:5, rel50:0, tonase:60.0, rec12:5, rec50:0, notes:"1 Tbg Kembali Tanpa PO" },
  { date:"2026-03-10", noPo:"PO-2026-03-1930", noSj:"03-856", driver:"NANANG/TEGUH", customer:"RPHU Pegirian", rel12:2, rel50:0, tonase:24.0, rec12:2, rec50:0, notes:"" },
  { date:"2026-03-10", noPo:"PO-2026-03-1951", noSj:"03-858", driver:"ANTOK/HNEDRIK", customer:"MMU SPPG Sumber Waru Guluan", rel12:0, rel50:5, tonase:250.0, rec12:0, rec50:4, notes:"" },
  { date:"2026-03-10", noPo:"PO-2026-03-1953", noSj:"03-860", driver:"ANTOK/HNEDRIK", customer:"MMU SPPG Jungudan Bujur Tengah", rel12:0, rel50:4, tonase:200.0, rec12:0, rec50:0, notes:"" },
  { date:"2026-03-10", noPo:"PO-2026-03-1954", noSj:"03-861", driver:"ANTOK/HNEDRIK", customer:"MMU SPPG Humairah Blumbungan", rel12:10, rel50:6, tonase:420.0, rec12:7, rec50:4, notes:"" },
  { date:"2026-03-10", noPo:"PO-2026-03-1955", noSj:"03-862", driver:"ANTOK/HNEDRIK", customer:"MMU SPPG AL-Hasani Klampar", rel12:0, rel50:20, tonase:1000.0, rec12:0, rec50:6, notes:"" },
  { date:"2026-03-10", noPo:"PO-2026-03-1976", noSj:"03-863", driver:"ANTOK/HNEDRIK", customer:"SPPG Lembanah Pragaan Sumenep", rel12:2, rel50:3, tonase:174.0, rec12:2, rec50:6, notes:"" },
  { date:"2026-03-10", noPo:"PO-2026-03-1977", noSj:"03-864", driver:"ANTOK/HNEDRIK", customer:"SPPG Babatoh Platok Montok", rel12:11, rel50:0, tonase:132.0, rec12:13, rec50:0, notes:"" },
  { date:"2026-03-11", noPo:"PO-2026-03-1950", noSj:"03-857", driver:"ANTOK/HNEDRIK", customer:"MMU SPPG Koberung Majungan", rel12:8, rel50:6, tonase:396.0, rec12:8, rec50:6, notes:"1 Tbg 12 kg Kembali belum terscan" },
  { date:"2026-03-11", noPo:"PO-2026-03-1953", noSj:"03-860", driver:"ANTOK/HNEDRIK", customer:"MMU SPPG Jungudan Bujur Tengah", rel12:0, rel50:4, tonase:200.0, rec12:0, rec50:2, notes:"" },
  { date:"2026-03-11", noPo:"PO-2026-03-1956", noSj:"03-865", driver:"RUDI/WAHYU", customer:"RPHU Lakarsantri", rel12:0, rel50:1, tonase:50.0, rec12:0, rec50:1, notes:"" },
  { date:"2026-03-11", noPo:"PO-2026-03-1967", noSj:"03-866", driver:"RUDI/WAHYU", customer:"Amor Resto", rel12:0, rel50:3, tonase:150.0, rec12:0, rec50:3, notes:"" },
  { date:"2026-03-11", noPo:"PO-2026-03-2005", noSj:"03-867", driver:"RUDI/WAHYU", customer:"Fork Resto Tunjungan", rel12:8, rel50:0, tonase:96.0, rec12:9, rec50:0, notes:"" },
  { date:"2026-03-11", noPo:"PO-2026-03-2042", noSj:"03-868", driver:"RUDI/WAHYU", customer:"UD Sampurna Pabrik Roti", rel12:0, rel50:3, tonase:150.0, rec12:0, rec50:2, notes:"" },
  { date:"2026-03-11", noPo:"PO-2026-03-2053", noSj:"03-869", driver:"RUDI/WAHYU", customer:"HC Ellenoir", rel12:2, rel50:0, tonase:24.0, rec12:2, rec50:0, notes:"" },
  { date:"2026-03-11", noPo:"PO-2026-03-2060", noSj:"03-870", driver:"RUDI/WAHYU", customer:"Sin Cia Po", rel12:5, rel50:2, tonase:160.0, rec12:5, rec50:2, notes:"" },
  { date:"2026-03-11", noPo:"PO-2026-03-2150", noSj:"03-872", driver:"RUDI/WAHYU", customer:"SPPG Damarsih", rel12:15, rel50:0, tonase:180.0, rec12:22, rec50:0, notes:"" },
  { date:"2026-03-11", noPo:"PO-2026-03-2151", noSj:"03-871", driver:"RUDI/WAHYU", customer:"Akbar SIIP", rel12:20, rel50:0, tonase:240.0, rec12:25, rec50:0, notes:"1 Tbg kembali Tanpa PO" },
  { date:"2026-03-11", noPo:"PO-2026-03-2179", noSj:"", driver:"RUDI/WAHYU", customer:"Dapur RJ", rel12:5, rel50:0, tonase:60.0, rec12:5, rec50:0, notes:"" },
  { date:"2026-03-11", noPo:"PO-2026-03-2033", noSj:"03-003GB", driver:"RUDI/WAHYU", customer:"Wisata Rasa", rel12:15, rel50:0, tonase:180.0, rec12:15, rec50:0, notes:"" },
  { date:"2026-03-11", noPo:"PO-2026-03-2027", noSj:"03-873", driver:"NANANG/TEGUH", customer:"SPPG Budi Utomo", rel12:0, rel50:5, tonase:250.0, rec12:0, rec50:5, notes:"" },
  { date:"2026-03-11", noPo:"PO-2026-03-2029", noSj:"03-874", driver:"NANANG/TEGUH", customer:"SPPG Plaosan Maranata (GBS)", rel12:0, rel50:3, tonase:150.0, rec12:0, rec50:3, notes:"" },
  { date:"2026-03-11", noPo:"PO-2026-03-2032", noSj:"03-875", driver:"NANANG/TEGUH", customer:"SPPG Magetan (Jl. Bromo)", rel12:1, rel50:4, tonase:212.0, rec12:0, rec50:3, notes:"" },
  { date:"2026-03-11", noPo:"PO-2026-03-2035", noSj:"03-876", driver:"NANANG/TEGUH", customer:"SPPG Pelangi Nganjuk", rel12:0, rel50:3, tonase:150.0, rec12:0, rec50:3, notes:"" },
  { date:"2026-03-12", noPo:"PO-2026-03-922", noSj:"03-877", driver:"ANTOK/TEGUH", customer:"Buerger Bangor Dharmawangsa", rel12:1, rel50:0, tonase:12.0, rec12:0, rec50:0, notes:"" },
  { date:"2026-03-12", noPo:"PO-2026-03-1775", noSj:"03-878", driver:"ANTOK/TEGUH", customer:"Buerger Bangor Mulyosari", rel12:2, rel50:0, tonase:24.0, rec12:0, rec50:0, notes:"" },
  { date:"2026-03-12", noPo:"PO-2026-03-2199", noSj:"03-879", driver:"ANTOK/TEGUH", customer:"Dimsum Kobar Sda", rel12:12, rel50:0, tonase:144.0, rec12:13, rec50:0, notes:"" },
  { date:"2026-03-12", noPo:"PO-2026-03-2259", noSj:"03-880", driver:"ANTOK/TEGUH", customer:"Dapur RJ", rel12:5, rel50:0, tonase:60.0, rec12:12, rec50:0, notes:"" },
  { date:"2026-03-12", noPo:"PO-2026-03-2267", noSj:"03-881", driver:"ANTOK/TEGUH", customer:"Toko Kopi Padma", rel12:0, rel50:2, tonase:100.0, rec12:0, rec50:2, notes:"" },
  { date:"2026-03-12", noPo:"PO-2026-03-2272", noSj:"03-882", driver:"ANTOK/TEGUH", customer:"PT. Surya Pasific Jaya Sda", rel12:2, rel50:0, tonase:24.0, rec12:2, rec50:0, notes:"" },
  { date:"2026-03-12", noPo:"PO-2026-03-2381", noSj:"03-883", driver:"ANTOK/TEGUH", customer:"Koat Caffe Sda", rel12:4, rel50:0, tonase:48.0, rec12:4, rec50:0, notes:"" },
  { date:"2026-03-12", noPo:"PO-2026-03-732", noSj:"03-884", driver:"RUDI/WAHYU", customer:"Waroeng Bamboe", rel12:20, rel50:0, tonase:240.0, rec12:8, rec50:0, notes:"" },
  { date:"2026-03-12", noPo:"PO-2026-03-2133", noSj:"03-885", driver:"RUDI/WAHYU", customer:"Aqiqah SDA", rel12:10, rel50:0, tonase:120.0, rec12:15, rec50:0, notes:"" },
  { date:"2026-03-12", noPo:"PO-2026-03-2439", noSj:"03-889", driver:"RUDI/WAHYU", customer:"Aqiqah SDA", rel12:5, rel50:0, tonase:60.0, rec12:0, rec50:0, notes:"" },
  { date:"2026-03-12", noPo:"PO-2026-03-2304", noSj:"03-886", driver:"RUDI/WAHYU", customer:"RM Sumringah I", rel12:40, rel50:0, tonase:480.0, rec12:21, rec50:0, notes:"1 Tbg Kembali belum terscan" },
  { date:"2026-03-12", noPo:"PO-2026-03-2367", noSj:"03-887", driver:"RUDI/WAHYU", customer:"SPPG Darut Tauhid", rel12:3, rel50:3, tonase:186.0, rec12:2, rec50:1, notes:"" },
  { date:"2026-03-12", noPo:"PO-2026-03-2398", noSj:"03-888", driver:"RUDI/WAHYU", customer:"Amstirdam Coffee Roastery", rel12:3, rel50:0, tonase:36.0, rec12:3, rec50:0, notes:"" },
] as const;
async function main() {
  console.log("🌱 Starting SSG seed...\n");

  // ── 1. Admin user ──────────────────────────────────────────────────────────
  const hashed = await bcrypt.hash("admin123", 10);
  const admin  = await prisma.user.upsert({
    where:  { email: "admin@ssg.com" },
    update: {},
    create: { email: "admin@ssg.com", name: "Super Admin", hashedPassword: hashed, role: "SUPER_ADMIN", isActive: true },
  });
  console.log(`✅ User: ${admin.email}`);

  // ── 2. Branches ────────────────────────────────────────────────────────────
  const sby = await prisma.branch.upsert({
    where: { code: "SBY" }, update: {},
    create: { code: "SBY", name: "SSG Surabaya",   address: "Surabaya, Jawa Timur", phone: "" },
  });
  const yog = await prisma.branch.upsert({
    where: { code: "YOG" }, update: {},
    create: { code: "YOG", name: "SSG Yogyakarta", address: "Yogyakarta, DIY",       phone: "" },
  });
  console.log(`✅ Branches: ${sby.name}, ${yog.name}`);

  // ── 3. Supplier ────────────────────────────────────────────────────────────
  const supplier = await prisma.supplier.upsert({
    where: { code: "NIX" }, update: {},
    create: {
      code: "NIX", name: "PT. Arsygas Nix Indonesia",
      npwp: "01.234.567.8-901.000", address: "Jakarta, Indonesia",
      phone: "", email: "", isActive: true,
    },
  });
  console.log(`✅ Supplier: ${supplier.name}`);

  // ── 4. HMT Quotas — March 2026 ─────────────────────────────────────────────
  // SBY: 12kg=1900 | 50kg=723   |   YOG: 12kg=1760 | 50kg=545
  const hmtEntries = [
    { branch: sby, size: "KG12" as const, qty: 1900, price: 158_000 },
    { branch: sby, size: "KG50" as const, qty:  723, price: 550_000 },
    { branch: yog, size: "KG12" as const, qty: 1760, price: 158_000 },
    { branch: yog, size: "KG50" as const, qty:  545, price: 550_000 },
  ];
  for (const h of hmtEntries) {
    await prisma.supplierHmtQuota.upsert({
      where: {
        supplierId_branchId_cylinderSize_periodMonth_periodYear: {
          supplierId: supplier.id, branchId: h.branch.id,
          cylinderSize: h.size, periodMonth: 3, periodYear: 2026,
        },
      },
      update: {},
      create: {
        supplierId: supplier.id, branchId: h.branch.id,
        cylinderSize: h.size, periodMonth: 3, periodYear: 2026,
        quotaQty: h.qty, pricePerUnit: h.price, usedQty: 0,
      },
    });
  }
  console.log(`✅ HMT Quotas: 4 entries (SBY 12kg=1900,50kg=723 | YOG 12kg=1760,50kg=545)`);

  // ── 5. Customers ───────────────────────────────────────────────────────────
  const branchMap: Record<string, typeof sby> = { SBY: sby, YOG: yog };
  const seqMap: Record<string, number> = {};
  const savedCustomers: { id: string; name: string; branch: string; gasback: number; kg12: number; kg50: number }[] = [];
  let custCreated = 0;

  for (const c of CUSTOMER_DATA) {
    const branch  = branchMap[c.branch];
    const seqKey  = c.branch;
    seqMap[seqKey] = (seqMap[seqKey] ?? 0) + 1;
    const code    = makeCode(c.branch, c.name, seqMap[seqKey]);
    try {
      const cust = await prisma.customer.upsert({
        where:  { code },
        update: {},
        create: { branchId: branch.id, code, name: c.name, customerType: c.type, isActive: true, creditLimit: 0 },
      });
      savedCustomers.push({ id: cust.id, name: c.name, branch: c.branch, gasback: c.gasback, kg12: c.kg12, kg50: c.kg50 });
      custCreated++;
    } catch { /* skip duplicates */ }
  }
  console.log(`✅ Customers: ${custCreated} upserted`);

  // ── 6. Gasback Ledger entries ──────────────────────────────────────────────
  let gbCreated = 0;
  for (const c of savedCustomers) {
    if (c.gasback <= 0) continue;
    try {
      await prisma.gasbackLedger.create({
        data: {
          customerId:    c.id,
          transactionAt: new Date("2026-03-31T23:59:00.000Z"),
          pointsDelta:   c.gasback,
          balanceAfter:  c.gasback,
          description:   "Saldo awal — Maret 2026",
          refType:       "MANUAL",
        },
      });
      gbCreated++;
    } catch { /* skip */ }
  }
  console.log(`✅ Gasback ledger: ${gbCreated} entries with non-zero balance`);

  // ── 7. Cylinder Holdings ──────────────────────────────────────────────────
  const DEPOSIT_12 = 150_000;
  const DEPOSIT_50 = 600_000;
  let holdCreated = 0;
  for (const c of savedCustomers) {
    if (c.kg12 > 0) {
      try {
        await prisma.customerCylinderHolding.upsert({
          where:  { customerId_cylinderSize: { customerId: c.id, cylinderSize: "KG12" } },
          update: { heldQty: c.kg12 },
          create: { customerId: c.id, cylinderSize: "KG12", heldQty: c.kg12, depositPerUnit: DEPOSIT_12, lastUpdated: new Date("2026-03-31") },
        });
        holdCreated++;
      } catch { /* skip */ }
    }
    if (c.kg50 > 0) {
      try {
        await prisma.customerCylinderHolding.upsert({
          where:  { customerId_cylinderSize: { customerId: c.id, cylinderSize: "KG50" } },
          update: { heldQty: c.kg50 },
          create: { customerId: c.id, cylinderSize: "KG50", heldQty: c.kg50, depositPerUnit: DEPOSIT_50, lastUpdated: new Date("2026-03-31") },
        });
        holdCreated++;
      } catch { /* skip */ }
    }
  }
  console.log(`✅ Cylinder holdings: ${holdCreated} records`);

  // ── 8. Delivery Orders ────────────────────────────────────────────────────
  // Build normalised lookup: norm(name) → customer id
  const custLookup = new Map<string, string>();
  for (const c of savedCustomers) {
    custLookup.set(norm(c.name), c.id);
  }
  // Fuzzy fallback: if exact norm fails, try includes
  function findCustomer(name: string): string | undefined {
    const n = norm(name);
    if (custLookup.has(n)) return custLookup.get(n);
    for (const [k, v] of custLookup) {
      if (k.includes(n) || n.includes(k)) return v;
    }
    return undefined;
  }

  let doCreated = 0, doSkipped = 0;
  for (const d of DELIVERY_ORDERS) {
    const custId = findCustomer(d.customer);
    if (!custId) { doSkipped++; continue; }

    const items: { cylinderSize: "KG12"|"KG50"; qtyOut: number; qtyIn: number; tonaseKg: number }[] = [];
    if (d.rel12 > 0 || d.rec12 > 0) items.push({ cylinderSize: "KG12", qtyOut: d.rel12, qtyIn: d.rec12, tonaseKg: d.rel12 * 12 });
    if (d.rel50 > 0 || d.rec50 > 0) items.push({ cylinderSize: "KG50", qtyOut: d.rel50, qtyIn: d.rec50, tonaseKg: d.rel50 * 50 });
    if (!items.length) { doSkipped++; continue; }

    try {
      await prisma.deliveryOrder.create({
        data: {
          branchId:   sby.id,
          customerId: custId,
          supplierId: supplier.id,
          poNumber:   d.noPo,
          sjNumber:   d.noSj || null,
          deliveryAt: new Date(d.date + "T07:00:00.000Z"),
          driverName: d.driver || null,
          status:     "COMPLETED",
          notes:      d.notes || null,
          items:      { create: items },
        },
      });
      doCreated++;
    } catch { doSkipped++; }
  }
  console.log(`✅ Delivery orders: ${doCreated} created, ${doSkipped} skipped`);

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log(`
🎉 Seed complete!
   Login:     admin@ssg.com / admin123
   Customers: ${custCreated} (217 SBY + 167 YOG)
   Gasback:   ${gbCreated} ledger entries
   Holdings:  ${holdCreated} cylinder records
   HMT Quota: 4 entries (Mar 2026)
   Deliveries:${doCreated} orders
  `);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());