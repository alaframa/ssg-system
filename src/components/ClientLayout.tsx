"use client";

// src/components/ClientLayout.tsx

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CustomersPage from "./CustomersPage";
import CustomerDetailPage from "./CustomerDetailPage";
import SuppliersPage from "./SuppliersPage";
import WarehousePage from "./WarehousePage";
import PurchaseOrdersPage from "./PurchaseOrdersPage";
import DeliveryOrdersPage from "./DeliveryOrdersPage";
import { ToastContainer, useToast } from "./Toast";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: "📊" },
  { key: "customers", label: "Customers", icon: "👥" },
  { key: "suppliers", label: "Suppliers", icon: "🏬" },
  { key: "po", label: "Purchase Orders", icon: "📝" },
  { key: "delivery", label: "Delivery Orders", icon: "🚚" },
  { key: "warehouse", label: "Warehouse", icon: "📦" },
  { key: "gasback", label: "Gasback", icon: "♻️" },
  { key: "reports", label: "Reports", icon: "📈" },
];

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "#2563EB",
  BRANCH_MANAGER: "#0369A1",
  WAREHOUSE_STAFF: "#15803D",
  SALES_STAFF: "#7C3AED",
  FINANCE: "#F97316",
  READONLY: "#64748B",
};

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeBranchId, setActiveBranchId] = useState<string>("");
  const [branches, setBranches] = useState<
    { id: string; code: string; name: string }[]
  >([]);

  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toasts, show, dismiss } = useToast();

  const currentPage = searchParams.get("page") ?? "dashboard";
  const customerDetailId = searchParams.get("id") ?? null;
  const notifyKey = searchParams.get("notify") ?? null;

  // ── Load branches once ────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/branches")
      .then((r) => r.json())
      .then((data: { id: string; code: string; name: string }[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setBranches(data);
          setActiveBranchId(data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // ── Notification toast from URL param ─────────────────────────────────────
  useEffect(() => {
    if (!notifyKey) return;
    const n = NOTIFY_MESSAGES[notifyKey];
    if (n) show(n.message, n.type);
    const clean = new URLSearchParams(searchParams.toString());
    clean.delete("notify");
    const qs = clean.toString();
    router.replace(qs ? `/?${qs}` : "/");
  }, [notifyKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === "unauthenticated" && pathname !== "/login") {
      router.replace("/login");
    }
  }, [status, pathname, router]);

  function navigate(page: string, id?: string) {
    const p = new URLSearchParams();
    p.set("page", page);
    if (id) p.set("id", id);
    router.push(`/?${p.toString()}`);
  }

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

  if (!session) return null;

  const userRole = (session.user as any).role as string;
  const roleColor = ROLE_COLORS[userRole] ?? "#64748B";
  const initials = session.user.name?.slice(0, 2).toUpperCase() ?? "?";

  // ── Page renderer ─────────────────────────────────────────────────────────
  const renderPage = () => {
    switch (currentPage) {
      case "customers":
        if (customerDetailId) {
          return (
            <CustomerDetailPage
              customerId={customerDetailId}
              onBack={() => navigate("customers")}
            />
          );
        }
        return <CustomersPage onNavigate={(id) => navigate("customers", id)} />;

      case "suppliers":
        return <SuppliersPage />;

      case "warehouse":
        return <WarehousePage activeBranchId={activeBranchId} />;

      case "po":
        return <PurchaseOrdersPage activeBranchId={activeBranchId} />;

      case "delivery":
        return <DeliveryOrdersPage activeBranchId={activeBranchId} />;

      default:
        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#64748B",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Module Coming Soon
          </div>
        );
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="layout-shell">
        {/* ── Sidebar ── */}
        <aside className={`layout-sidebar ${sidebarOpen ? "open" : "closed"}`}>
          {/* Brand / toggle */}
          <div
            className="sidebar-brand"
            onClick={() => setSidebarOpen((o) => !o)}
          >
            <div className="sidebar-logo">S</div>
            {sidebarOpen && (
              <div className="sidebar-brand-text">
                <span className="sidebar-brand-title">SSG Admin</span>
                <span className="sidebar-brand-sub">Gas Distribution</span>
              </div>
            )}
          </div>

          {/* Nav items */}
          <nav className="sidebar-nav">
            {NAV_ITEMS.map(({ key, label, icon }) => (
              <button
                key={key}
                className={`nav-btn ${currentPage === key ? "active" : ""}`}
                onClick={() => navigate(key)}
                title={!sidebarOpen ? label : undefined}
              >
                <span className="nav-icon">{icon}</span>
                {sidebarOpen && <span>{label}</span>}
              </button>
            ))}
          </nav>

          {/* User + sign out */}
          <div className="sidebar-footer">
            {sidebarOpen && (
              <>
                <div className="sidebar-user">
                  <div className="sidebar-avatar">{initials}</div>
                  <div style={{ overflow: "hidden" }}>
                    <div className="sidebar-user-name">{session.user.name}</div>
                    <div
                      className="sidebar-user-role"
                      style={{ color: roleColor }}
                    >
                      {userRole.replace(/_/g, " ")}
                    </div>
                  </div>
                </div>
                <button
                  className="sidebar-signout"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  ⏻ Sign Out
                </button>
              </>
            )}
          </div>
        </aside>

        {/* ── Main area ── */}
        <div className="layout-main">
          {/* Topbar */}
          <header className="layout-topbar">
            <div className="topbar-breadcrumb">
              <span>SSG</span>
              <span>›</span>
              <span className="topbar-breadcrumb-cur">
                {currentPage.toUpperCase()}
              </span>
              {customerDetailId && (
                <>
                  <span>›</span>
                  <span
                    style={{
                      color: "#111827",
                      fontWeight: 700,
                      textTransform: "none",
                      letterSpacing: 0,
                    }}
                  >
                    Detail
                  </span>
                </>
              )}
            </div>

            {/* Branch switcher */}
            <div className="topbar-branch">
              <span className="topbar-branch-label">Branch:</span>
              <select
                value={activeBranchId}
                onChange={(e) => setActiveBranchId(e.target.value)}
                className="topbar-branch-select"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </header>

          {/* Content */}
          <main className="layout-content">{renderPage()}</main>
        </div>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  );
}
