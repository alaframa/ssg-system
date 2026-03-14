"use client";
import WarehousePage from "@/components/WarehousePage";
import { useBranch } from "@/lib/branch-context";

export default function Page() {
  const { activeBranchId } = useBranch();
  if (!activeBranchId) return null;
  return <WarehousePage activeBranchId={activeBranchId} />;
}
