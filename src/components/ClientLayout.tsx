"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

type PageKey =
  | "dashboard"
  | "customers"
  | "suppliers"
  | "po"
  | "delivery"
  | "warehouse"
  | "gasback"
  | "reports";

const NAV_ITEMS: { key: PageKey; label: string; icon: string }[] = [
  { key: "dashboard", label: "Dashboard", icon: "⬡" },
  { key: "customers", label: "Customers", icon: "◈" },
  { key: "suppliers", label: "Suppliers", icon: "◉" },
  { key: "po", label: "Purchase Orders", icon: "◧" },
  { key: "delivery", label: "Delivery Orders", icon: "▷" },
  { key: "warehouse", label: "Warehouse", icon: "▣" },
  { key: "gasback", label: "Gasback", icon: "◎" },
  { key: "reports", label: "Reports", icon: "▤" },
];

const ALLOWED_ROLES: Record<string, string[]> = {
  dashboard: [
    "SUPER_ADMIN",
    "BRANCH_MANAGER",
    "WAREHOUSE_STAFF",
    "SALES_STAFF",
    "READONLY",
  ],
  customers: ["SUPER_ADMIN", "BRANCH_MANAGER", "SALES_STAFF"],
  suppliers: ["SUPER_ADMIN", "BRANCH_MANAGER"],
  po: ["SUPER_ADMIN", "BRANCH_MANAGER", "SALES_STAFF"],
  delivery: ["SUPER_ADMIN", "BRANCH_MANAGER", "WAREHOUSE_STAFF"],
  warehouse: ["SUPER_ADMIN", "WAREHOUSE_STAFF"],
  gasback: ["SUPER_ADMIN", "FINANCE"],
  reports: ["SUPER_ADMIN", "FINANCE"],
};

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedBranch, setSelectedBranch] = useState("SBY");
  const [currentPage, setCurrentPage] = useState<PageKey>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated" && pathname !== "/login") {
      router.replace("/login");
    }
  }, [status, pathname, router]);

  if (pathname === "/login") return <>{children}</>;

  if (status === "loading") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#1a1f2e",
          color: "#e2b14a",
          fontFamily: "'DM Mono', monospace",
          fontSize: "14px",
          letterSpacing: "0.1em",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>⬡</div>
          <div>INITIALIZING SSG SYSTEM...</div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const userRole = session.user.role;
  const canView = (key: string) =>
    ALLOWED_ROLES[key]?.includes(userRole) ?? false;

  const ROLE_BADGE_COLORS: Record<string, string> = {
    SUPER_ADMIN: "#e2b14a",
    BRANCH_MANAGER: "#5b9bd5",
    WAREHOUSE_STAFF: "#6dbf8c",
    SALES_STAFF: "#c97cd4",
    FINANCE: "#e07b5a",
    READONLY: "#8a96a8",
  };
  const badgeColor = ROLE_BADGE_COLORS[userRole] ?? "#8a96a8";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@600;700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg-deep:    #111520;
          --bg-surface: #181d2e;
          --bg-card:    #1f2640;
          --bg-hover:   #262d45;
          --accent:     #e2b14a;
          --accent-dim: rgba(226,177,74,0.12);
          --accent2:    #5b9bd5;
          --text-primary:   #d8dff0;
          --text-secondary: #8a96a8;
          --text-muted:     #505a72;
          --border:     rgba(255,255,255,0.07);
          --border-accent: rgba(226,177,74,0.3);
          --danger:     #e07b5a;
          --success:    #6dbf8c;
          --font-display: 'Syne', sans-serif;
          --font-mono:    'DM Mono', monospace;
        }

        body {
          background: var(--bg-deep);
          color: var(--text-primary);
          font-family: var(--font-mono);
        }

        /* ── SIDEBAR ── */
        .sidebar {
          width: ${sidebarOpen ? "220px" : "60px"};
          min-height: 100vh;
          background: var(--bg-surface);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          transition: width 0.2s ease;
          overflow: hidden;
          flex-shrink: 0;
        }

        .sidebar-logo {
          padding: 20px 16px 16px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }

        .sidebar-logo-icon {
          width: 32px;
          height: 32px;
          background: var(--accent);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--bg-deep);
          font-size: 16px;
          font-family: var(--font-display);
          font-weight: 800;
          flex-shrink: 0;
        }

        .sidebar-logo-text {
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 800;
          color: var(--text-primary);
          white-space: nowrap;
          letter-spacing: 0.05em;
        }

        .sidebar-logo-sub {
          font-size: 9px;
          color: var(--text-muted);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-top: 1px;
        }

        .nav-section {
          flex: 1;
          padding: 12px 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .nav-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 10px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.04em;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
          width: 100%;
          text-align: left;
        }

        .nav-btn:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .nav-btn.active {
          background: var(--accent-dim);
          color: var(--accent);
          border: 1px solid var(--border-accent);
        }

        .nav-btn .nav-icon {
          font-size: 14px;
          width: 20px;
          text-align: center;
          flex-shrink: 0;
        }

        .sidebar-footer {
          padding: 12px 8px;
          border-top: 1px solid var(--border);
        }

        .user-card {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 8px;
          background: var(--bg-card);
          border: 1px solid var(--border);
        }

        .user-avatar {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: var(--bg-hover);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          flex-shrink: 0;
          border: 1px solid var(--border);
          color: var(--text-primary);
        }

        .user-name {
          font-size: 11px;
          color: var(--text-primary);
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-role {
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .sign-out-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 10px;
          margin-top: 6px;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-muted);
          font-family: var(--font-mono);
          font-size: 11px;
          cursor: pointer;
          width: 100%;
          transition: all 0.15s ease;
          white-space: nowrap;
          letter-spacing: 0.04em;
        }

        .sign-out-btn:hover {
          background: rgba(224,123,90,0.12);
          color: var(--danger);
          border-color: rgba(224,123,90,0.3);
        }

        /* ── TOPBAR ── */
        .topbar {
          height: 56px;
          background: var(--bg-surface);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          gap: 16px;
          flex-shrink: 0;
        }

        .topbar-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: var(--text-muted);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .breadcrumb-sep { color: var(--text-muted); }

        .breadcrumb-current {
          color: var(--text-primary);
          font-weight: 500;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .branch-selector {
          display: flex;
          align-items: center;
          gap: 0;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
        }

        .branch-label {
          padding: 6px 10px;
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-muted);
          border-right: 1px solid var(--border);
          white-space: nowrap;
        }

        .branch-select {
          background: transparent;
          border: none;
          color: var(--accent);
          font-family: var(--font-mono);
          font-size: 12px;
          padding: 6px 10px;
          cursor: pointer;
          outline: none;
          font-weight: 500;
          letter-spacing: 0.06em;
        }

        .branch-select option {
          background: var(--bg-card);
          color: var(--text-primary);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--success);
          box-shadow: 0 0 6px var(--success);
          flex-shrink: 0;
        }

        /* ── MAIN CONTENT ── */
        .main-content {
          flex: 1;
          padding: 28px;
          overflow-y: auto;
          background: var(--bg-deep);
        }

        .page-title {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 20px;
          letter-spacing: 0.02em;
        }

        .page-placeholder {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 48px;
          text-align: center;
          color: var(--text-muted);
          font-size: 13px;
        }

        .page-placeholder-icon {
          font-size: 40px;
          margin-bottom: 12px;
          opacity: 0.4;
        }

        .access-denied {
          background: rgba(224,123,90,0.08);
          border: 1px solid rgba(224,123,90,0.2);
          border-radius: 12px;
          padding: 32px;
          text-align: center;
          color: var(--danger);
          font-size: 13px;
        }
      `}</style>

      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        {/* SIDEBAR */}
        <div className="sidebar">
          <div
            className="sidebar-logo"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <div className="sidebar-logo-icon">S</div>
            {sidebarOpen && (
              <div>
                <div className="sidebar-logo-text">SSG Admin</div>
                <div className="sidebar-logo-sub">Gas Distribution</div>
              </div>
            )}
          </div>

          <nav className="nav-section">
            {NAV_ITEMS.map(({ key, label, icon }) =>
              canView(key) ? (
                <button
                  key={key}
                  className={`nav-btn ${currentPage === key ? "active" : ""}`}
                  onClick={() => setCurrentPage(key)}
                  title={!sidebarOpen ? label : undefined}
                >
                  <span className="nav-icon">{icon}</span>
                  {sidebarOpen && <span>{label}</span>}
                </button>
              ) : null,
            )}
          </nav>

          <div className="sidebar-footer">
            {sidebarOpen ? (
              <>
                <div className="user-card">
                  <div className="user-avatar">
                    {session.user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ overflow: "hidden", flex: 1 }}>
                    <div className="user-name">{session.user.name}</div>
                    <div className="user-role" style={{ color: badgeColor }}>
                      {userRole.replace("_", " ")}
                    </div>
                  </div>
                </div>
                <button
                  className="sign-out-btn"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  <span>⏻</span>
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <button
                className="sign-out-btn"
                style={{ justifyContent: "center", padding: "7px" }}
                onClick={() => signOut({ callbackUrl: "/login" })}
                title="Sign Out"
              >
                ⏻
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* TOPBAR */}
          <div className="topbar">
            <div className="topbar-left">
              <div className="status-dot" />
              <div className="breadcrumb">
                <span>SSG</span>
                <span className="breadcrumb-sep">›</span>
                <span className="breadcrumb-current">
                  {NAV_ITEMS.find((n) => n.key === currentPage)?.label ??
                    currentPage}
                </span>
              </div>
            </div>
            <div className="topbar-right">
              <div className="branch-selector">
                <span className="branch-label">Branch</span>
                <select
                  className="branch-select"
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                >
                  <option value="SBY">Surabaya</option>
                  <option value="YOG">Yogyakarta</option>
                </select>
              </div>
            </div>
          </div>

          {/* MAIN */}
          <main className="main-content">
            {canView(currentPage) ? (
              <>
                <div className="page-title">
                  {NAV_ITEMS.find((n) => n.key === currentPage)?.icon}{" "}
                  {NAV_ITEMS.find((n) => n.key === currentPage)?.label}
                </div>
                <div className="page-placeholder">
                  <div className="page-placeholder-icon">
                    {NAV_ITEMS.find((n) => n.key === currentPage)?.icon}
                  </div>
                  <div>
                    {NAV_ITEMS.find((n) => n.key === currentPage)?.label} module
                    coming soon.
                  </div>
                </div>
              </>
            ) : (
              <div className="access-denied">
                ⚠ Access Denied — insufficient permissions for this module.
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
