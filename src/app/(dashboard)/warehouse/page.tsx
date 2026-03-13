// src/app/(dashboard)/warehouse/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import WarehousePage from "@/components/WarehousePage";

export const metadata = { title: "Warehouse — SSG" };

export default async function Page() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  // Get first branch as default (SBY)
  const branch = await prisma.branch.findFirst({ orderBy: { code: "asc" } });
  if (!branch) return <div>No branches found. Run seed first.</div>;

  return <WarehousePage activeBranchId={branch.id} />;
}
