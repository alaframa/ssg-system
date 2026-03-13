"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import CreatePoModal from "./CreatePoModal";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Branch {
  id: string;
  code: string;
  name: string;
}
interface Supplier {
  id: string;
  code: string;
  name: string;
}

type PoStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "CONFIRMED"
  | "PARTIALLY_RECEIVED"
  | "COMPLETED"
  | "CANCELLED";
type CylinderSize = "KG3" | "KG5_5" | "KG12" | "KG50";

interface PurchaseOrder {
  id: string;
  poNumber: string;
  poDate: string;
  cylinderSize: CylinderSize;
  orderedQty: number;
  confirmedQty: number;
  receivedQty: number;
  pricePerUnit: string;
  status: PoStatus;
  notes: string | null;
  createdAt: string;
  branch: Branch;
  supplier: Supplier;
  createdBy: { id: string; name: string };
}

interface ApiResponse {
  pos: PurchaseOrder[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_META: Record<
  PoStatus,
  { label: string; text: string; bg: string; border: string; dot: string }
> = {
  DRAFT: {
    label: "Draft",
    text: "#64748B",
    bg: "rgba(100,116,139,0.08)",
    border: "rgba(100,116,139,0.2)",
    dot: "#94A3B8",
  },
  SUBMITTED: {
    label: "Submitted",
    text: "#2563EB",
    bg: "rgba(37,99,235,0.08)",
    border: "rgba(37,99,235,0.2)",
    dot: "#2563EB",
  },
  CONFIRMED: {
    label: "Confirmed",
    text: "#0369A1",
    bg: "rgba(3,105,161,0.08)",
    border: "rgba(3,105,161,0.2)",
    dot: "#0369A1",
  },
  PARTIALLY_RECEIVED: {
    label: "Part. Received",
    text: "#D97706",
    bg: "rgba(217,119,6,0.08)",
    border: "rgba(217,119,6,0.2)",
    dot: "#D97706",
  },
  COMPLETED: {
    label: "Completed",
    text: "#15803D",
    bg: "rgba(21,128,61,0.08)",
    border: "rgba(21,128,61,0.2)",
    dot: "#15803D",
  },
  CANCELLED: {
    label: "Cancelled",
    text: "#DC2626",
    bg: "rgba(220,38,38,0.08)",
    border: "rgba(220,38,38,0.2)",
    dot: "#DC2626",
  },
};

const CYL_META: Record<
  CylinderSize,
  { label: string; text: string; bg: string; border: string }
> = {
  KG3: {
    label: "3 Kg",
    text: "#15803D",
    bg: "rgba(21,128,61,0.08)",
    border: "rgba(21,128,61,0.2)",
  },
  KG5_5: {
    label: "5.5 Kg",
    text: "#2563EB",
    bg: "rgba(37,99,235,0.08)",
    border: "rgba(37,99,235,0.2)",
  },
  KG12: {
    label: "12 Kg",
    text: "#D97706",
    bg: "rgba(217,119,6,0.08)",
    border: "rgba(217,119,6,0.2)",
  },
  KG50: {
    label: "50 Kg",
    text: "#7C3AED",
    bg: "rgba(124,58,237,0.08)",
    border: "rgba(124,58,237,0.2)",
  },
};

const fmtIDR = (v: string | number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(v));

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

// ─── Status pill ─────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: PoStatus }) {
  const m = STATUS_META[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.06em",
        padding: "3px 9px",
        borderRadius: 20,
        color: m.text,
        background: m.bg,
        border: `1px solid ${m.border}`,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: m.dot,
          flexShrink: 0,
        }}
      />
      {m.label}
    </span>
  );
}

// ─── Summary stat card ────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  color: string;
  sub?: string;
}) {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderTop: `3px solid ${color}`,
        borderRadius: "var(--radius-md)",
        padding: "14px 16px",
        flex: 1,
        minWidth: 100,
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 900, color, lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color, fontWeight: 600, marginTop: 2 }}>
          {sub}
        </div>
      )}
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--text-low)",
          marginTop: 4,
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ─── PO Detail Drawer ─────────────────────────────────────────────────────────
function PoDrawer({
  po,
  onClose,
  onStatusChange,
}: {
  po: PurchaseOrder;
  onClose: () => void;
  onStatusChange: (id: string, status: PoStatus) => void;
}) {
  const [changingStatus, setChangingStatus] = useState(false);

  const NEXT_STATUS: Partial<Record<PoStatus, PoStatus>> = {
    DRAFT: "SUBMITTED",
    SUBMITTED: "CONFIRMED",
    CONFIRMED: "PARTIALLY_RECEIVED",
  };

  async function advanceStatus() {
    const next = NEXT_STATUS[po.status];
    if (!next) return;
    setChangingStatus(true);
    try {
      const res = await fetch(`/api/purchase-orders/${po.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) onStatusChange(po.id, next);
    } finally {
      setChangingStatus(false);
    }
  }

  async function cancelPo() {
    if (!confirm("Cancel this purchase order?")) return;
    setChangingStatus(true);
    try {
      const res = await fetch(`/api/purchase-orders/${po.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (res.ok) onStatusChange(po.id, "CANCELLED");
    } finally {
      setChangingStatus(false);
    }
  }

  const sm = STATUS_META[po.status];
  const cm = CYL_META[po.cylinderSize];
  const totalVal = Number(po.pricePerUnit) * po.orderedQty;
  const nextStatus = NEXT_STATUS[po.status];
  const canCancel = !["COMPLETED", "CANCELLED"].includes(po.status);

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer" style={{ width: 400 }}>
        {/* Header */}
        <div className="drawer-header">
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: "#111827",
                fontFamily: "var(--font-mono)",
              }}
            >
              {po.poNumber}
            </div>
            <div style={{ marginTop: 6 }}>
              <StatusPill status={po.status} />
            </div>
          </div>
          <button className="drawer-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Sections */}
        <div className="drawer-section">
          <div className="drawer-section-label">Order Details</div>
          <div className="drawer-row">
            <span className="drawer-key">Branch</span>
            <span className="drawer-val">{po.branch.name}</span>
          </div>
          <div className="drawer-row">
            <span className="drawer-key">Supplier</span>
            <span className="drawer-val">{po.supplier.name}</span>
          </div>
          <div className="drawer-row">
            <span className="drawer-key">PO Date</span>
            <span className="drawer-val">{fmtDate(po.poDate)}</span>
          </div>
          <div className="drawer-row">
            <span className="drawer-key">Cylinder</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 4,
                color: cm.text,
                background: cm.bg,
                border: `1px solid ${cm.border}`,
              }}
            >
              {cm.label}
            </span>
          </div>
        </div>

        <div className="drawer-section">
          <div className="drawer-section-label">Quantities</div>
          <div className="drawer-row">
            <span className="drawer-key">Ordered</span>
            <span className="drawer-val" style={{ fontWeight: 700 }}>
              {po.orderedQty.toLocaleString("id-ID")} tbg
            </span>
          </div>
          <div className="drawer-row">
            <span className="drawer-key">Confirmed</span>
            <span
              className="drawer-val"
              style={{ color: "#0369A1", fontWeight: 600 }}
            >
              {po.confirmedQty.toLocaleString("id-ID")} tbg
            </span>
          </div>
          <div className="drawer-row">
            <span className="drawer-key">Received</span>
            <span
              className="drawer-val"
              style={{ color: "#15803D", fontWeight: 600 }}
            >
              {po.receivedQty.toLocaleString("id-ID")} tbg
            </span>
          </div>
          {/* Progress bar */}
          {po.orderedQty > 0 && (
            <div style={{ marginTop: 8, padding: "0 0 4px" }}>
              <div
                style={{
                  height: 6,
                  background: "var(--bg)",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: 3,
                    width: `${Math.min(100, Math.round((po.receivedQty / po.orderedQty) * 100))}%`,
                    background: "#15803D",
                    transition: "width 0.4s",
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: "var(--text-low)",
                  marginTop: 3,
                  textAlign: "right",
                }}
              >
                {Math.round((po.receivedQty / po.orderedQty) * 100)}% received
              </div>
            </div>
          )}
        </div>

        <div className="drawer-section">
          <div className="drawer-section-label">Financials</div>
          <div className="drawer-row">
            <span className="drawer-key">Price / tbg</span>
            <span className="drawer-val">{fmtIDR(po.pricePerUnit)}</span>
          </div>
          <div className="drawer-row">
            <span className="drawer-key">Total Value</span>
            <span
              className="drawer-val"
              style={{ color: "#15803D", fontWeight: 700 }}
            >
              {fmtIDR(totalVal)}
            </span>
          </div>
        </div>

        {po.notes && (
          <div className="drawer-section">
            <div className="drawer-section-label">Notes</div>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-mid)",
                lineHeight: 1.6,
                padding: "4px 0",
              }}
            >
              {po.notes}
            </div>
          </div>
        )}

        <div className="drawer-section">
          <div className="drawer-section-label">Meta</div>
          <div className="drawer-row">
            <span className="drawer-key">Created by</span>
            <span className="drawer-val">{po.createdBy.name}</span>
          </div>
          <div className="drawer-row">
            <span className="drawer-key">Created at</span>
            <span className="drawer-val">{fmtDate(po.createdAt)}</span>
          </div>
        </div>

        {/* Actions */}
        {(nextStatus || canCancel) && (
          <div
            style={{
              padding: "12px 16px",
              display: "flex",
              gap: 8,
              borderTop: "1px solid var(--border-muted)",
            }}
          >
            {nextStatus && (
              <button
                className="btn-pri"
                style={{ flex: 1, fontSize: 12 }}
                onClick={advanceStatus}
                disabled={changingStatus}
              >
                {changingStatus
                  ? "Updating…"
                  : `→ Mark ${STATUS_META[nextStatus].label}`}
              </button>
            )}
            {canCancel && (
              <button
                onClick={cancelPo}
                disabled={changingStatus}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "8px 14px",
                  background: "rgba(220,38,38,0.07)",
                  border: "1px solid rgba(220,38,38,0.2)",
                  borderRadius: "var(--radius-sm)",
                  color: "#DC2626",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                Cancel PO
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PurchaseOrdersPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [branchId, setBranchId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [status, setStatus] = useState("");
  const [cylinderSize, setCylinderSize] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selected, setSelected] = useState<PurchaseOrder | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Bootstrap branches + suppliers
  useEffect(() => {
    Promise.all([
      fetch("/api/branches").then((r) => r.json()),
      fetch("/api/suppliers").then((r) => r.json()),
    ])
      .then(([brs, sups]) => {
        setBranches(brs);
        setSuppliers(sups);
      })
      .catch(() => {});
  }, []);

  const fetchPos = useCallback(
    async (params: {
      search: string;
      branchId: string;
      supplierId: string;
      status: string;
      cylinderSize: string;
      dateFrom: string;
      dateTo: string;
      page: number;
    }) => {
      setLoading(true);
      try {
        const q = new URLSearchParams({
          search: params.search,
          branch: params.branchId,
          supplier: params.supplierId,
          status: params.status,
          cylinderSize: params.cylinderSize,
          dateFrom: params.dateFrom,
          dateTo: params.dateTo,
          page: String(params.page),
        });
        const res = await fetch(`/api/purchase-orders?${q}`);
        setData(await res.json());
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Debounced re-fetch on filter change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchPos({
        search,
        branchId,
        supplierId,
        status,
        cylinderSize,
        dateFrom,
        dateTo,
        page: 1,
      });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, branchId, supplierId, status, cylinderSize, dateFrom, dateTo]);

  useEffect(() => {
    fetchPos({
      search,
      branchId,
      supplierId,
      status,
      cylinderSize,
      dateFrom,
      dateTo,
      page,
    });
  }, [page]); // eslint-disable-line

  const refresh = () =>
    fetchPos({
      search,
      branchId,
      supplierId,
      status,
      cylinderSize,
      dateFrom,
      dateTo,
      page,
    });

  function handleStatusChange(id: string, newStatus: PoStatus) {
    setData((d) =>
      d
        ? {
            ...d,
            pos: d.pos.map((p) =>
              p.id === id ? { ...p, status: newStatus } : p,
            ),
          }
        : d,
    );
    setSelected((s) => (s && s.id === id ? { ...s, status: newStatus } : s));
  }

  // ── Summary stats from current page ──
  const stats = {
    total: data?.total ?? 0,
    open:
      data?.pos.filter((p) =>
        ["DRAFT", "SUBMITTED", "CONFIRMED"].includes(p.status),
      ).length ?? 0,
    pending:
      data?.pos.filter((p) => p.status === "PARTIALLY_RECEIVED").length ?? 0,
    done: data?.pos.filter((p) => p.status === "COMPLETED").length ?? 0,
    totalVal:
      data?.pos.reduce(
        (s, p) => s + Number(p.pricePerUnit) * p.orderedQty,
        0,
      ) ?? 0,
  };

  const hasFilters =
    search ||
    branchId ||
    supplierId ||
    status ||
    cylinderSize ||
    dateFrom ||
    dateTo;

  return (
    <div className="cust-wrap">
      {/* Header */}
      <div className="cust-header">
        <div>
          <div className="cust-breadcrumb">
            <span>SSG</span>
            <span>›</span>
            <span className="cust-breadcrumb-cur">Purchase Orders</span>
          </div>
          <div className="cust-title">Purchase Orders</div>
          <div className="cust-subtitle">Manage · Track · Receive</div>
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
              {data.total.toLocaleString()} Total POs
            </div>
          )}
          <button className="btn-pri" onClick={() => setShowCreate(true)}>
            + Create PO
          </button>
        </div>
      </div>

      {/* Stats bar */}
      {data && (
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <StatCard
            label="Total POs"
            value={stats.total}
            color="var(--accent)"
          />
          <StatCard label="Open / Active" value={stats.open} color="#2563EB" />
          <StatCard
            label="Part. Received"
            value={stats.pending}
            color="#D97706"
          />
          <StatCard label="Completed" value={stats.done} color="#15803D" />
          <StatCard
            label="Page Total Value"
            value={fmtIDR(stats.totalVal)}
            color="#7C3AED"
          />
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar" style={{ flexWrap: "wrap", gap: 8 }}>
        {/* Search */}
        <div className="search-wrap" style={{ minWidth: 220 }}>
          <span className="search-icon">⌕</span>
          <input
            className="search-input"
            placeholder="Search PO number, supplier…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Branch */}
        <select
          className={`filter-select ${branchId ? "filter-active" : ""}`}
          value={branchId}
          onChange={(e) => {
            setBranchId(e.target.value);
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

        {/* Supplier */}
        <select
          className={`filter-select ${supplierId ? "filter-active" : ""}`}
          value={supplierId}
          onChange={(e) => {
            setSupplierId(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Suppliers</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        {/* Status */}
        <select
          className={`filter-select ${status ? "filter-active" : ""}`}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Statuses</option>
          {(Object.keys(STATUS_META) as PoStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </select>

        {/* Cylinder size */}
        <select
          className={`filter-select ${cylinderSize ? "filter-active" : ""}`}
          value={cylinderSize}
          onChange={(e) => {
            setCylinderSize(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Sizes</option>
          {(["KG12", "KG50"] as CylinderSize[]).map((s) => (
            <option key={s} value={s}>
              {CYL_META[s].label}
            </option>
          ))}
        </select>

        {/* Date range */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontSize: 11,
              color: "var(--text-low)",
              whiteSpace: "nowrap",
            }}
          >
            From
          </span>
          <input
            type="date"
            className="filter-select"
            style={{ width: 140, paddingLeft: 8 }}
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
          />
          <span style={{ fontSize: 11, color: "var(--text-low)" }}>To</span>
          <input
            type="date"
            className="filter-select"
            style={{ width: 140, paddingLeft: 8 }}
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* Clear filters */}
        {hasFilters && (
          <button
            className="btn-gho"
            style={{ fontSize: 11, padding: "6px 12px" }}
            onClick={() => {
              setSearch("");
              setBranchId("");
              setSupplierId("");
              setStatus("");
              setCylinderSize("");
              setDateFrom("");
              setDateTo("");
              setPage(1);
            }}
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table className="cust-table">
          <thead>
            <tr>
              <th>PO Number</th>
              <th>Date</th>
              <th>Supplier</th>
              <th>Branch</th>
              <th>Size</th>
              <th>Ordered</th>
              <th>Received</th>
              <th>Total Value</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="skeleton-row">
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j}>████████</td>
                  ))}
                </tr>
              ))
            ) : !data || data.pos.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <div className="table-empty">
                    <div className="table-empty-icon">📝</div>
                    <div>No purchase orders found</div>
                    {hasFilters && (
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
              data.pos.map((po) => {
                const sm = STATUS_META[po.status];
                const cm = CYL_META[po.cylinderSize];
                const pct =
                  po.orderedQty > 0
                    ? Math.round((po.receivedQty / po.orderedQty) * 100)
                    : 0;
                const totalVal = Number(po.pricePerUnit) * po.orderedQty;
                return (
                  <tr
                    key={po.id}
                    className={selected?.id === po.id ? "row-selected" : ""}
                    onClick={() =>
                      setSelected(selected?.id === po.id ? null : po)
                    }
                  >
                    <td>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "var(--accent)",
                        }}
                      >
                        {po.poNumber}
                      </span>
                    </td>
                    <td style={{ whiteSpace: "nowrap", fontSize: 12 }}>
                      {fmtDate(po.poDate)}
                    </td>
                    <td className="cell-primary">{po.supplier.name}</td>
                    <td>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: 3,
                          background: "var(--bg)",
                          border: "1px solid var(--border)",
                          color: "var(--text-mid)",
                        }}
                      >
                        {po.branch.code}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: 4,
                          color: cm.text,
                          background: cm.bg,
                          border: `1px solid ${cm.border}`,
                        }}
                      >
                        {cm.label}
                      </span>
                    </td>
                    <td
                      style={{
                        fontWeight: 600,
                        textAlign: "right",
                        paddingRight: 16,
                      }}
                    >
                      {po.orderedQty.toLocaleString("id-ID")}
                    </td>
                    <td style={{ minWidth: 110 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            height: 4,
                            background: "var(--bg)",
                            borderRadius: 2,
                            overflow: "hidden",
                            minWidth: 48,
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              borderRadius: 2,
                              width: `${pct}%`,
                              background:
                                pct >= 100
                                  ? "#15803D"
                                  : pct > 0
                                    ? "#D97706"
                                    : "#E5E7EB",
                              transition: "width 0.4s",
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            color: "var(--text-low)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {po.receivedQty}/{po.orderedQty}
                        </span>
                      </div>
                    </td>
                    <td
                      style={{
                        color: "#15803D",
                        fontWeight: 600,
                        textAlign: "right",
                        paddingRight: 16,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fmtIDR(totalVal)}
                    </td>
                    <td>
                      <StatusPill status={po.status} />
                    </td>
                  </tr>
                );
              })
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

      {/* Drawer */}
      {selected && (
        <PoDrawer
          po={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Create modal */}
      {showCreate && (
        <CreatePoModal
          branches={branches}
          suppliers={suppliers}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}
