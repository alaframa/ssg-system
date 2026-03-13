import prisma from "./lib/prisma";
import bcrypt from "bcrypt";

async function main() {
  const hashed = await bcrypt.hash("admin123", 10);
  await prisma.user.create({
    data: {
      email: "admin@ssg.com",
      name: "Super Admin",
      hashedPassword: hashed,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  const hashedBranchMgr = await bcrypt.hash("branch123", 10);
  await prisma.user.create({
    data: {
      email: "manager.sby@ssg.com",
      name: "Branch Manager SBY",
      hashedPassword: hashedBranchMgr,
      role: "BRANCH_MANAGER",
      branchId: "SBY_ID", // replace with real branch ID from seed
      isActive: true,
    },
  });
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());