"use client";

// src/components/PurchaseOrdersPage.tsx
// Sprint 3 — Purchase Orders (SSG → Customer)
// Flow: Create PO → Confirm → Issue DOs against it

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type CylSize = "KG3" | "KG5_5" | "KG12" | "KG50";
type PoStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "CONFIRMED"
  | "PARTIALLY_RECEIVED"
  | "COMPLETED"
  | "CANCELLED";

const CYL_LABELS: Record<CylSize, string> = {
  KG3: "3 kg",
  KG5_5: "5.5 kg",
  KG12: "12 kg",
  KG50: "50 kg",
};

const STATUS_CFG: Record<
  PoStatus,
  { label: string; color: string; bg: string }
> = {
  DRAFT: { label: "Draft", color: "#6B7280", bg: "rgba(107,114,128,0.1)" },
  SUBMITTED: {
    label: "Submitted",
    color: "#D97706",
    bg: "rgba(217,119,6,0.1)",
  },
  CONFIRMED: {
    label: "Confirmed",
    color: "#2563EB",
    bg: "rgba(37,99,235,0.1)",
  },
  PARTIALLY_RECEIVED: {
    label: "Partial",
    color: "#7C3AED",
    bg: "rgba(124,58,237,0.1)",
  },
  COMPLETED: {
    label: "Completed",
    color: "#15803D",
    bg: "rgba(21,128,61,0.1)",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "#DC2626",
    bg: "rgba(220,38,38,0.1)",
  },
};

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
interface PoRow {
  id: string;
  poNumber: string;
  poDate: string;
  cylinderSize: CylSize;
  orderedQty: number;
  confirmedQty: number;
  receivedQty: number;
  pricePerUnit: string;
  status: PoStatus;
  notes: string | null;
  branch: Branch;
  supplier: Supplier;
  createdBy: { name: string };
  _count: { inboundReceivings: number };
}
interface DoRow {
  id: string;
  doNumber: string;
  doDate: string;
  cylinderSize: CylSize;
  orderedQty: number;
  deliveredQty: number;
  pricePerUnit: string;
  status: string;
  driverName: string | null;
  vehicleNo: string | null;
  notes: string | null;
  customer: { id: string; code: string; name: string };
  createdBy: { name: string };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString("id-ID");
const fmtIDR = (v: string | number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(v));
const today = () => new Date().toISOString().slice(0, 10);

function StatusBadge({ status }: { status: PoStatus }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.DRAFT;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.color}33`,
      }}
    >
      {cfg.label}
    </span>
  );
}

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  background: "var(--bg)",
  color: "var(--text-hi)",
  fontFamily: "var(--font-sans)",
  fontSize: 13,
  boxSizing: "border-box",
  outline: "none",
};

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--text-mid)",
          marginBottom: 5,
        }}
      >
        {label}
      </label>
      {children}
      {error && (
        <div style={{ fontSize: 11, color: "var(--danger)", marginTop: 3 }}>
          {error}
        </div>
      )}
    </div>
  );
}

// ─── Create PO Form ───────────────────────────────────────────────────────────
function CreatePoForm({
  branchId,
  supplier,
  onClose,
  onSaved,
}: {
  branchId: string;
  supplier: Supplier;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [customers, setCustomers] = useState<
    { id: string; code: string; name: string }[]
  >([]);
  const [custLoading, setCustLoading] = useState(true);

  const [form, setForm] = useState({
    poNumber: `PO-${Date.now()}`,
    poDate: today(),
    cylinderSize: "KG12" as CylSize,
    orderedQty: "",
    pricePerUnit: "175500",
    customerId: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Load customers for this branch
  useEffect(() => {
    setCustLoading(true);
    fetch(`/api/customers?branch=${branchId}&limit=500&isActive=true`)
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers ?? []))
      .finally(() => setCustLoading(false));
  }, [branchId]);

  // Auto price by size
  useEffect(() => {
    const prices: Record<CylSize, string> = {
      KG3: "52500",
      KG5_5: "96250",
      KG12: "175500",
      KG50: "604700",
    };
    set("pricePerUnit", prices[form.cylinderSize]);
  }, [form.cylinderSize]);

  async function submit() {
    setSaving(true);
    setErrors({});
    try {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          branchId,
          supplierId: supplier.id,
          customerId: form.customerId,
          orderedQty: Number(form.orderedQty),
          pricePerUnit: Number(form.pricePerUnit),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.errors ?? { _: data.error ?? "Failed." });
        return;
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: 24,
        marginBottom: 24,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-hi)" }}>
          New Purchase Order
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            fontSize: 18,
            cursor: "pointer",
            color: "var(--text-low)",
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Supplier — read-only display */}
        <div
          style={{
            background: "rgba(37,99,235,0.04)",
            border: "1px solid rgba(37,99,235,0.2)",
            borderRadius: "var(--radius-sm)",
            padding: "10px 14px",
            fontSize: 13,
            color: "var(--text-mid)",
          }}
        >
          <span style={{ fontWeight: 700, color: "var(--accent)" }}>
            Supplier:
          </span>{" "}
          {supplier.name}{" "}
          <span style={{ opacity: 0.5 }}>({supplier.code})</span>
        </div>

        {/* Customer */}
        <FormField label="Customer *" error={errors.customerId}>
          {custLoading ? (
            <div
              style={{
                fontSize: 12,
                color: "var(--text-low)",
                padding: "8px 0",
              }}
            >
              Loading customers…
            </div>
          ) : (
            <select
              value={form.customerId}
              onChange={(e) => set("customerId", e.target.value)}
              style={fieldStyle}
            >
              <option value="">— Select customer —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          )}
        </FormField>

        {/* PO Number + Date */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <FormField label="PO Number *" error={errors.poNumber}>
            <input
              value={form.poNumber}
              onChange={(e) => set("poNumber", e.target.value)}
              style={fieldStyle}
            />
          </FormField>
          <FormField label="PO Date *" error={errors.poDate}>
            <input
              type="date"
              value={form.poDate}
              onChange={(e) => set("poDate", e.target.value)}
              style={fieldStyle}
            />
          </FormField>
        </div>

        {/* Cylinder Size */}
        <FormField label="Cylinder Size *" error={errors.cylinderSize}>
          <select
            value={form.cylinderSize}
            onChange={(e) => set("cylinderSize", e.target.value as CylSize)}
            style={fieldStyle}
          >
            {(
              Object.entries({
                KG12: "12 kg",
                KG50: "50 kg",
              }) as [CylSize, string][]
            ).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </FormField>

        {/* Qty + Price */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <FormField label="Ordered Qty *" error={errors.orderedQty}>
            <input
              type="number"
              min={1}
              value={form.orderedQty}
              onChange={(e) => set("orderedQty", e.target.value)}
              style={fieldStyle}
              placeholder="e.g. 50"
            />
          </FormField>
          <FormField label="Price / Unit (Rp) *" error={errors.pricePerUnit}>
            <input
              type="number"
              min={0}
              value={form.pricePerUnit}
              onChange={(e) => set("pricePerUnit", e.target.value)}
              style={fieldStyle}
            />
          </FormField>
        </div>

        {/* Notes */}
        <FormField label="Notes" error={errors.notes}>
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={2}
            style={{ ...fieldStyle, resize: "vertical" }}
            placeholder="Optional — e.g. order via WhatsApp"
          />
        </FormField>

        {errors._ && (
          <div style={{ color: "var(--danger)", fontSize: 12 }}>{errors._}</div>
        )}

        {/* Actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 6,
          }}
        >
          <button className="btn-gho" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn-pri" onClick={submit} disabled={saving}>
            {saving ? "Saving…" : "Create PO"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PO Detail Panel ──────────────────────────────────────────────────────────
function PoDetailPanel({
  po,
  onClose,
  onRefresh,
}: {
  po: PoRow;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [dos, setDos] = useState<DoRow[]>([]);
  const [dosLoading, setDosLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    setDosLoading(true);
    fetch(`/api/delivery-orders?poId=${po.id}&limit=100`)
      .then((r) => r.json())
      .then((d) => setDos(d.rows ?? []))
      .finally(() => setDosLoading(false));
  }, [po.id]);

  async function updateStatus(status: PoStatus) {
    setUpdatingStatus(true);
    await fetch(`/api/purchase-orders/${po.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdatingStatus(false);
    onRefresh();
  }

  const totalValue = Number(po.orderedQty) * Number(po.pricePerUnit);
  const doCount = dos.length;
  const deliveredTotal = dos.reduce((s, d) => s + d.deliveredQty, 0);

  const DO_STATUS_CFG: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Pending", color: "#D97706" },
    IN_TRANSIT: { label: "In Transit", color: "#2563EB" },
    DELIVERED: { label: "Delivered", color: "#15803D" },
    PARTIAL: { label: "Partial", color: "#7C3AED" },
    CANCELLED: { label: "Cancelled", color: "#DC2626" },
  };

  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              color: "var(--text-low)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Purchase Order
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 900,
              color: "var(--sidebar)",
              letterSpacing: "-0.02em",
            }}
          >
            {po.poNumber}
          </div>
          <div style={{ marginTop: 4 }}>
            <StatusBadge status={po.status} />
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            fontSize: 16,
            cursor: "pointer",
            color: "var(--text-low)",
          }}
        >
          ✕
        </button>
      </div>

      {/* Meta */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--border)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
        }}
      >
        {[
          ["Date", new Date(po.poDate).toLocaleDateString("id-ID")],
          ["Branch", po.branch.name],
          ["Cylinder", CYL_LABELS[po.cylinderSize]],
          ["Ordered", fmt(po.orderedQty) + " units"],
          ["Price/Unit", fmtIDR(po.pricePerUnit)],
          ["Total Value", fmtIDR(totalValue)],
          ["DOs Issued", doCount + " delivery order(s)"],
          ["Delivered", fmt(deliveredTotal) + " / " + fmt(po.orderedQty)],
        ].map(([k, v]) => (
          <div key={k as string}>
            <div
              style={{
                fontSize: 10,
                color: "var(--text-low)",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {k}
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-hi)",
                marginTop: 2,
              }}
            >
              {v}
            </div>
          </div>
        ))}
      </div>

      {/* Status actions */}
      {po.status !== "COMPLETED" && po.status !== "CANCELLED" && (
        <div
          style={{
            padding: "12px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: "var(--text-low)",
              alignSelf: "center",
              fontWeight: 600,
            }}
          >
            Update status:
          </span>
          {po.status === "DRAFT" && (
            <button
              className="btn-gho"
              onClick={() => updateStatus("SUBMITTED")}
              disabled={updatingStatus}
            >
              → Submit
            </button>
          )}
          {po.status === "SUBMITTED" && (
            <button
              className="btn-pri"
              onClick={() => updateStatus("CONFIRMED")}
              disabled={updatingStatus}
            >
              ✓ Confirm
            </button>
          )}
          {po.status !== "CANCELLED" && (
            <button
              className="btn-gho"
              style={{ color: "var(--danger)" }}
              onClick={() => updateStatus("CANCELLED")}
              disabled={updatingStatus}
            >
              ✕ Cancel
            </button>
          )}
        </div>
      )}

      {/* Delivery Orders */}
      <div style={{ padding: "16px 20px" }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--text-low)",
            marginBottom: 12,
          }}
        >
          Delivery Orders ({doCount})
        </div>
        {dosLoading ? (
          <div style={{ color: "var(--text-low)", fontSize: 13 }}>Loading…</div>
        ) : dos.length === 0 ? (
          <div
            style={{
              color: "var(--text-low)",
              fontSize: 13,
              fontStyle: "italic",
            }}
          >
            No delivery orders issued yet.
          </div>
        ) : (
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {[
                  "DO #",
                  "Date",
                  "Customer",
                  "Size",
                  "Qty",
                  "Delivered",
                  "Driver",
                  "Status",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "6px 10px",
                      textAlign: "left",
                      fontWeight: 700,
                      fontSize: 10,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "var(--text-low)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dos.map((d) => {
                const sc = DO_STATUS_CFG[d.status] ?? {
                  label: d.status,
                  color: "#6B7280",
                };
                return (
                  <tr
                    key={d.id}
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <td
                      style={{
                        padding: "8px 10px",
                        fontWeight: 700,
                        color: "var(--accent)",
                        fontFamily: "monospace",
                        fontSize: 11,
                      }}
                    >
                      {d.doNumber}
                    </td>
                    <td
                      style={{ padding: "8px 10px", color: "var(--text-mid)" }}
                    >
                      {new Date(d.doDate).toLocaleDateString("id-ID")}
                    </td>
                    <td
                      style={{ padding: "8px 10px", color: "var(--text-hi)" }}
                    >
                      {d.customer.name}
                    </td>
                    <td
                      style={{ padding: "8px 10px", color: "var(--text-mid)" }}
                    >
                      {CYL_LABELS[d.cylinderSize]}
                    </td>
                    <td style={{ padding: "8px 10px" }}>{fmt(d.orderedQty)}</td>
                    <td
                      style={{
                        padding: "8px 10px",
                        color:
                          d.deliveredQty > 0 ? "#15803D" : "var(--text-low)",
                      }}
                    >
                      {fmt(d.deliveredQty)}
                    </td>
                    <td
                      style={{ padding: "8px 10px", color: "var(--text-mid)" }}
                    >
                      {d.driverName ?? "—"}
                    </td>
                    <td style={{ padding: "8px 10px" }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: sc.color,
                          textTransform: "uppercase",
                        }}
                      >
                        {sc.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {po.notes && (
        <div
          style={{
            padding: "0 20px 16px",
            fontSize: 12,
            color: "var(--text-mid)",
            fontStyle: "italic",
          }}
        >
          Notes: {po.notes}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PurchaseOrdersPage({
  activeBranchId,
}: {
  activeBranchId: string;
}) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [branchId, setBranchId] = useState(activeBranchId);
  const [rows, setRows] = useState<PoRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<PoRow | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/branches").then((r) => r.json()),
      fetch("/api/suppliers").then((r) => r.json()),
    ]).then(([brs, sups]) => {
      setBranches(brs);
      if (sups.length) setSupplier(sups[0]);
    });
  }, []);

  const load = useCallback(
    async (opts: {
      branchId: string;
      search: string;
      status: string;
      page: number;
    }) => {
      setLoading(true);
      try {
        const q = new URLSearchParams({
          branchId: opts.branchId,
          search: opts.search,
          page: String(opts.page),
          limit: "20",
        });
        if (opts.status) q.set("status", opts.status);
        const data = await fetch(`/api/purchase-orders?${q}`).then((r) =>
          r.json(),
        );
        setRows(data.rows ?? []);
        setTotal(data.total ?? 0);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(
      () => load({ branchId, search, status: statusFilter, page }),
      250,
    );
  }, [branchId, search, statusFilter, page, load]);

  // Sync activeBranchId prop
  useEffect(() => {
    setBranchId(activeBranchId);
  }, [activeBranchId]);

  const pages = Math.ceil(total / 20);

  return (
    <div style={{ fontFamily: "var(--font-sans)" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--text-low)",
            marginBottom: 4,
            display: "flex",
            gap: 6,
          }}
        >
          <span>SSG</span>
          <span>›</span>
          <span style={{ color: "var(--accent)" }}>PURCHASE ORDERS</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 900,
                color: "var(--sidebar)",
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              Purchase Orders
            </div>
            <div
              style={{ fontSize: 11, color: "var(--text-mid)", marginTop: 4 }}
            >
              SSG → Customer · Create PO · Issue DOs
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <select
              value={branchId}
              onChange={(e) => {
                setBranchId(e.target.value);
                setPage(1);
              }}
              style={{
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                background: "var(--card)",
                color: "var(--accent)",
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                fontWeight: 600,
                padding: "6px 10px",
                outline: "none",
              }}
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <button
              className="btn-pri"
              onClick={() => {
                setShowForm(true);
                setSelected(null);
              }}
            >
              + New PO
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input
          placeholder="Search PO number…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ ...fieldStyle, maxWidth: 260 }}
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          style={{ ...fieldStyle, maxWidth: 160 }}
        >
          <option value="">All Statuses</option>
          {(Object.keys(STATUS_CFG) as PoStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_CFG[s].label}
            </option>
          ))}
        </select>
        <div
          style={{
            marginLeft: "auto",
            fontSize: 12,
            color: "var(--text-low)",
            alignSelf: "center",
          }}
        >
          {total} total
        </div>
      </div>

      {/* Create form */}
      {showForm && supplier && (
        <CreatePoForm
          branchId={branchId}
          supplier={supplier}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load({ branchId, search, status: statusFilter, page });
          }}
        />
      )}

      {/* Detail panel */}
      {selected && (
        <div style={{ marginBottom: 24 }}>
          <PoDetailPanel
            po={selected}
            onClose={() => setSelected(null)}
            onRefresh={() => {
              load({ branchId, search, status: statusFilter, page });
              // Refresh selected
              fetch(`/api/purchase-orders/${selected.id}`)
                .then((r) => r.json())
                .then(setSelected);
            }}
          />
        </div>
      )}

      {/* Table */}
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
        }}
      >
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
        >
          <thead>
            <tr
              style={{
                background: "var(--bg)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {[
                "PO Number",
                "Date",
                "Size",
                "Ordered",
                "Delivered",
                "Value",
                "DOs",
                "Status",
                "",
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "10px 14px",
                    textAlign: "left",
                    fontWeight: 700,
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--text-low)",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j} style={{ padding: "12px 14px" }}>
                      <div
                        style={{
                          height: 12,
                          background: "var(--border)",
                          borderRadius: 3,
                          width: "70%",
                          opacity: 0.5,
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  style={{
                    padding: "60px 0",
                    textAlign: "center",
                    color: "var(--text-low)",
                    fontSize: 13,
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📝</div>No
                  purchase orders yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.id}
                  style={{
                    borderBottom: "1px solid var(--border)",
                    cursor: "pointer",
                    background:
                      selected?.id === r.id ? "rgba(37,99,235,0.04)" : "",
                  }}
                  onClick={() => setSelected(selected?.id === r.id ? null : r)}
                  onMouseEnter={(e) => {
                    if (selected?.id !== r.id)
                      (e.currentTarget as HTMLElement).style.background =
                        "var(--bg)";
                  }}
                  onMouseLeave={(e) => {
                    if (selected?.id !== r.id)
                      (e.currentTarget as HTMLElement).style.background = "";
                  }}
                >
                  <td
                    style={{
                      padding: "11px 14px",
                      fontWeight: 700,
                      color: "var(--accent)",
                      fontFamily: "monospace",
                      fontSize: 12,
                    }}
                  >
                    {r.poNumber}
                  </td>
                  <td
                    style={{ padding: "11px 14px", color: "var(--text-mid)" }}
                  >
                    {new Date(r.poDate).toLocaleDateString("id-ID")}
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    {CYL_LABELS[r.cylinderSize]}
                  </td>
                  <td style={{ padding: "11px 14px", fontWeight: 600 }}>
                    {fmt(r.orderedQty)}
                  </td>
                  <td
                    style={{
                      padding: "11px 14px",
                      color: r.receivedQty > 0 ? "#15803D" : "var(--text-low)",
                    }}
                  >
                    {fmt(r.receivedQty)}
                  </td>
                  <td
                    style={{ padding: "11px 14px", color: "var(--text-mid)" }}
                  >
                    {fmtIDR(Number(r.pricePerUnit) * r.orderedQty)}
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <span
                      style={{
                        background:
                          r._count.inboundReceivings > 0
                            ? "rgba(37,99,235,0.1)"
                            : "var(--bg)",
                        color:
                          r._count.inboundReceivings > 0
                            ? "var(--accent)"
                            : "var(--text-low)",
                        padding: "2px 8px",
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {r._count.inboundReceivings}
                    </span>
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <StatusBadge status={r.status} />
                  </td>
                  <td
                    style={{
                      padding: "11px 14px",
                      color: "var(--text-low)",
                      fontSize: 16,
                    }}
                  >
                    {selected?.id === r.id ? "▲" : "▼"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pages > 1 && (
          <div
            style={{
              display: "flex",
              gap: 4,
              padding: "12px 14px",
              borderTop: "1px solid var(--border)",
              justifyContent: "flex-end",
            }}
          >
            {Array.from({ length: pages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                style={{
                  padding: "4px 10px",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  background: page === i + 1 ? "var(--accent)" : "var(--card)",
                  color: page === i + 1 ? "#fff" : "var(--text-mid)",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: page === i + 1 ? 700 : 400,
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
