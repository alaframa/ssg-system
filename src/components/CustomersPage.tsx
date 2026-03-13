"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
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
  creditLimit: string;
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

// ─── Constants ────────────────────────────────────────────────────────────────
const TYPE_LABELS: Record<string, string> = {
  RETAIL: "Retail",
  AGEN: "Agen",
  INDUSTRI: "Industri",
};

const TYPE_COLORS: Record<string, string> = {
  RETAIL: "#5b9bd5",
  AGEN: "#e2b14a",
  INDUSTRI: "#c97cd4",
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function CustomersPage({
  onNavigate,
}: {
  onNavigate?: (customerId: string) => void;
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch branches for filter dropdown
  useEffect(() => {
    fetch("/api/branches")
      .then((r) => r.json())
      .then(setBranches)
      .catch(() => {});
  }, []);

  const fetchCustomers = useCallback(
    async (params: {
      search: string;
      branch: string;
      status: string;
      type: string;
      page: number;
    }) => {
      setLoading(true);
      try {
        const q = new URLSearchParams({
          search: params.search,
          branch: params.branch,
          status: params.status,
          type: params.type,
          page: String(params.page),
        });
        const res = await fetch(`/api/customers?${q}`);
        const json = await res.json();
        setData(json);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Debounced search
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

  const formatCurrency = (val: string) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(val));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@600;700;800&display=swap');

        .cust-wrap {
          display: flex;
          flex-direction: column;
          gap: 20px;
          font-family: 'DM Mono', monospace;
        }

        /* ── Header bar ── */
        .cust-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .cust-title {
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 800;
          color: #d8dff0;
          letter-spacing: 0.02em;
        }

        .cust-subtitle {
          font-size: 11px;
          color: #505a72;
          margin-top: 3px;
          letter-spacing: 0.06em;
        }

        .cust-count-badge {
          background: rgba(226,177,74,0.12);
          border: 1px solid rgba(226,177,74,0.25);
          color: #e2b14a;
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 20px;
          letter-spacing: 0.06em;
          white-space: nowrap;
        }

        /* ── Filters bar ── */
        .filters-bar {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }

        .search-wrap {
          position: relative;
          flex: 1;
          min-width: 220px;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #505a72;
          font-size: 13px;
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          background: #1f2640;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px;
          color: #d8dff0;
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          padding: 9px 12px 9px 34px;
          outline: none;
          transition: border-color 0.15s;
          letter-spacing: 0.03em;
        }

        .search-input::placeholder { color: #505a72; }

        .search-input:focus {
          border-color: rgba(226,177,74,0.4);
          background: #232a42;
        }

        .filter-select {
          background: #1f2640;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px;
          color: #d8dff0;
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          padding: 9px 12px;
          outline: none;
          cursor: pointer;
          transition: border-color 0.15s;
          letter-spacing: 0.03em;
        }

        .filter-select:focus { border-color: rgba(226,177,74,0.4); }
        .filter-select option { background: #1f2640; }

        .filter-active {
          border-color: rgba(226,177,74,0.4) !important;
          color: #e2b14a !important;
        }

        /* ── Table ── */
        .table-wrap {
          background: #1f2640;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          overflow: hidden;
        }

        .cust-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }

        .cust-table thead tr {
          background: #181d2e;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }

        .cust-table th {
          padding: 11px 14px;
          text-align: left;
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #505a72;
          font-weight: 500;
          white-space: nowrap;
        }

        .cust-table td {
          padding: 12px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          color: #8a96a8;
          vertical-align: middle;
        }

        .cust-table tbody tr {
          cursor: pointer;
          transition: background 0.12s;
        }

        .cust-table tbody tr:hover td { background: rgba(255,255,255,0.03); }

        .cust-table tbody tr.row-selected td {
          background: rgba(226,177,74,0.06);
          border-bottom-color: rgba(226,177,74,0.1);
        }

        .cust-table tbody tr:last-child td { border-bottom: none; }

        .cell-primary {
          color: #d8dff0 !important;
          font-weight: 500;
        }

        .cell-code {
          color: #e2b14a !important;
          font-size: 11px;
          letter-spacing: 0.06em;
        }

        .type-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-weight: 500;
          border: 1px solid;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
          letter-spacing: 0.06em;
        }

        .status-dot-sm {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* ── Detail drawer ── */
        .drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 40;
          backdrop-filter: blur(2px);
        }

        .drawer {
          position: fixed;
          right: 0;
          top: 0;
          bottom: 0;
          width: 360px;
          background: #181d2e;
          border-left: 1px solid rgba(255,255,255,0.07);
          z-index: 50;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          animation: slideIn 0.2s ease;
        }

        @keyframes slideIn {
          from { transform: translateX(40px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }

        .drawer-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .drawer-close {
          background: #1f2640;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 6px;
          color: #8a96a8;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 14px;
          flex-shrink: 0;
          transition: all 0.15s;
        }

        .drawer-close:hover { color: #d8dff0; background: #262d45; }

        .drawer-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .drawer-section-label {
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #505a72;
          padding-bottom: 6px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .drawer-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
        }

        .drawer-key {
          font-size: 11px;
          color: #505a72;
          letter-spacing: 0.04em;
          flex-shrink: 0;
        }

        .drawer-val {
          font-size: 11px;
          color: #d8dff0;
          text-align: right;
          word-break: break-all;
        }

        /* ── Pagination ── */
        .pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-top: 1px solid rgba(255,255,255,0.05);
          background: #181d2e;
          font-size: 11px;
          color: #505a72;
        }

        .pag-info { letter-spacing: 0.04em; }

        .pag-btns { display: flex; gap: 6px; }

        .pag-btn {
          background: #1f2640;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 6px;
          color: #8a96a8;
          padding: 5px 12px;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .pag-btn:hover:not(:disabled) {
          background: #262d45;
          color: #d8dff0;
        }

        .pag-btn:disabled { opacity: 0.3; cursor: default; }

        .pag-btn.active {
          background: rgba(226,177,74,0.12);
          border-color: rgba(226,177,74,0.3);
          color: #e2b14a;
        }

        /* ── Empty / loading ── */
        .table-empty {
          padding: 56px 24px;
          text-align: center;
          color: #505a72;
          font-size: 12px;
        }

        .table-empty-icon { font-size: 36px; margin-bottom: 10px; opacity: 0.4; }

        .skeleton-row td {
          background: linear-gradient(90deg, #1f2640 25%, #262d45 50%, #1f2640 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          color: transparent !important;
          border-radius: 4px;
        }

        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div className="cust-wrap">
        {/* Header */}
        <div className="cust-header">
          <div>
            <div className="cust-title">◈ Customers</div>
            <div className="cust-subtitle">MANAGE · SEARCH · FILTER</div>
          </div>
          {data && (
            <div className="cust-count-badge">
              {data.total.toLocaleString()} total customers
            </div>
          )}
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
                      <div className="table-empty-icon">◈</div>
                      <div>No customers found</div>
                      {(search || branch || status || type) && (
                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 11,
                            color: "#505a72",
                          }}
                        >
                          Try clearing your filters
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                data.customers.map((c) => (
                  <tr
                    key={c.id}
                    className={selected === c.id ? "row-selected" : ""}
                    onClick={() => {
                      if (onNavigate) {
                        onNavigate(c.id);
                      } else {
                        setSelected(selected === c.id ? null : c.id);
                      }
                    }}
                  >
                    <td className="cell-code">{c.code}</td>
                    <td className="cell-primary">{c.name}</td>
                    <td>
                      <span
                        className="type-badge"
                        style={{
                          color: TYPE_COLORS[c.customerType],
                          borderColor: TYPE_COLORS[c.customerType] + "44",
                          background: TYPE_COLORS[c.customerType] + "14",
                        }}
                      >
                        {TYPE_LABELS[c.customerType]}
                      </span>
                    </td>
                    <td>{c.branch.code}</td>
                    <td>{c.phone ?? "—"}</td>
                    <td style={{ color: "#6dbf8c" }}>
                      {formatCurrency(c.creditLimit)}
                    </td>
                    <td>
                      <span className="status-badge">
                        <span
                          className="status-dot-sm"
                          style={{
                            background: c.isActive ? "#6dbf8c" : "#505a72",
                            boxShadow: c.isActive ? "0 0 5px #6dbf8c" : "none",
                          }}
                        />
                        <span
                          style={{ color: c.isActive ? "#6dbf8c" : "#505a72" }}
                        >
                          {c.isActive ? "Active" : "Inactive"}
                        </span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
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
                {Array.from(
                  { length: Math.min(data.totalPages, 5) },
                  (_, i) => {
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
                  },
                )}
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
      </div>

      {/* Detail Drawer */}
      {selected &&
        (() => {
          const c = data?.customers.find((x) => x.id === selected);
          if (!c) return null;
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
                        fontFamily: "'Syne', sans-serif",
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#d8dff0",
                      }}
                    >
                      {c.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#e2b14a",
                        marginTop: 4,
                        letterSpacing: "0.06em",
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
                        color: TYPE_COLORS[c.customerType],
                        borderColor: TYPE_COLORS[c.customerType] + "44",
                        background: TYPE_COLORS[c.customerType] + "14",
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
                          background: c.isActive ? "#6dbf8c" : "#505a72",
                          boxShadow: c.isActive ? "0 0 5px #6dbf8c" : "none",
                        }}
                      />
                      <span
                        style={{ color: c.isActive ? "#6dbf8c" : "#505a72" }}
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
                    <span className="drawer-val" style={{ color: "#6dbf8c" }}>
                      {formatCurrency(c.creditLimit)}
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
    </>
  );
}
