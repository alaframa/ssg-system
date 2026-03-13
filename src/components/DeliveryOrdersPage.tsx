"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import CreateDoModal from "./CreateDoModal";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Branch {
  id: string;
  code: string;
  name: string;
}

type DoStatus =
  | "PENDING"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "PARTIAL"
  | "CANCELLED";
type CylinderSize = "KG12" | "KG50";

interface DeliveryOrder {
  id: string;
  doNumber: string;
  doDate: string;
  deliveredAt: string | null;
  cylinderSize: CylinderSize;
  orderedQty: number;
  deliveredQty: number;
  pricePerUnit: string;
  status: DoStatus;
  driverName: string | null;
  vehicleNo: string | null;
  notes: string | null;
  createdAt: string;
  branch: Branch;
  customer: { id: string; code: string; name: string };
  createdBy: { id: string; name: string };
}

interface ApiResponse {
  dos: DeliveryOrder[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_META: Record<
  DoStatus,
  { label: string; text: string; bg: string; border: string; dot: string }
> = {
  PENDING: {
    label: "Pending",
    text: "#64748B",
    bg: "rgba(100,116,139,0.08)",
    border: "rgba(100,116,139,0.2)",
    dot: "#94A3B8",
  },
  IN_TRANSIT: {
    label: "In Transit",
    text: "#2563EB",
    bg: "rgba(37,99,235,0.08)",
    border: "rgba(37,99,235,0.2)",
    dot: "#2563EB",
  },
  DELIVERED: {
    label: "Delivered",
    text: "#15803D",
    bg: "rgba(21,128,61,0.08)",
    border: "rgba(21,128,61,0.2)",
    dot: "#15803D",
  },
  PARTIAL: {
    label: "Partial",
    text: "#D97706",
    bg: "rgba(217,119,6,0.08)",
    border: "rgba(217,119,6,0.2)",
    dot: "#D97706",
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

function parseHelper(notes: string | null): string | null {
  if (!notes) return null;
  const m = notes.match(/^helper:\s*(.+)$/m);
  return m ? m[1].trim() : null;
}

// ─── Status pill ──────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: DoStatus }) {
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

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
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

// ─── Detail Drawer ────────────────────────────────────────────────────────────
function DoDrawer({
  doRecord,
  onClose,
  onStatusChange,
}: {
  doRecord: DeliveryOrder;
  onClose: () => void;
  onStatusChange: (id: string, status: DoStatus, deliveredQty?: number) => void;
}) {
  const [deliveredQty, setDeliveredQty] = useState(String(doRecord.orderedQty));
  const [updating, setUpdating] = useState(false);

  const NEXT_STATUS: Partial<Record<DoStatus, DoStatus>> = {
    PENDING: "IN_TRANSIT",
    IN_TRANSIT: "DELIVERED",
  };

  async function advanceTo(nextStatus: DoStatus) {
    setUpdating(true);
    const qty =
      nextStatus === "DELIVERED" ? Number(deliveredQty) : doRecord.orderedQty;
    try {
      const res = await fetch(`/api/delivery-orders/${doRecord.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          deliveredQty: qty,
          ...(nextStatus === "DELIVERED" && {
            deliveredAt: new Date().toISOString(),
          }),
        }),
      });
      if (res.ok) onStatusChange(doRecord.id, nextStatus, qty);
    } finally {
      setUpdating(false);
    }
  }

  async function cancel() {
    if (!confirm("Cancel this delivery order?")) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/delivery-orders/${doRecord.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (res.ok) onStatusChange(doRecord.id, "CANCELLED");
    } finally {
      setUpdating(false);
    }
  }

  const helperName = parseHelper(doRecord.notes);
  const cleanNotes =
    doRecord.notes
      ?.replace(/^helper:\s*.+$/m, "")
      .replace(/^po:\s*\S+$/m, "")
      .trim() || null;

  const nextStatus = NEXT_STATUS[doRecord.status];
  const canCancel = !["DELIVERED", "CANCELLED"].includes(doRecord.status);
  const cm = CYL_META[doRecord.cylinderSize];

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer" style={{ width: 420 }}>
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
              {doRecord.doNumber}
            </div>
            <div style={{ marginTop: 6 }}>
              <StatusPill status={doRecord.status} />
            </div>
          </div>
          <button className="drawer-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="drawer-section">
          <div className="drawer-section-label">Delivery Details</div>
          <div className="drawer-row">
            <span className="drawer-key">Branch</span>
            <span className="drawer-val">{doRecord.branch.name}</span>
          </div>
          <div className="drawer-row">
            <span className="drawer-key">Customer</span>
            <span className="drawer-val">{doRecord.customer.name}</span>
          </div>
          <div className="drawer-row">
            <span className="drawer-key">DO Date</span>
            <span className="drawer-val">{fmtDate(doRecord.doDate)}</span>
          </div>
          {doRecord.deliveredAt && (
            <div className="drawer-row">
              <span className="drawer-key">Delivered At</span>
              <span className="drawer-val" style={{ color: "#15803D" }}>
                {fmtDate(doRecord.deliveredAt)}
              </span>
            </div>
          )}
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
          <div className="drawer-section-label">Driver & Vehicle</div>
          <div className="drawer-row">
            <span className="drawer-key">Driver</span>
            <span className="drawer-val">{doRecord.driverName || "—"}</span>
          </div>
          <div className="drawer-row">
            <span className="drawer-key">Helper</span>
            <span className="drawer-val">{helperName || "—"}</span>
          </div>
          <div className="drawer-row">
            <span className="drawer-key">Vehicle No.</span>
            <span
              className="drawer-val"
              style={{ fontFamily: "var(--font-mono)", fontWeight: 700 }}
            >
              {doRecord.vehicleNo || "—"}
            </span>
          </div>
        </div>

        <div className="drawer-section">
          <div className="drawer-section-label">Quantities</div>
          <div className="drawer-row">
            <span className="drawer-key">Ordered</span>
            <span className="drawer-val" style={{ fontWeight: 700 }}>
              {doRecord.orderedQty.toLocaleString("id-ID")} tbg
            </span>
          </div>
          <div className="drawer-row">
            <span className="drawer-key">Delivered</span>
            <span
              className="drawer-val"
              style={{ color: "#15803D", fontWeight: 600 }}
            >
              {doRecord.deliveredQty.toLocaleString("id-ID")} tbg
            </span>
          </div>
        </div>

        {cleanNotes && (
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
              {cleanNotes}
            </div>
          </div>
        )}

        {/* Advance status */}
        {nextStatus && (
          <div
            style={{
              padding: "12px 16px",
              borderTop: "1px solid var(--border-muted)",
            }}
          >
            {nextStatus === "DELIVERED" && (
              <div style={{ marginBottom: 10 }}>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--text-mid)",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  Qty actually delivered (tbg)
                  <span
                    style={{
                      fontSize: 10,
                      color: "#D97706",
                      marginLeft: 6,
                      fontWeight: 500,
                    }}
                  >
                    — will close the linked PO
                  </span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={doRecord.orderedQty}
                  className="cd-inp"
                  value={deliveredQty}
                  onChange={(e) => setDeliveredQty(e.target.value)}
                  style={{ fontSize: 14, fontWeight: 700 }}
                />
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn-pri"
                style={{ flex: 1, fontSize: 12 }}
                onClick={() => advanceTo(nextStatus)}
                disabled={updating}
              >
                {updating
                  ? "Updating…"
                  : `→ Mark ${STATUS_META[nextStatus].label}`}
              </button>
              {canCancel && (
                <button
                  onClick={cancel}
                  disabled={updating}
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
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}

        {!nextStatus && canCancel && (
          <div
            style={{
              padding: "12px 16px",
              borderTop: "1px solid var(--border-muted)",
            }}
          >
            <button
              onClick={cancel}
              disabled={updating}
              style={{
                width: "100%",
                fontSize: 12,
                fontWeight: 600,
                padding: "9px",
                background: "rgba(220,38,38,0.07)",
                border: "1px solid rgba(220,38,38,0.2)",
                borderRadius: "var(--radius-sm)",
                color: "#DC2626",
                cursor: "pointer",
              }}
            >
              Cancel DO
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DeliveryOrdersPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [branchId, setBranchId] = useState("");
  const [status, setStatus] = useState("");
  const [driver, setDriver] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selected, setSelected] = useState<DeliveryOrder | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/branches")
      .then((r) => r.json())
      .then(setBranches)
      .catch(() => {});
  }, []);

  const fetchDos = useCallback(
    async (p: {
      search: string;
      branchId: string;
      status: string;
      driver: string;
      dateFrom: string;
      dateTo: string;
      page: number;
    }) => {
      setLoading(true);
      try {
        const q = new URLSearchParams({
          search: p.search,
          branch: p.branchId,
          status: p.status,
          driver: p.driver,
          dateFrom: p.dateFrom,
          dateTo: p.dateTo,
          page: String(p.page),
        });
        const res = await fetch(`/api/delivery-orders?${q}`);
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
      fetchDos({ search, branchId, status, driver, dateFrom, dateTo, page: 1 });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, branchId, status, driver, dateFrom, dateTo]);

  useEffect(() => {
    fetchDos({ search, branchId, status, driver, dateFrom, dateTo, page });
  }, [page]); // eslint-disable-line

  const refresh = () =>
    fetchDos({ search, branchId, status, driver, dateFrom, dateTo, page });

  function handleStatusChange(
    id: string,
    newStatus: DoStatus,
    deliveredQty?: number,
  ) {
    setData((d) =>
      d
        ? {
            ...d,
            dos: d.dos.map((o) =>
              o.id === id
                ? {
                    ...o,
                    status: newStatus,
                    ...(deliveredQty !== undefined && { deliveredQty }),
                  }
                : o,
            ),
          }
        : d,
    );
    setSelected((s) =>
      s && s.id === id
        ? {
            ...s,
            status: newStatus,
            ...(deliveredQty !== undefined && { deliveredQty }),
          }
        : s,
    );
  }

  const stats = {
    total: data?.total ?? 0,
    pending: data?.dos?.filter((o) => o.status === "PENDING").length ?? 0,
    inTransit: data?.dos?.filter((o) => o.status === "IN_TRANSIT").length ?? 0,
    delivered: data?.dos?.filter((o) => o.status === "DELIVERED").length ?? 0,
  };

  const hasFilters =
    search || branchId || status || driver || dateFrom || dateTo;

  return (
    <div className="cust-wrap">
      {/* Header */}
      <div className="cust-header">
        <div>
          <div className="cust-breadcrumb">
            <span>SSG</span>
            <span>›</span>
            <span className="cust-breadcrumb-cur">Delivery Orders</span>
          </div>
          <div className="cust-title">Delivery Orders</div>
          <div className="cust-subtitle">Dispatch · Track · Deliver</div>
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
              {data.total.toLocaleString()} Total DOs
            </div>
          )}
          <button className="btn-pri" onClick={() => setShowCreate(true)}>
            + Create DO
          </button>
        </div>
      </div>

      {/* Stats */}
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
            label="Total DOs"
            value={stats.total}
            color="var(--accent)"
          />
          <StatCard label="Pending" value={stats.pending} color="#64748B" />
          <StatCard
            label="In Transit"
            value={stats.inTransit}
            color="#2563EB"
          />
          <StatCard label="Delivered" value={stats.delivered} color="#15803D" />
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar" style={{ flexWrap: "wrap", gap: 8 }}>
        <div className="search-wrap" style={{ minWidth: 220 }}>
          <span className="search-icon">⌕</span>
          <input
            className="search-input"
            placeholder="Search DO number, customer, driver…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

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

        <select
          className={`filter-select ${status ? "filter-active" : ""}`}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Statuses</option>
          {(Object.keys(STATUS_META) as DoStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </select>

        <div className="search-wrap" style={{ minWidth: 160 }}>
          <span className="search-icon">🚛</span>
          <input
            className="search-input"
            placeholder="Filter by driver…"
            value={driver}
            onChange={(e) => {
              setDriver(e.target.value);
              setPage(1);
            }}
          />
        </div>

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

        {hasFilters && (
          <button
            className="btn-gho"
            style={{ fontSize: 11, padding: "6px 12px" }}
            onClick={() => {
              setSearch("");
              setBranchId("");
              setStatus("");
              setDriver("");
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
              <th>DO Number</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Branch</th>
              <th>Size</th>
              <th>Qty</th>
              <th>Driver</th>
              <th>Vehicle</th>
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
            ) : !data || data.dos.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <div className="table-empty">
                    <div className="table-empty-icon">🚚</div>
                    <div>No delivery orders found</div>
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
              data.dos.map((o) => {
                const cm = CYL_META[o.cylinderSize];
                return (
                  <tr
                    key={o.id}
                    className={selected?.id === o.id ? "row-selected" : ""}
                    onClick={() =>
                      setSelected(selected?.id === o.id ? null : o)
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
                        {o.doNumber}
                      </span>
                    </td>
                    <td style={{ whiteSpace: "nowrap", fontSize: 12 }}>
                      {fmtDate(o.doDate)}
                    </td>
                    <td className="cell-primary">{o.customer.name}</td>
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
                        {o.branch.code}
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
                      {o.orderedQty.toLocaleString("id-ID")}
                    </td>
                    <td style={{ fontSize: 12 }}>{o.driverName || "—"}</td>
                    <td>
                      <span
                        style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}
                      >
                        {o.vehicleNo || "—"}
                      </span>
                    </td>
                    <td>
                      <StatusPill status={o.status} />
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

      {selected && (
        <DoDrawer
          doRecord={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      {showCreate && (
        <CreateDoModal
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
