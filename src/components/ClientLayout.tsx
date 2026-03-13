"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";

type PageKey =
  | "dashboard"
  | "customers"
  | "suppliers"
  | "po"
  | "delivery"
  | "warehouse"
  | "gasback"
  | "reports";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedBranch, setSelectedBranch] = useState("SBY");
  const [currentPage, setCurrentPage] = useState<PageKey>("dashboard");

  // ✅ safe, top-level hook
  const { data: session } = useSession();

  // sidebar logic
  const sidebarItems: [PageKey, string][] = [
    ["dashboard", "Dashboard"],
    ["customers", "Customers"],
    ["suppliers", "Suppliers"],
    ["po", "Purchase Orders"],
    ["delivery", "Delivery Orders"],
    ["warehouse", "Warehouse"],
    ["gasback", "Gasback"],
    ["reports", "Reports"],
  ];

  // role check map
  const allowedRolesForPage: Record<string, string[]> = {
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

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <h2 className="text-xl font-bold">Dashboard</h2>;
      case "customers":
        return <h2 className="text-xl font-bold">Customers</h2>;
      case "suppliers":
        return <h2 className="text-xl font-bold">Suppliers</h2>;
      case "po":
        return <h2 className="text-xl font-bold">PO</h2>;
      case "delivery":
        return <h2 className="text-xl font-bold">Delivery</h2>;
      case "warehouse":
        return <h2 className="text-xl font-bold">Warehouse</h2>;
      case "gasback":
        return <h2 className="text-xl font-bold">Gasback</h2>;
      case "reports":
        return <h2 className="text-xl font-bold">Reports</h2>;
      default:
        return <h2 className="text-xl font-bold">Page not found</h2>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-gray-800 text-white flex flex-col">
        <div className="p-4 text-xl font-bold">SSG Admin</div>
        <nav className="flex-1 px-2 space-y-2">
          {sidebarItems.map(([key, label]) => {
            const canView = session?.user.role
              ? allowedRolesForPage[key]?.includes(session.user.role)
              : false;
            return canView ? (
              <button
                key={key}
                onClick={() => setCurrentPage(key)}
                className={`block w-full text-left px-2 py-1 rounded hover:bg-gray-700 ${currentPage === key ? "bg-gray-700 font-semibold" : ""}`}
              >
                {label}
              </button>
            ) : null;
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between bg-white p-4 shadow">
          <div className="text-lg font-semibold">SSG Gas Distribution</div>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="SBY">Surabaya</option>
            <option value="YOGYA">Yogyakarta</option>
          </select>
        </header>

        <main className="flex-1 p-4 overflow-auto">
          <div className="text-gray-600 mb-2">
            Current Branch: {selectedBranch}
          </div>
          {/* Protected Route */}
          {session &&
          allowedRolesForPage[currentPage]?.includes(session.user.role) ? (
            renderPage()
          ) : (
            <div className="p-4 text-red-600">
              Access Denied or Not Logged In
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
