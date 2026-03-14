"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ToastContainer, useToast } from "./Toast";

const NOTIFY_MESSAGES: Record<
  string,
  { message: string; type: "info" | "success" | "warning" }
> = {
  already_logged_in: { message: "You're already signed in.", type: "info" },
};

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toasts, show, dismiss } = useToast();

  const notifyKey = searchParams.get("notify") ?? null;

  useEffect(() => {
    if (status === "unauthenticated" && pathname !== "/login") {
      router.replace("/login");
    }
  }, [status, pathname, router]);

  useEffect(() => {
    if (!notifyKey) return;
    const n = NOTIFY_MESSAGES[notifyKey];
    if (n) show(n.message, n.type);
    const clean = new URLSearchParams(searchParams.toString());
    clean.delete("notify");
    const qs = clean.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [notifyKey]); // eslint-disable-line

  if (pathname === "/login") return <>{children}</>;

  if (status === "loading")
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#F3F4F6",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "#1E293B",
            color: "#fff",
            fontWeight: 900,
            fontSize: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          S
        </div>
      </div>
    );

  if (status === "unauthenticated") return null;

  return (
    <>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  );
}
