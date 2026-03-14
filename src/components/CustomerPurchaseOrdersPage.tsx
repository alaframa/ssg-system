"use client";

// src/components/CustomerPurchaseOrdersPage.tsx
// Customer POs — orders placed BY customers TO SSG
// Flow: Customer orders (WA/phone/walk-in) → Create CPO → Issue DOs against it

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
type OrderChannel = "WHATSAPP" | "PHONE" | "WALK_IN" | "SALES_VISIT";

const CYL_LABELS: Record<CylSize, string> = {
  KG3: "3 kg",
  KG5_5: "5.5 kg",
  KG12: "12 kg",
  KG50: "50 kg",
};

const CHANNEL_CFG: Record<
  OrderChannel,
  { label: string; icon: string; color: string }
> = {
  WHATSAPP: { label: "WhatsApp", icon: "💬", color: "#15803D" },
  PHONE: { label: "Phone", icon: "📞", color: "#2563EB" },
  WALK_IN: { label: "Walk-in", icon: "🚶", color: "#7C3AED" },
  SALES_VISIT: { label: "Sales Visit", icon: "🤝", color: "#D97706" },
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

interface Customer {
  id: string;
  code: string;
  name: string;
  phone: string | null;
}
interface CpoRow {
  id: string;
  poNumber: string;
  poDate: string;
  cylinderSize: CylSize;
  orderedQty: number;
  confirmedQty: number;
  fulfilledQty: number;
  pricePerUnit: string;
  status: PoStatus;
  orderChannel: OrderChannel;
  notes: string | null;
  customer: Customer;
  createdBy: { name: string };
  _count: { deliveryOrders: number };
}
interface DoRow {
  id: string;
  doNumber: string;
  doDate: string;
  cylinderSize: CylSize;
  orderedQty: number;
  deliveredQty: number;
  status: string;
  driverName: string | null;
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
const genPoNumber = () => {
  const d = new Date();
  return `CPO-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${String(d.getTime()).slice(-4)}`;
};

// ─── Sub-components ───────────────────────────────────────────────────────────
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

function ChannelBadge({ channel }: { channel: OrderChannel }) {
  const cfg = CHANNEL_CFG[channel] ?? CHANNEL_CFG.WHATSAPP;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 7px",
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 600,
        color: cfg.color,
        background: `${cfg.color}15`,
        border: `1px solid ${cfg.color}30`,
      }}
    >
      {cfg.icon} {cfg.label}
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

// ─── Create CPO Form ──────────────────────────────────────────────────────────
function CreateCpoForm({
  branchId,
  onClose,
  onSaved,
}: {
  branchId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [custLoading, setCustLoading] = useState(true);
  const [form, setForm] = useState({
    customerId: "",
    poNumber: genPoNumber(),
    poDate: today(),
    cylinderSize: "KG12" as CylSize,
    orderedQty: "",
    pricePerUnit: "175500",
    orderChannel: "WHATSAPP" as OrderChannel,
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    setCustLoading(true);
    fetch(`/api/customers?branch=${branchId}&limit=500&isActive=true`)
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers ?? []))
      .finally(() => setCustLoading(false));
  }, [branchId]);

  // Auto price by cylinder size
  useEffect(() => {
    const prices: Record<CylSize, string> = {
      KG12: "175500",
      KG50: "604700",
    };
    set("pricePerUnit", prices[form.cylinderSize]);
  }, [form.cylinderSize]);

  async function submit() {
    setSaving(true);
    setErrors({});
    try {
      const res = await fetch("/api/customer-pos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          branchId,
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

  const selectedCust = customers.find((c) => c.id === form.customerId);

  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: 24,
        marginBottom: 24,
        boxShadow: "var(--shadow-md)",
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
        <div>
          <div
            style={{ fontSize: 15, fontWeight: 700, color: "var(--text-hi)" }}
          >
            New Customer Order
          </div>
          <div style={{ fontSize: 11, color: "var(--text-low)", marginTop: 2 }}>
            Record order received from customer
          </div>
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
        {/* Order Channel */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-mid)",
              marginBottom: 8,
            }}
          >
            Order Channel *
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(
              Object.entries(CHANNEL_CFG) as [
                OrderChannel,
                (typeof CHANNEL_CFG)[OrderChannel],
              ][]
            ).map(([k, v]) => (
              <button
                key={k}
                onClick={() => set("orderChannel", k)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: `1.5px solid ${form.orderChannel === k ? v.color : "var(--border)"}`,
                  background:
                    form.orderChannel === k ? `${v.color}15` : "var(--bg)",
                  color: form.orderChannel === k ? v.color : "var(--text-mid)",
                  transition: "all 0.15s",
                }}
              >
                {v.icon} {v.label}
              </button>
            ))}
          </div>
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

        {/* Customer phone hint */}
        {selectedCust?.phone && (
          <div
            style={{
              padding: "8px 12px",
              borderRadius: "var(--radius-sm)",
              fontSize: 12,
              color: "#15803D",
              background: "rgba(21,128,61,0.06)",
              border: "1px solid rgba(21,128,61,0.2)",
            }}
          >
            📱 {selectedCust.phone}
          </div>
        )}

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
          <FormField label="Order Date *" error={errors.poDate}>
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
            {(Object.entries(CYL_LABELS) as [CylSize, string][]).map(
              ([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ),
            )}
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
              placeholder="e.g. 20"
              value={form.orderedQty}
              onChange={(e) => set("orderedQty", e.target.value)}
              style={fieldStyle}
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

        {/* Value preview */}
        {form.orderedQty && form.pricePerUnit && (
          <div
            style={{
              padding: "8px 12px",
              borderRadius: "var(--radius-sm)",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--accent)",
              background: "var(--accent-bg)",
              border: "1px solid var(--accent-border)",
            }}
          >
            Order value:{" "}
            {fmtIDR(Number(form.orderedQty) * Number(form.pricePerUnit))}
          </div>
        )}

        {/* Notes */}
        <FormField label="Notes" error={errors.notes}>
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={2}
            placeholder="e.g. Customer requested delivery before 10am"
            style={{ ...fieldStyle, resize: "vertical" }}
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
            marginTop: 4,
          }}
        >
          <button className="btn-gho" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn-pri" onClick={submit} disabled={saving}>
            {saving ? "Saving…" : "Create Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CPO Detail Panel ─────────────────────────────────────────────────────────
function CpoDetailPanel({
  po,
  onClose,
  onRefresh,
}: {
  po: CpoRow;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [dos, setDos] = useState<DoRow[]>([]);
  const [dosLoading, setDosLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    setDosLoading(true);
    fetch(`/api/delivery-orders?customerPoId=${po.id}&limit=100`)
      .then((r) => r.json())
      .then((d) => setDos(d.rows ?? []))
      .finally(() => setDosLoading(false));
  }, [po.id]);

  async function updateStatus(status: PoStatus) {
    setUpdatingStatus(true);
    await fetch(`/api/customer-pos/${po.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdatingStatus(false);
    onRefresh();
  }

  const totalValue = Number(po.orderedQty) * Number(po.pricePerUnit);
  const pct =
    po.orderedQty > 0 ? Math.round((po.fulfilledQty / po.orderedQty) * 100) : 0;
  const ch = CHANNEL_CFG[po.orderChannel] ?? CHANNEL_CFG.WHATSAPP;

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
        marginBottom: 24,
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
              fontSize: 10,
              color: "var(--text-low)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Customer Order
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 900,
              color: "var(--sidebar)",
              letterSpacing: "-0.02em",
              marginTop: 2,
            }}
          >
            {po.poNumber}
          </div>
          <div
            style={{
              display: "flex",
              gap: 6,
              marginTop: 6,
              alignItems: "center",
            }}
          >
            <StatusBadge status={po.status} />
            <ChannelBadge channel={po.orderChannel} />
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

      {/* Meta grid */}
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
          ["Customer", `${po.customer.name} (${po.customer.code})`],
          ["Phone", po.customer.phone ?? "—"],
          ["Cylinder", CYL_LABELS[po.cylinderSize]],
          ["Ordered", fmt(po.orderedQty) + " units"],
          ["Fulfilled", fmt(po.fulfilledQty) + " / " + fmt(po.orderedQty)],
          ["Price/Unit", fmtIDR(po.pricePerUnit)],
          ["Total Value", fmtIDR(totalValue)],
          ["DOs Issued", po._count.deliveryOrders + " order(s)"],
          ["Created by", po.createdBy.name],
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

      {/* Fulfillment progress bar */}
      {po.orderedQty > 0 && (
        <div
          style={{
            padding: "12px 20px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-mid)",
              marginBottom: 6,
            }}
          >
            <span>Fulfillment Progress</span>
            <span style={{ color: pct === 100 ? "#15803D" : "var(--accent)" }}>
              {pct}%
            </span>
          </div>
          <div
            style={{
              height: 6,
              background: "var(--border)",
              borderRadius: 99,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 99,
                transition: "width 0.4s",
                background: pct === 100 ? "#15803D" : "var(--accent)",
                width: `${pct}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Notes */}
      {po.notes && (
        <div
          style={{
            padding: "10px 20px",
            borderBottom: "1px solid var(--border)",
            fontSize: 12,
            color: "var(--text-mid)",
            fontStyle: "italic",
          }}
        >
          📝 {po.notes}
        </div>
      )}

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
          {po.status === "SUBMITTED" && (
            <button
              className="btn-pri"
              onClick={() => updateStatus("CONFIRMED")}
              disabled={updatingStatus}
              style={{ fontSize: 12 }}
            >
              ✓ Confirm Order
            </button>
          )}
          {(po.status === "CONFIRMED" ||
            po.status === "PARTIALLY_RECEIVED") && (
            <button
              className="btn-pri"
              onClick={() => updateStatus("COMPLETED")}
              disabled={updatingStatus}
              style={{ fontSize: 12, background: "#15803D" }}
            >
              ✓ Mark Completed
            </button>
          )}
          <button
            className="btn-gho"
            onClick={() => updateStatus("CANCELLED")}
            disabled={updatingStatus}
            style={{
              fontSize: 12,
              color: "var(--danger)",
              borderColor: "var(--danger)",
            }}
          >
            Cancel Order
          </button>
        </div>
      )}

      {/* Linked DOs */}
      <div style={{ padding: "14px 20px" }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-low)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 10,
          }}
        >
          Delivery Orders ({dos.length})
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
            No delivery orders issued yet. Go to Delivery Orders to create one.
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
                        fontWeight: d.deliveredQty > 0 ? 700 : 400,
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
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CustomerPurchaseOrdersPage({
  activeBranchId,
}: {
  activeBranchId: string;
}) {
  const [branchId, setBranchId] = useState(activeBranchId);
  const [branches, setBranches] = useState<
    { id: string; code: string; name: string }[]
  >([]);
  const [rows, setRows] = useState<CpoRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<CpoRow | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync branch from parent
  useEffect(() => {
    setBranchId(activeBranchId);
  }, [activeBranchId]);

  useEffect(() => {
    fetch("/api/branches")
      .then((r) => r.json())
      .then(setBranches)
      .catch(() => {});
  }, []);

  const load = useCallback(
    async (opts: {
      branchId: string;
      search: string;
      status: string;
      channel: string;
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
        if (opts.channel) q.set("channel", opts.channel);
        const data = await fetch(`/api/customer-pos?${q}`).then((r) =>
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
    debounce.current = setTimeout(() => {
      load({
        branchId,
        search,
        status: statusFilter,
        channel: channelFilter,
        page,
      });
    }, 250);
  }, [branchId, search, statusFilter, channelFilter, page, load]);

  const pages = Math.ceil(total / 20);

  // Summary counts
  const submitted = rows.filter((r) => r.status === "SUBMITTED").length;
  const confirmed = rows.filter((r) => r.status === "CONFIRMED").length;
  const partial = rows.filter((r) => r.status === "PARTIALLY_RECEIVED").length;

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      {/* Page header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 24,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "var(--text-low)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 4,
            }}
          >
            SSG › Customer Orders
          </div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 900,
              color: "var(--sidebar)",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Customer Purchase Orders
          </h1>
          <p
            style={{
              fontSize: 12,
              color: "var(--text-low)",
              margin: "4px 0 0",
              fontStyle: "italic",
            }}
          >
            Orders received from customers via WhatsApp, phone, walk-in, or
            sales visit
          </p>
        </div>
        <button
          className="btn-pri"
          onClick={() => {
            setShowForm(true);
            setSelected(null);
          }}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          + New Order
        </button>
      </div>

      {/* Summary pills */}
      {submitted + confirmed + partial > 0 && (
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          {submitted > 0 && (
            <div
              style={{
                padding: "6px 14px",
                borderRadius: 99,
                background: "rgba(217,119,6,0.1)",
                border: "1px solid rgba(217,119,6,0.2)",
                fontSize: 12,
                fontWeight: 700,
                color: "#D97706",
              }}
            >
              {submitted} awaiting confirmation
            </div>
          )}
          {confirmed > 0 && (
            <div
              style={{
                padding: "6px 14px",
                borderRadius: 99,
                background: "var(--accent-bg)",
                border: "1px solid var(--accent-border)",
                fontSize: 12,
                fontWeight: 700,
                color: "var(--accent)",
              }}
            >
              {confirmed} confirmed — ready to dispatch
            </div>
          )}
          {partial > 0 && (
            <div
              style={{
                padding: "6px 14px",
                borderRadius: 99,
                background: "rgba(124,58,237,0.1)",
                border: "1px solid rgba(124,58,237,0.2)",
                fontSize: 12,
                fontWeight: 700,
                color: "#7C3AED",
              }}
            >
              {partial} partially fulfilled
            </div>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          padding: "12px 16px",
        }}
      >
        {/* Branch */}
        <select
          value={branchId}
          onChange={(e) => {
            setBranchId(e.target.value);
            setPage(1);
          }}
          style={{ ...fieldStyle, maxWidth: 160 }}
        >
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        {/* Search */}
        <input
          placeholder="Search PO #, customer…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ ...fieldStyle, maxWidth: 220 }}
        />

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          style={{ ...fieldStyle, maxWidth: 150 }}
        >
          <option value="">All Statuses</option>
          {(
            Object.entries(STATUS_CFG) as [
              PoStatus,
              (typeof STATUS_CFG)[PoStatus],
            ][]
          ).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>

        {/* Channel filter */}
        <select
          value={channelFilter}
          onChange={(e) => {
            setChannelFilter(e.target.value);
            setPage(1);
          }}
          style={{ ...fieldStyle, maxWidth: 150 }}
        >
          <option value="">All Channels</option>
          {(
            Object.entries(CHANNEL_CFG) as [
              OrderChannel,
              (typeof CHANNEL_CFG)[OrderChannel],
            ][]
          ).map(([k, v]) => (
            <option key={k} value={k}>
              {v.icon} {v.label}
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
      {showForm && (
        <CreateCpoForm
          branchId={branchId}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load({
              branchId,
              search,
              status: statusFilter,
              channel: channelFilter,
              page,
            });
          }}
        />
      )}

      {/* Detail panel */}
      {selected && (
        <CpoDetailPanel
          po={selected}
          onClose={() => setSelected(null)}
          onRefresh={() => {
            load({
              branchId,
              search,
              status: statusFilter,
              channel: channelFilter,
              page,
            });
            fetch(`/api/customer-pos/${selected.id}`)
              .then((r) => r.json())
              .then(setSelected);
          }}
        />
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
                "Customer",
                "Channel",
                "Size",
                "Ordered",
                "Fulfilled",
                "Value",
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
                  {Array.from({ length: 10 }).map((_, j) => (
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
                  colSpan={10}
                  style={{
                    padding: "60px 0",
                    textAlign: "center",
                    color: "var(--text-low)",
                    fontSize: 13,
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                  No customer orders yet.{" "}
                  <span
                    style={{
                      color: "var(--accent)",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                    onClick={() => setShowForm(true)}
                  >
                    Create one
                  </span>
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const pct =
                  r.orderedQty > 0
                    ? Math.round((r.fulfilledQty / r.orderedQty) * 100)
                    : 0;
                const ch = CHANNEL_CFG[r.orderChannel] ?? CHANNEL_CFG.WHATSAPP;
                return (
                  <tr
                    key={r.id}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      cursor: "pointer",
                      background:
                        selected?.id === r.id ? "rgba(37,99,235,0.04)" : "",
                    }}
                    onClick={() =>
                      setSelected(selected?.id === r.id ? null : r)
                    }
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
                      <div
                        style={{
                          fontWeight: 600,
                          color: "var(--text-hi)",
                          fontSize: 13,
                        }}
                      >
                        {r.customer.name}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--text-low)",
                          fontFamily: "monospace",
                        }}
                      >
                        {r.customer.code}
                      </div>
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{ fontSize: 13 }}>{ch.icon}</span>{" "}
                      <span
                        style={{
                          fontSize: 11,
                          color: ch.color,
                          fontWeight: 600,
                        }}
                      >
                        {ch.label}
                      </span>
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      {CYL_LABELS[r.cylinderSize]}
                    </td>
                    <td style={{ padding: "11px 14px", fontWeight: 600 }}>
                      {fmt(r.orderedQty)}
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            width: 48,
                            height: 4,
                            background: "var(--border)",
                            borderRadius: 99,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              background:
                                pct === 100 ? "#15803D" : "var(--accent)",
                              width: `${pct}%`,
                              borderRadius: 99,
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            color: pct === 100 ? "#15803D" : "var(--text-mid)",
                            fontWeight: 600,
                          }}
                        >
                          {fmt(r.fulfilledQty)}/{fmt(r.orderedQty)}
                        </span>
                      </div>
                    </td>
                    <td
                      style={{ padding: "11px 14px", color: "var(--text-mid)" }}
                    >
                      {fmtIDR(Number(r.pricePerUnit) * r.orderedQty)}
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
                );
              })
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
