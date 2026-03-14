"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import AddEditCustomerModal from "./AddEditCustomerModal";
import ImportCustomersModal from "./ImportCustomersModal";

interface Branch {
  id: string;
  code: string;
  name: string;
}
interface Customer {
  id: string;
  code: string;
  name: string;
  customerType: "RETAIL" | "AGEN" | "INDUSTRI";
  phone: string | null;
  email: string | null;
  address: string | null;
  creditLimitKg12: number;
  creditLimitKg50: number;

  isActive: boolean;
  branch: Branch;
  createdAt: string;
}
interface ApiResponse {
  customers: Customer[];
  total: number;
  page: number;
  totalPages: number;
}

const TYPE_LABELS: Record<string, string> = {
  RETAIL: "Retail",
  AGEN: "Agen",
  INDUSTRI: "Industri",
};
const TYPE_COLORS: Record<
  string,
  { text: string; bg: string; border: string }
> = {
  RETAIL: {
    text: "#2563EB",
    bg: "rgba(37,99,235,0.08)",
    border: "rgba(37,99,235,0.2)",
  },
  AGEN: {
    text: "#D97706",
    bg: "rgba(217,119,6,0.08)",
    border: "rgba(217,119,6,0.2)",
  },
  INDUSTRI: {
    text: "#7C3AED",
    bg: "rgba(124,58,237,0.08)",
    border: "rgba(124,58,237,0.2)",
  },
};
const fmtIDR = (val: string) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(val));

export default function CustomersPage({
  onNavigate,
  onAddNew,
}: {
  onNavigate?: (id: string) => void;
  onAddNew?: () => void;
}) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/branches")
      .then((r) => r.json())
      .then(setBranches)
      .catch(() => {});
  }, []);

  const fetchCustomers = useCallback(
    async (p: {
      search: string;
      branch: string;
      status: string;
      type: string;
      page: number;
    }) => {
      setLoading(true);
      try {
        const q = new URLSearchParams({ ...p, page: String(p.page) });
        const res = await fetch(`/api/customers?${q}`);
        setData(await res.json());
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchCustomers({ search, branch, status, type, page: 1 });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, branch, status, type]);

  useEffect(() => {
    fetchCustomers({ search, branch, status, type, page });
  }, [page]);

  const refresh = () => fetchCustomers({ search, branch, status, type, page });

  return (
    <div className="cust-wrap">
      {/* Header */}
      <div className="cust-header">
        <div>
          <div className="cust-breadcrumb">
            <span>SSG</span>
            <span>›</span>
            <span className="cust-breadcrumb-cur">Customers</span>
          </div>
          <div className="cust-title">Customers</div>
          <div className="cust-subtitle">Manage · Search · Filter</div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          {data && (
            <div className="cust-count-badge">
              {data.total.toLocaleString()} Total Customers
            </div>
          )}
          <button
            className="btn-gho"
            style={{ fontSize: 12 }}
            onClick={() => setShowImport(true)}
          >
            📥 Import Excel
          </button>
          <button
            className="btn-pri"
            onClick={() => (onAddNew ? onAddNew() : setShowAdd(true))}
          >
            + Add Customer
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-wrap">
          <span className="search-icon">⌕</span>
          <input
            className="search-input"
            placeholder="Search by name, code, phone, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <select
          className={`filter-select ${branch ? "filter-active" : ""}`}
          value={branch}
          onChange={(e) => {
            setBranch(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select
          className={`filter-select ${type ? "filter-active" : ""}`}
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Types</option>
          <option value="RETAIL">Retail</option>
          <option value="AGEN">Agen</option>
          <option value="INDUSTRI">Industri</option>
        </select>
        <select
          className={`filter-select ${status ? "filter-active" : ""}`}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table className="cust-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Type</th>
              <th>Branch</th>
              <th>Phone</th>
              <th>Credit Limit</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="skeleton-row">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j}>████████</td>
                  ))}
                </tr>
              ))
            ) : !data || data.customers.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="table-empty">
                    <div className="table-empty-icon">👥</div>
                    <div>No customers found</div>
                    {(search || branch || status || type) && (
                      <div
                        style={{ marginTop: 6, fontSize: 11, color: "#9CA3AF" }}
                      >
                        Try clearing your filters
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              data.customers.map((c) => {
                const tc = TYPE_COLORS[c.customerType];
                return (
                  <tr
                    key={c.id}
                    className={selected === c.id ? "row-selected" : ""}
                    onClick={() =>
                      onNavigate
                        ? onNavigate(c.id)
                        : setSelected(selected === c.id ? null : c.id)
                    }
                  >
                    <td className="cell-code">{c.code}</td>
                    <td className="cell-primary">{c.name}</td>
                    <td>
                      <span
                        className="type-badge"
                        style={{
                          color: tc.text,
                          borderColor: tc.border,
                          background: tc.bg,
                        }}
                      >
                        {TYPE_LABELS[c.customerType]}
                      </span>
                    </td>
                    <td>{c.branch.code}</td>
                    <td>{c.phone ?? "—"}</td>
                    <td style={{ color: "#15803D", fontWeight: 600 }}>
                      {c.creditLimitKg12} tbg (12kg) / {c.creditLimitKg50} tbg
                      (50kg)
                    </td>
                    <td>
                      <span className="status-badge">
                        <span
                          className="status-dot-sm"
                          style={{
                            background: c.isActive ? "#15803D" : "#D1D5DB",
                            boxShadow: c.isActive
                              ? "0 0 0 2px rgba(21,128,61,0.2)"
                              : "none",
                          }}
                        />
                        <span
                          style={{ color: c.isActive ? "#15803D" : "#9CA3AF" }}
                        >
                          {c.isActive ? "Active" : "Inactive"}
                        </span>
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {data && data.totalPages > 1 && (
          <div className="pagination">
            <div className="pag-info">
              Showing {(data.page - 1) * 20 + 1}–
              {Math.min(data.page * 20, data.total)} of {data.total}
            </div>
            <div className="pag-btns">
              <button
                className="pag-btn"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Prev
              </button>
              {Array.from({ length: Math.min(data.totalPages, 5) }, (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    className={`pag-btn ${page === p ? "active" : ""}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                className="pag-btn"
                disabled={page === data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Drawer (only when no onNavigate) */}
      {selected &&
        !onNavigate &&
        (() => {
          const c = data?.customers.find((x) => x.id === selected);
          if (!c) return null;
          const tc = TYPE_COLORS[c.customerType];
          return (
            <>
              <div
                className="drawer-overlay"
                onClick={() => setSelected(null)}
              />
              <div className="drawer">
                <div className="drawer-header">
                  <div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: "#111827",
                      }}
                    >
                      {c.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#64748B",
                        marginTop: 3,
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {c.code}
                    </div>
                  </div>
                  <button
                    className="drawer-close"
                    onClick={() => setSelected(null)}
                  >
                    ✕
                  </button>
                </div>
                <div className="drawer-section">
                  <div className="drawer-section-label">Identity</div>
                  <div className="drawer-row">
                    <span className="drawer-key">Type</span>
                    <span
                      className="type-badge"
                      style={{
                        color: tc.text,
                        borderColor: tc.border,
                        background: tc.bg,
                      }}
                    >
                      {TYPE_LABELS[c.customerType]}
                    </span>
                  </div>
                  <div className="drawer-row">
                    <span className="drawer-key">Branch</span>
                    <span className="drawer-val">{c.branch.name}</span>
                  </div>
                  <div className="drawer-row">
                    <span className="drawer-key">Status</span>
                    <span className="status-badge">
                      <span
                        className="status-dot-sm"
                        style={{
                          background: c.isActive ? "#15803D" : "#D1D5DB",
                        }}
                      />
                      <span
                        style={{ color: c.isActive ? "#15803D" : "#9CA3AF" }}
                      >
                        {c.isActive ? "Active" : "Inactive"}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="drawer-section">
                  <div className="drawer-section-label">Contact</div>
                  <div className="drawer-row">
                    <span className="drawer-key">Phone</span>
                    <span className="drawer-val">{c.phone ?? "—"}</span>
                  </div>
                  <div className="drawer-row">
                    <span className="drawer-key">Email</span>
                    <span className="drawer-val">{c.email ?? "—"}</span>
                  </div>
                  <div className="drawer-row">
                    <span className="drawer-key">Address</span>
                    <span className="drawer-val" style={{ maxWidth: 200 }}>
                      {c.address ?? "—"}
                    </span>
                  </div>
                </div>
                <div className="drawer-section">
                  <div className="drawer-section-label">Financial</div>
                  <div className="drawer-row">
                    <span className="drawer-key">Credit Limit</span>
                    <span className="drawer-val" style={{ color: "#15803D" }}>
                      {fmtIDR(c.creditLimit)}
                    </span>
                  </div>
                </div>
                <div className="drawer-section">
                  <div className="drawer-section-label">Meta</div>
                  <div className="drawer-row">
                    <span className="drawer-key">Created</span>
                    <span className="drawer-val">
                      {new Date(c.createdAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </>
          );
        })()}

      {/* Modals */}
      {showAdd && (
        <AddEditCustomerModal
          branches={branches}
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            refresh();
          }}
        />
      )}
      {showImport && (
        <ImportCustomersModal
          onClose={() => setShowImport(false)}
          onImported={() => {
            setShowImport(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}
