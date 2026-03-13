import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashed = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "admin@ssg.com" },
    update: {},
    create: {
      email: "admin@ssg.com",
      name: "Super Admin",
      hashedPassword: hashed,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  console.log("✅ Seed complete: admin@ssg.com / admin123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());