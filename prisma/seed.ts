// prisma/seed.ts
// Seeds: 1 admin user, 2 branches, 384 real customers from March 2026 data
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma  = new PrismaClient({ adapter } as any);

// ─── Customer data extracted from:
//   03__Gasback_SSG___Konsumen_Maret_2026.xlsx
//   03__LAPORAN_STOCK_TABUNG_SSG_MARET_2026.xlsx
// ─────────────────────────────────────────────
const CUSTOMER_DATA: {
  name: string;
  branch: "SBY" | "YOG";
  gasback: number;
  is_active: boolean;
  type: "RETAIL" | "AGEN" | "INDUSTRI";
}[] = [
  // ── SURABAYA ─────────────────────────────────────────────────────────────
  { name: "1966 Coffee House", branch: "SBY", gasback: 10.12, is_active: true, type: "RETAIL" },
  { name: "Agis Restorant", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Akabar SIIP", branch: "SBY", gasback: 351.83, is_active: true, type: "RETAIL" },
  { name: "Al-Himah Gayungsari", branch: "SBY", gasback: 16.07, is_active: true, type: "RETAIL" },
  { name: "Amor Restauran & Coffee", branch: "SBY", gasback: 4.15, is_active: true, type: "RETAIL" },
  { name: "Amdtirdam Caffee Roastery", branch: "SBY", gasback: 10.93, is_active: true, type: "RETAIL" },
  { name: "Apotik Indah Farma", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "Asap Asap Sidoarjo", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Asshofa", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Azzahra Catering", branch: "SBY", gasback: 33.42, is_active: true, type: "RETAIL" },
  { name: "Bajawa Flores NTT Sby", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Bakso Cak Pitung Pandaan", branch: "SBY", gasback: 7.8, is_active: true, type: "RETAIL" },
  { name: "Bakso Mamayo Maspion SBY", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Bakso Mamayo Ponti Sda", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Baradjawa Gayungsari", branch: "SBY", gasback: 3.01, is_active: true, type: "RETAIL" },
  { name: "Bebek Goreng H. Slamet", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Bebek Madura Candi Sda", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Bebek Semangat", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Burger Bangor Dharmawangsa", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Burger Bangor Geluran", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Burger Bangor Gwalk", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Burger Bangor Karangpilang", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Burger Bangor Krian", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Burger Bangor Mulyosari", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Burger Bangor Perak", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Burger Bangor Tenggilis", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Caffe Siklus", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Centra Kitchen Padma", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Confera Social Eatery", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Crunchaus Gwalk", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "CV. Ooofy Nusantara Adidaya", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "Dapur Bakso Mamayo & Kebab Baba Rafi", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Dapur RJ", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Dewa Seafood Tuban", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Dimsum Kobar", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Dimsum Kobar Sda", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Ekata Resto", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Flamboyan Bakery Medokan", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Flamboyan Laundry Gunung Anyar", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "Flamboyan Laundry Kedung Sroko", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "Flamboyan Laundry Bakery Medokan", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "Flamboyan Laondry Jojoran", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "Fork Resto Tunjungan", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Global Teknik", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "HC ACS", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "HC Ellenoir", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Hotel Bekizaar", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "Hotel Gubeng", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "Hotel Neo", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "Hotel SRV Surabaya River View", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "Hotel Vrana Culture", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "Hot Ways Pondok Jati Sda", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Huangdi Resto", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Kembang Merah", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Kembang Merah SDA", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Kedai Mal Liem", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Koat Coffee", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Koat café Sda", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Koat Caffe Sda", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Kopi Padma Jemusari", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Kwetiau Akang", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "MB Sedap Malam", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Midnight Baker Imam Bonjol", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "MMU SPPG Glagah Panglegur", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "MMU SPPG Katpang Timur", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "MMU SPPG Koberung Majungan", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "MMU SPPG Kramat Panglegur", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "MMU SPPG Lebak Sokobanah", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "MMU SPPG Lembung Sokobanah", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "Pia Calista", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Pocan Bu Erna", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "PT. Bebekku Jalan-Jalan ke Surabaya", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "PT. Fihan Agropangan Indonesia", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "PT. Insan Citraprima Sejahtera", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "PT. Panggung Electric Citrabuana", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "PT. Surya Pasific Jaya Sda", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "Rahang Tuna", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Restoran Padang Sederhana Sby", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Restauran Sederhana Padang Sby", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "RM Sumringah 1", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "RM Sumringah I", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "RPHU Lakarsantri", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "RPHU Pegirian", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "RS MMC Sby", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "RSIA Merr Sby", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "RSUD dr. R. Koesma Kab.Tuban/ Intalasi Gizi", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "RSUD dr. R. Koesma Kab.Tuban/ Laundray", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "Samudra Powder Coating", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "Sanlong Steamboat", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Seidnoesia Pasuruan", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Sin Cia Po", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Sitara Indian Restauran Kodam", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Sitara Indian Restauran Unesa", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Sitara Indian Restaurant", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Soes Merdeka Sda", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Spiffy Laundry", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "SPPG A.T Kusuma Dewi", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "SPPG Al-Bukhori Lembanah Pragaan Sumenep", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "SPPG Banjarbendo", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "SPPG Banyubunih 02", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "SPPG Banyubunih 03", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "SPPG Budi Utomo", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "SPPG Bulak Banteng", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "SPPG Damarsih", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "SPPG Kedungpring, Lamongan", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "SPPG Kedungturi", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "SPPG Maranata Magetan", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "SPPG Mlajah", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "SPPG Pagesangan", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "SPPG Pakisaji Malang", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "SPPG Ponpes Al Ahyar Bangkalan", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "SPPG SPPG Budi Utomo", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "SPPG Sukorame Lamongan", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "SPPG Tamberu Barat", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "SPPG Tosari Pasuruan", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "Sukardi Peternak Ayam", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "Sutrisno Peternak Ayam", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "Teman Setia Claypot", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Teras Makan HARARU", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Toko Kopi Padma", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "UD Sampurna Pabrik Roti", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "Waroeng Bamboe", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Waroeng Bamboe Batu", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Wisata Rasa", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Wisata Rasa Rungkut Sby", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Yayasan IBNU BACHIR", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "Yayasan Khayzan Arfadhhio G", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "Yayasan Khayzan Arfadhio G.", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "Aqiqah SDA", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Aqiqah Sda", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Bakso Cak Pitung", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "DS SPPG Ningrat Kemayoran", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "DG SPPG Samaran, Sampang", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "GEN SPPG Banyubunih 03", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "MMU SPPG Jungudan Bujur Tengah", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "MMU SPPG Gunung Tangis Rek Kerek", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "OOF SPPG Gunung Sekar", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "MMU SPPG Prajian Laok Camplong 2", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "DG GEN SPPG Jrengik", branch: "SBY", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "Wedang Joglo", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Wisnu Dewa", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Amor Resto", branch: "SBY", gasback: 4.15, is_active: true, type: "RETAIL" },
  { name: "Aqiqah SDA (2)", branch: "SBY", gasback: 0.0, is_active: true, type: "RETAIL" },

  // ── YOGYAKARTA ────────────────────────────────────────────────────────────
  { name: "Al-IMDAD", branch: "YOG", gasback: 47.92, is_active: true, type: "RETAIL" },
  { name: "Antologi Koperasi Ken8", branch: "YOG", gasback: 3.02, is_active: true, type: "RETAIL" },
  { name: "Arkadewi Resto XT Square", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Ayam Goreng Ninit 1983 Jakal", branch: "YOG", gasback: 9.16, is_active: true, type: "RETAIL" },
  { name: "Ayam Goreng Ninit 1983 Nogotirto", branch: "YOG", gasback: 0.12, is_active: true, type: "RETAIL" },
  { name: "Ayam Goreng Ninit Lempuyangan", branch: "YOG", gasback: 0.17, is_active: true, type: "RETAIL" },
  { name: "Ayam Ninit 1983 Palagan", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Ayam Panggang Mbah Mo", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Bakul Sekul", branch: "YOG", gasback: 2.66, is_active: true, type: "RETAIL" },
  { name: "Baleroso", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Baleroso Godean 3", branch: "YOG", gasback: 241.0, is_active: true, type: "RETAIL" },
  { name: "Baleroso Jakal", branch: "YOG", gasback: 316.8, is_active: true, type: "RETAIL" },
  { name: "Baleroso Prambanan", branch: "YOG", gasback: 178.67, is_active: true, type: "RETAIL" },
  { name: "Bebek Carok", branch: "YOG", gasback: 0.4, is_active: true, type: "RETAIL" },
  { name: "Bebex Cuex", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Bebek Pak Man Kebumen", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Boga Sari", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Bu Ageng Catering", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Bumbu Desa Jogja", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Burger 26", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Burjo Mas Yono", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Cafe Lintas", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Cahaya Boga Catering", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Catering Pujasera Condong Catur", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Dapur Bu Wiwik", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Dapur Galuh", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Es Pisang Ijo", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Fafa Catering", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Gado-Gado Boplo Jogja", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Gudeg Bu Lies", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Gudeg Mercon", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Gudeg Yu Djum", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Hotel Anugerah Jogja", branch: "YOG", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "Hotel Grand Zuri", branch: "YOG", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "Hotel Ibis Malioboro", branch: "YOG", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "Hotel New Saphir", branch: "YOG", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "Hotel Tentrem", branch: "YOG", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "Istana Pecel", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Java Mocha Cafe", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Jogja Fried Chicken", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Kedai Soto Pak Soleh", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Kopi Progo", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Lek Mul Catering", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Madam Restaurant", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Makan Yuk Resto", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Malioboro Coffee", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Medhayohan Catering", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Mie Ayam Pak Dhe", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Nasi Goreng Magelangan", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Noname Catering Jogja", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Pakde Resto", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Pawon Catering", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Pesta Perak Catering", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Pizza Hut Jogja", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "PT. Aerowisata", branch: "YOG", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "PT. Bogasari Flour Mills", branch: "YOG", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "PT. Garuda Catering", branch: "YOG", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "RM Ayam Bakar Lombok Ijo", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "RM Bale Raos", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "RM Beringharjo", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "RM Bu Ageng", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "RM Joglo Moro", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "RM Pring Sewu", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "RS Panti Rapih", branch: "YOG", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "RSUD Wonosari", branch: "YOG", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "Sate Klatak Pak Pong", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Soto Bathok Mbah Katro", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Soto Lamongan Cak Har", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "SPPG Bantul 1", branch: "YOG", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "SPPG Godean", branch: "YOG", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "SPPG Kotagede", branch: "YOG", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "SPPG Plaosan Maranata (GBS)", branch: "YOG", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "SPPG Sleman 2", branch: "YOG", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "Tahu Gimbal Pak Edy", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Tongseng Pak Min", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Warung Angkringan", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Warung Bu Rum", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "WARUNG RABURAI JOGJA", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Warung Watoe Gadjah", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Wijaya Boga Catering", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
  { name: "Yayasan Sahabat Anak Nusa", branch: "YOG", gasback: 0.0, is_active: true, type: "INDUSTRI" },
  { name: "Yomok Iki", branch: "YOG", gasback: 0.0, is_active: true, type: "RETAIL" },
];

// ─── Code generator ──────────────────────────────────────────────────────────
function makeCode(branch: string, name: string, index: number): string {
  const prefix = branch === "SBY" ? "SBY" : "YOG";
  const slug = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6)
    .padEnd(3, "X");
  const seq = String(index).padStart(4, "0");
  return `${prefix}-${slug}-${seq}`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱 Starting SSG seed...\n");

  // 1. Admin user
  const hashed = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where:  { email: "admin@ssg.com" },
    update: {},
    create: {
      email:          "admin@ssg.com",
      name:           "Super Admin",
      hashedPassword: hashed,
      role:           "SUPER_ADMIN",
      isActive:       true,
    },
  });
  console.log(`✅ User:   ${admin.email}`);

  // 2. Branches
  const sby = await prisma.branch.upsert({
    where:  { code: "SBY" },
    update: {},
    create: {
      code:    "SBY",
      name:    "SSG Surabaya",
      address: "Surabaya, Jawa Timur",
      phone:   "",
    },
  });

  const yog = await prisma.branch.upsert({
    where:  { code: "YOG" },
    update: {},
    create: {
      code:    "YOG",
      name:    "SSG Yogyakarta",
      address: "Yogyakarta, DIY",
      phone:   "",
    },
  });
  console.log(`✅ Branch: ${sby.name} (${sby.id})`);
  console.log(`✅ Branch: ${yog.name} (${yog.id})\n`);

  // 3. Customers
  const branchMap: Record<string, string> = { SBY: sby.id, YOG: yog.id };
  const sbyIdx: Record<string, number> = {};
  const yogIdx: Record<string, number> = {};
  let created = 0, skipped = 0;

  for (const c of CUSTOMER_DATA) {
    const branchId = branchMap[c.branch];
    const counter  = c.branch === "SBY" ? sbyIdx : yogIdx;
    const slug     = c.name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    counter[slug]  = (counter[slug] ?? 0) + 1;
    const code     = makeCode(c.branch, c.name, counter[slug]);

    try {
      await prisma.customer.upsert({
        where:  { code },
        update: {},
        create: {
          branchId:     branchId,
          code,
          name:         c.name,
          customerType: c.type,
          isActive:     c.is_active,
          creditLimit:  0,
        },
      });
      created++;
    } catch {
      skipped++;
    }
  }

  console.log(`✅ Customers seeded: ${created} created, ${skipped} skipped`);
  console.log(`\n🎉 Seed complete!`);
  console.log(`   Login: admin@ssg.com / admin123`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());