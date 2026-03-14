"use client";
import { useParams, useRouter } from "next/navigation";
import CustomerDetailPage from "@/components/CustomerDetailPage";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  return (
    <CustomerDetailPage
      customerId={id}
      onBack={() => router.push("/customers")}
    />
  );
}
