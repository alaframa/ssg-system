"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CustomersPage from "./CustomersPage";
import CustomerDetailPage from "./CustomerDetailPage";
import SuppliersPage from "./SuppliersPage";
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

// Notification messages keyed by the ?notify= param value
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

  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toasts, show, dismiss } = useToast();

  // ── Derive view from URL ────────────────────────────────────────────────────
  const currentPage = searchParams.get("page") ?? "dashboard";
  const customerDetailId = searchParams.get("id") ?? null;
  const notifyKey = searchParams.get("notify") ?? null;

  // ── Handle ?notify= param: show toast then strip it from URL ───────────────
  useEffect(() => {
    if (!notifyKey) return;
    const n = NOTIFY_MESSAGES[notifyKey];
    if (n) show(n.message, n.type);

    // Remove ?notify= from the URL without adding a history entry
    const clean = new URLSearchParams(searchParams.toString());
    clean.delete("notify");
    const qs = clean.toString();
    router.replace(qs ? `/?${qs}` : "/");
  }, [notifyKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (status === "unauthenticated" && pathname !== "/login") {
      router.replace("/login");
    }
  }, [status, pathname, router]);

  // ── Navigate: push real history entries ────────────────────────────────────
  function navigate(page: string, id?: string) {
    const p = new URLSearchParams();
    p.set("page", page);
    if (id) p.set("id", id);
    router.push(`/?${p.toString()}`);
  }

  // ── Early returns ───────────────────────────────────────────────────────────
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

  // ── Page renderer ───────────────────────────────────────────────────────────
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

  return (
    <>
      <div className="layout-shell">
        {/* ── Sidebar ── */}
        <aside className={`layout-sidebar ${sidebarOpen ? "open" : "closed"}`}>
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

        {/* ── Main ── */}
        <div className="layout-main">
          <header className="layout-topbar">
            <div className="topbar-breadcrumb">
              <span>SSG</span>
              <span>›</span>
              <span className="topbar-breadcrumb-cur">{currentPage}</span>
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
            <div className="topbar-branch">
              <span className="topbar-branch-label">Branch:</span>
              <select defaultValue="SBY">
                <option value="SBY">Surabaya</option>
                <option value="YOG">Yogyakarta</option>
              </select>
            </div>
          </header>

          <main className="layout-content">{renderPage()}</main>
        </div>
      </div>

      {/* Toast notifications — rendered outside layout flow */}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  );
}
