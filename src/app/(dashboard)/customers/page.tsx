"use client";
import CustomersPage from "@/components/CustomersPage";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  return (
    <CustomersPage
      onNavigate={(id) => router.push(`/customers/${id}`)}
      onAddNew={() => router.push("/customers/add")}
    />
  );
}
