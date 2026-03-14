// prisma/reset.ts — wipe all data, keep schema
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("🗑  Wiping all data...");
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      gasback_claim, gasback_ledger, customer_cylinder_holding,
      monthly_recon, cylinder_writeoff, empty_return,
      inbound_receiving, warehouse_stock,
      delivery_order, supplier_po,
      supplier_hmt_quota, customer, supplier,
      session, account, "user", branch
    RESTART IDENTITY CASCADE;
  `);
  console.log("✅ All tables wiped.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
