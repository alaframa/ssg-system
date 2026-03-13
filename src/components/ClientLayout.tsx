"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import CustomersPage from "./CustomersPage";
import CustomerDetailPage from "./CustomerDetailPage";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: "⬡" },
  { key: "customers", label: "Customers", icon: "◈" },
  { key: "suppliers", label: "Suppliers", icon: "◉" },
  { key: "po", label: "Purchase Orders", icon: "◧" },
  { key: "delivery", label: "Delivery Orders", icon: "▷" },
  { key: "warehouse", label: "Warehouse", icon: "▣" },
  { key: "gasback", label: "Gasback", icon: "◎" },
  { key: "reports", label: "Reports", icon: "▤" },
];

const ROLE_COLORS = {
  SUPER_ADMIN: "#d4af37",
  BRANCH_MANAGER: "#5b9bd5",
  WAREHOUSE_STAFF: "#6dbf8c",
  SALES_STAFF: "#c97cd4",
  FINANCE: "#e07b5a",
  READONLY: "#8a96a8",
};

export default function ClientLayout({ children }) {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [selectedBranch, setSelectedBranch] = useState("SBY");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [customerDetailId, setCustomerDetailId] = useState(null);

  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated" && pathname !== "/login") {
      router.replace("/login");
    }
  }, [status, pathname, router]);

  if (pathname === "/login") return <>{children}</>;
  if (status === "loading")
    return (
      <div className="flex items-center justify-center h-screen bg-[#161b22]">
        <div className="text-5xl text-[#d4af37]">⬡</div>
      </div>
    );
  if (!session) return null;

  const userRole = session.user.role;
  const badgeColor = ROLE_COLORS[userRole] ?? "#8a96a8";

  const renderPage = () => {
    switch (currentPage) {
      case "customers":
        if (customerDetailId)
          return (
            <CustomerDetailPage
              customerId={customerDetailId}
              onBack={() => setCustomerDetailId(null)}
            />
          );
        return <CustomersPage onNavigate={(id) => setCustomerDetailId(id)} />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-[#58a6ff] text-2xl">
            Module Coming Soon
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen font-sans">
      {/* Sidebar */}
      <aside
        className={`bg-[#1f212e] ${sidebarOpen ? "w-64" : "w-20"} transition-all duration-300 flex flex-col`}
      >
        <div
          className="flex items-center gap-2 p-4 cursor-pointer hover:bg-[#2A2A40]"
          onClick={() => setSidebarOpen((o) => !o)}
        >
          <div className="w-10 h-10 rounded-lg bg-[#d4af37] flex items-center justify-center text-[#161b22] font-bold">
            S
          </div>
          {sidebarOpen && (
            <div className="flex flex-col">
              <span className="text-[#EAEAEA] font-bold">SSG Admin</span>
              <span className="text-[#8b949e] text-xs uppercase">
                Gas Distribution
              </span>
            </div>
          )}
        </div>
        <nav className="flex-1 flex flex-col gap-1 p-2 overflow-y-auto">
          {NAV_ITEMS.map(({ key, label, icon }) => (
            <button
              key={key}
              className={`flex items-center gap-3 p-2 rounded-lg text-sm transition ${currentPage === key ? "bg-[#d4af3733] text-[#d4af37]" : "text-[#8b949e] hover:text-[#d4af37] hover:bg-[#2a2a40]"}`}
              onClick={() => setCurrentPage(key)}
              title={!sidebarOpen ? label : undefined}
            >
              <span className="w-6 text-center">{icon}</span>
              {sidebarOpen && label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-[#30363d]">
          {sidebarOpen && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 bg-[#2A2A40] p-2 rounded-lg">
                <div className="w-8 h-8 rounded-md bg-[#505A72] flex items-center justify-center font-semibold">
                  {session.user.name?.charAt(0)}
                </div>
                <div className="flex flex-col text-xs">
                  <span className="text-[#EAEAEA]">{session.user.name}</span>
                  <span style={{ color: badgeColor }}>
                    {userRole.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full p-2 rounded-md text-xs text-[#8b949e] hover:text-[#e07b5a] hover:bg-[#422B2A]"
              >
                ⏻ Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="flex items-center justify-between bg-[#161b22] border-b border-[#30363d] p-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#3fb950] shadow-[0_0_6px_#3fb950]"></div>
            <div className="text-xs text-[#8b949e] uppercase flex gap-1">
              <span>SSG</span> ›{" "}
              <span className="text-[#EAEAEA] font-semibold">
                {currentPage}
              </span>
            </div>
          </div>
          <div>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-[#2A2A40] text-[#d4af37] rounded-lg px-2 py-1 text-sm"
            >
              <option value="SBY">Surabaya</option>
              <option value="YOG">Yogyakarta</option>
            </select>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8 bg-[#161b22]">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
