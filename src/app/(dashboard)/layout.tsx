"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useBranch } from "@/lib/branch-context";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: "📊", href: "/" },
  { key: "customers", label: "Customers", icon: "👥", href: "/customers" },
  { key: "suppliers", label: "Suppliers", icon: "🏬", href: "/suppliers" },
  {
    key: "customer-po",
    label: "Customer Orders",
    icon: "📋",
    href: "/customer-orders",
  },
  { key: "po", label: "Supplier PO", icon: "📝", href: "/supplier-po" },
  { key: "delivery", label: "Delivery Orders", icon: "🚚", href: "/delivery" },
  { key: "warehouse", label: "Warehouse", icon: "📦", href: "/warehouse" },
  { key: "gasback", label: "Gasback", icon: "♻️", href: "/gasback" },
  { key: "reports", label: "Reports", icon: "📈", href: "/reports" },
];

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "#2563EB",
  BRANCH_MANAGER: "#0369A1",
  WAREHOUSE_STAFF: "#15803D",
  SALES_STAFF: "#7C3AED",
  FINANCE: "#F97316",
  READONLY: "#64748B",
};

// Derive breadcrumb label + parent from pathname
function useBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  // e.g. ["customers", "add"] or ["customers", "clxxx123"] or ["customers"]
  const section = segments[0] ?? "dashboard";
  const sub = segments[1];
  const navItem = NAV_ITEMS.find(
    (n) => n.href === `/${section}` || (section === "" && n.href === "/"),
  );
  const sectionLabel =
    navItem?.label ?? section.charAt(0).toUpperCase() + section.slice(1);

  const crumbs: { label: string; href?: string }[] = [
    { label: "SSG" },
    sub
      ? { label: sectionLabel, href: `/${section}` }
      : { label: sectionLabel },
  ];
  if (sub === "add")
    crumbs.push({ label: `Add ${sectionLabel.replace(/s$/, "")}` });
  else if (sub === "edit") crumbs.push({ label: `Edit` });
  else if (sub) crumbs.push({ label: "Detail" });

  return { crumbs, section };
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { branches, activeBranchId, setActiveBranchId } = useBranch();
  const { crumbs, section } = useBreadcrumbs(pathname);

  const userRole = ((session?.user as any)?.role as string) ?? "";
  const roleColor = ROLE_COLORS[userRole] ?? "#64748B";
  const initials = session?.user?.name?.slice(0, 2).toUpperCase() ?? "?";

  return (
    <div className="layout-shell">
      {/* Sidebar */}
      <aside className="layout-sidebar open">
        <div className="sidebar-brand" onClick={() => router.push("/")}>
          <div className="sidebar-logo">S</div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-title">SSG Admin</span>
            <span className="sidebar-brand-sub">Gas Distribution</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ key, label, icon, href }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <button
                key={key}
                className={`nav-btn ${active ? "active" : ""}`}
                onClick={() => router.push(href)}
              >
                <span className="nav-icon">{icon}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div style={{ overflow: "hidden" }}>
              <div className="sidebar-user-name">{session?.user?.name}</div>
              <div className="sidebar-user-role" style={{ color: roleColor }}>
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
        </div>
      </aside>

      {/* Main */}
      <div className="layout-main">
        <header className="layout-topbar">
          {/* Breadcrumb */}
          <div className="topbar-breadcrumb">
            {crumbs.map((c, i) => (
              <span
                key={i}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                {i > 0 && <span>›</span>}
                {c.href ? (
                  <button
                    onClick={() => router.push(c.href!)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--text-low)",
                      padding: 0,
                    }}
                    onMouseEnter={(e) =>
                      ((e.target as HTMLElement).style.color = "var(--accent)")
                    }
                    onMouseLeave={(e) =>
                      ((e.target as HTMLElement).style.color =
                        "var(--text-low)")
                    }
                  >
                    {c.label}
                  </button>
                ) : (
                  <span
                    className={
                      i === crumbs.length - 1 ? "topbar-breadcrumb-cur" : ""
                    }
                  >
                    {c.label}
                  </span>
                )}
              </span>
            ))}
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

        <main className="layout-content">{children}</main>
      </div>
    </div>
  );
}
