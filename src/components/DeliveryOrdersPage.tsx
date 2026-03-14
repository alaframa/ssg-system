"use client";

// src/components/DeliveryOrdersPage.tsx
// Sprint 3 — Delivery Orders (SSG → Customer)
// Rule: A DO cannot exist without a PO. PO must be CONFIRMED or above.

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type CylSize = "KG3" | "KG5_5" | "KG12" | "KG50";
type DoStatus =
  | "PENDING"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "PARTIAL"
  | "CANCELLED";
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

const DO_STATUS_CFG: Record<
  DoStatus,
  { label: string; color: string; bg: string }
> = {
  PENDING: { label: "Pending", color: "#D97706", bg: "rgba(217,119,6,0.1)" },
  IN_TRANSIT: {
    label: "In Transit",
    color: "#2563EB",
    bg: "rgba(37,99,235,0.1)",
  },
  DELIVERED: {
    label: "Delivered",
    color: "#15803D",
    bg: "rgba(21,128,61,0.1)",
  },
  PARTIAL: { label: "Partial", color: "#7C3AED", bg: "rgba(124,58,237,0.1)" },
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
interface Customer {
  id: string;
  code: string;
  name: string;
}
interface PoOption {
  id: string;
  poNumber: string;
  cylinderSize: CylSize;
  orderedQty: number;
  receivedQty: number;
  status: PoStatus;
  branch: Branch;
}
interface DoRow {
  id: string;
  doNumber: string;
  doDate: string;
  cylinderSize: CylSize;
  orderedQty: number;
  deliveredQty: number;
  pricePerUnit: string;
  status: DoStatus;
  driverName: string | null;
  vehicleNo: string | null;
  notes: string | null;
  deliveredAt: string | null;
  branch: Branch;
  customer: Customer;
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

function StatusBadge({ status }: { status: DoStatus }) {
  const cfg = DO_STATUS_CFG[status] ?? DO_STATUS_CFG.PENDING;
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

// ─── Create DO Form ───────────────────────────────────────────────────────────
function CreateDoForm({
  branchId,
  onClose,
  onSaved,
}: {
  branchId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [poOptions, setPoOptions] = useState<PoOption[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [poLoading, setPoLoading] = useState(true);
  const [form, setForm] = useState({
    poId: "",
    customerId: "",
    doNumber: `DO-${Date.now()}`,
    doDate: today(),
    cylinderSize: "KG12" as CylSize,
    orderedQty: "",
    pricePerUnit: "175500",
    driverName: "",
    vehicleNo: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Load POs that can issue DOs (not cancelled, not completed fully)
  useEffect(() => {
    setPoLoading(true);
    Promise.all([
      fetch(`/api/purchase-orders?branchId=${branchId}&limit=200`).then((r) =>
        r.json(),
      ),
      fetch(`/api/customers?branch=${branchId}&limit=500`).then((r) =>
        r.json(),
      ),
    ])
      .then(([pd, cd]) => {
        const validPos = (pd.rows ?? []).filter(
          (p: PoOption) => p.status !== "CANCELLED",
        );
        setPoOptions(validPos);
        setCustomers(cd.customers ?? []);
      })
      .finally(() => setPoLoading(false));
  }, [branchId]);

  // Auto-fill cylinderSize and price from selected PO
  useEffect(() => {
    const po = poOptions.find((p) => p.id === form.poId);
    if (po) {
      const prices: Record<CylSize, string> = {
        KG3: "52500",
        KG5_5: "96250",
        KG12: "175500",
        KG50: "604700",
      };
      setForm((f) => ({
        ...f,
        cylinderSize: po.cylinderSize,
        pricePerUnit: prices[po.cylinderSize],
      }));
    }
  }, [form.poId, poOptions]);

  const selectedPo = poOptions.find((p) => p.id === form.poId);

  async function submit() {
    setSaving(true);
    setErrors({});
    try {
      const res = await fetch("/api/delivery-orders", {
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

  const remainingQty = selectedPo
    ? selectedPo.orderedQty - selectedPo.receivedQty
    : null;

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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-hi)" }}>
          New Delivery Order
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

      {/* PO selection — mandatory */}
      <div
        style={{
          background: "rgba(37,99,235,0.04)",
          border: "1px solid rgba(37,99,235,0.2)",
          borderRadius: "var(--radius-sm)",
          padding: "12px 14px",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--accent)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 8,
          }}
        >
          📋 Required: Link to Purchase Order
        </div>
        <FormField label="Purchase Order *" error={errors.poId}>
          {poLoading ? (
            <div style={{ ...fieldStyle, color: "var(--text-low)" }}>
              Loading POs…
            </div>
          ) : (
            <select
              value={form.poId}
              onChange={(e) => set("poId", e.target.value)}
              style={fieldStyle}
            >
              <option value="">— Select a PO —</option>
              {poOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.poNumber} · {CYL_LABELS[p.cylinderSize]} ×{" "}
                  {fmt(p.orderedQty)} · {p.status}
                </option>
              ))}
            </select>
          )}
        </FormField>
        {selectedPo && (
          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              color: "var(--text-mid)",
              display: "flex",
              gap: 16,
            }}
          >
            <span>
              Size: <b>{CYL_LABELS[selectedPo.cylinderSize]}</b>
            </span>
            <span>
              Ordered: <b>{fmt(selectedPo.orderedQty)}</b>
            </span>
            <span>
              Delivered so far: <b>{fmt(selectedPo.receivedQty)}</b>
            </span>
            <span style={{ color: remainingQty! > 0 ? "#15803D" : "#DC2626" }}>
              Remaining: <b>{fmt(remainingQty!)}</b>
            </span>
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <FormField label="Customer *" error={errors.customerId}>
          <select
            value={form.customerId}
            onChange={(e) => set("customerId", e.target.value)}
            style={fieldStyle}
          >
            <option value="">— Select customer —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </FormField>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <FormField label="DO Number *" error={errors.doNumber}>
            <input
              value={form.doNumber}
              onChange={(e) => set("doNumber", e.target.value)}
              style={fieldStyle}
            />
          </FormField>
          <FormField label="DO Date *" error={errors.doDate}>
            <input
              type="date"
              value={form.doDate}
              onChange={(e) => set("doDate", e.target.value)}
              style={fieldStyle}
            />
          </FormField>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 12,
          }}
        >
          <FormField label="Cylinder Size" error={errors.cylinderSize}>
            <select
              value={form.cylinderSize}
              onChange={(e) => set("cylinderSize", e.target.value)}
              style={fieldStyle}
              disabled={!!selectedPo}
            >
              {(Object.keys(CYL_LABELS) as CylSize[]).map((s) => (
                <option key={s} value={s}>
                  {CYL_LABELS[s]}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Qty to Deliver *" error={errors.orderedQty}>
            <input
              type="number"
              min={1}
              max={remainingQty ?? undefined}
              value={form.orderedQty}
              onChange={(e) => set("orderedQty", e.target.value)}
              style={fieldStyle}
            />
          </FormField>
          <FormField label="Price / Unit (IDR)" error={errors.pricePerUnit}>
            <input
              type="number"
              min={0}
              value={form.pricePerUnit}
              onChange={(e) => set("pricePerUnit", e.target.value)}
              style={fieldStyle}
            />
          </FormField>
        </div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <FormField label="Driver Name" error={errors.driverName}>
            <input
              value={form.driverName}
              onChange={(e) => set("driverName", e.target.value)}
              style={fieldStyle}
              placeholder="e.g. RUDI/WAHYU"
            />
          </FormField>
          <FormField label="Vehicle No" error={errors.vehicleNo}>
            <input
              value={form.vehicleNo}
              onChange={(e) => set("vehicleNo", e.target.value)}
              style={fieldStyle}
              placeholder="e.g. L1234AB"
            />
          </FormField>
        </div>
        <FormField label="Notes (optional)" error={errors.notes}>
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={2}
            style={{ ...fieldStyle, resize: "vertical" }}
          />
        </FormField>
        {errors._ && (
          <div style={{ color: "var(--danger)", fontSize: 12 }}>{errors._}</div>
        )}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          marginTop: 20,
        }}
      >
        <button className="btn-gho" onClick={onClose} disabled={saving}>
          Cancel
        </button>
        <button
          className="btn-pri"
          onClick={submit}
          disabled={saving || !form.poId}
        >
          {saving ? "Saving…" : "Issue DO"}
        </button>
      </div>
    </div>
  );
}

// ─── DO Detail Drawer ─────────────────────────────────────────────────────────
function DoDrawer({
  do: doRow,
  onClose,
  onRefresh,
}: {
  do: DoRow;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [updating, setUpdating] = useState(false);
  const [deliveredQty, setDeliveredQty] = useState(String(doRow.deliveredQty));
  const [error, setError] = useState("");

  // Extract linked PO info from notes
  const poId = doRow.notes?.match(/^po:(\S+)/m)?.[1] ?? null;
  const displayNotes = doRow.notes?.replace(/^po:\S+\n?/m, "").trim() || null;

  async function updateStatus(status: DoStatus) {
    setUpdating(true);
    setError("");
    try {
      const body: Record<string, unknown> = { status };
      if (status === "DELIVERED" || status === "PARTIAL") {
        body.deliveredQty = Number(deliveredQty);
      }
      const res = await fetch(`/api/delivery-orders/${doRow.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed.");
        return;
      }
      onRefresh();
    } finally {
      setUpdating(false);
    }
  }

  const value = Number(doRow.orderedQty) * Number(doRow.pricePerUnit);

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-header">
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--text-low)",
              }}
            >
              Delivery Order
            </div>
            <div
              style={{ fontSize: 18, fontWeight: 900, color: "var(--sidebar)" }}
            >
              {doRow.doNumber}
            </div>
            <div style={{ marginTop: 6 }}>
              <StatusBadge status={doRow.status} />
            </div>
          </div>
          <button className="drawer-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="drawer-section">
          <div className="drawer-section-label">Details</div>
          {[
            ["Date", new Date(doRow.doDate).toLocaleDateString("id-ID")],
            ["Branch", doRow.branch.name],
            ["Customer", doRow.customer.name],
            ["Cylinder", CYL_LABELS[doRow.cylinderSize]],
            ["Ordered", fmt(doRow.orderedQty) + " units"],
            ["Delivered", fmt(doRow.deliveredQty) + " units"],
            ["Price/Unit", fmtIDR(doRow.pricePerUnit)],
            ["Value", fmtIDR(value)],
            ["Driver", doRow.driverName ?? "—"],
            ["Vehicle", doRow.vehicleNo ?? "—"],
            ...(poId ? [["Linked PO", poId.slice(0, 20) + "…"]] : []),
            ...(doRow.deliveredAt
              ? [
                  [
                    "Delivered At",
                    new Date(doRow.deliveredAt).toLocaleDateString("id-ID"),
                  ],
                ]
              : []),
          ].map(([k, v]) => (
            <div key={k as string} className="drawer-row">
              <span className="drawer-key">{k}</span>
              <span className="drawer-val">{v}</span>
            </div>
          ))}
          {displayNotes && (
            <div
              style={{
                fontSize: 12,
                color: "var(--text-mid)",
                fontStyle: "italic",
                marginTop: 4,
              }}
            >
              Note: {displayNotes}
            </div>
          )}
        </div>

        {/* Status actions */}
        {doRow.status !== "DELIVERED" && doRow.status !== "CANCELLED" && (
          <div className="drawer-section">
            <div className="drawer-section-label">Update Status</div>

            {(doRow.status === "IN_TRANSIT" || doRow.status === "PENDING") && (
              <FormField label="Delivered Qty" error={undefined}>
                <input
                  type="number"
                  min={0}
                  max={doRow.orderedQty}
                  value={deliveredQty}
                  onChange={(e) => setDeliveredQty(e.target.value)}
                  style={{ ...fieldStyle, marginBottom: 8 }}
                />
              </FormField>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {doRow.status === "PENDING" && (
                <button
                  className="btn-pri"
                  onClick={() => updateStatus("IN_TRANSIT")}
                  disabled={updating}
                >
                  🚚 Mark In Transit
                </button>
              )}
              {(doRow.status === "PENDING" ||
                doRow.status === "IN_TRANSIT") && (
                <>
                  <button
                    className="btn-pri"
                    style={{ background: "#15803D" }}
                    onClick={() => updateStatus("DELIVERED")}
                    disabled={updating}
                  >
                    ✓ Mark Delivered
                  </button>
                  <button
                    className="btn-gho"
                    onClick={() => updateStatus("PARTIAL")}
                    disabled={updating}
                  >
                    ⚡ Mark Partial
                  </button>
                </>
              )}
              <button
                className="btn-gho"
                style={{ color: "var(--danger)" }}
                onClick={() => updateStatus("CANCELLED")}
                disabled={updating}
              >
                ✕ Cancel DO
              </button>
            </div>
            {error && (
              <div
                style={{ fontSize: 12, color: "var(--danger)", marginTop: 8 }}
              >
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DeliveryOrdersPage({
  activeBranchId,
}: {
  activeBranchId: string;
}) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState(activeBranchId);
  const [rows, setRows] = useState<DoRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<DoRow | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/branches")
      .then((r) => r.json())
      .then(setBranches);
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
        const data = await fetch(`/api/delivery-orders?${q}`).then((r) =>
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

  useEffect(() => {
    setBranchId(activeBranchId);
  }, [activeBranchId]);

  const pages = Math.ceil(total / 20);

  return (
    <div style={{ fontFamily: "var(--font-sans)" }}>
      {/* Drawer */}
      {selected && (
        <DoDrawer
          do={selected}
          onClose={() => setSelected(null)}
          onRefresh={() => {
            setSelected(null);
            load({ branchId, search, status: statusFilter, page });
          }}
        />
      )}

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
          <span style={{ color: "var(--accent)" }}>DELIVERY ORDERS</span>
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
              Delivery Orders
            </div>
            <div
              style={{ fontSize: 11, color: "var(--text-mid)", marginTop: 4 }}
            >
              SSG → Customer · Requires PO
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
              + Issue DO
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input
          placeholder="Search DO / customer / driver…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{ ...fieldStyle, maxWidth: 300 }}
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
          {(Object.keys(DO_STATUS_CFG) as DoStatus[]).map((s) => (
            <option key={s} value={s}>
              {DO_STATUS_CFG[s].label}
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
        <CreateDoForm
          branchId={branchId}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load({ branchId, search, status: statusFilter, page });
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
                "DO Number",
                "Date",
                "Customer",
                "Size",
                "Ordered",
                "Delivered",
                "Driver",
                "Value",
                "Status",
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
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🚚</div>No
                  delivery orders yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.id}
                  style={{
                    borderBottom: "1px solid var(--border)",
                    cursor: "pointer",
                  }}
                  onClick={() => setSelected(r)}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      "var(--bg)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background = "")
                  }
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
                    {r.doNumber}
                  </td>
                  <td
                    style={{ padding: "11px 14px", color: "var(--text-mid)" }}
                  >
                    {new Date(r.doDate).toLocaleDateString("id-ID")}
                  </td>
                  <td
                    style={{
                      padding: "11px 14px",
                      color: "var(--text-hi)",
                      maxWidth: 180,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.customer.name}
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    {CYL_LABELS[r.cylinderSize]}
                  </td>
                  <td style={{ padding: "11px 14px", fontWeight: 600 }}>
                    {fmt(r.orderedQty)}
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <span
                      style={{
                        color:
                          r.deliveredQty === r.orderedQty
                            ? "#15803D"
                            : r.deliveredQty > 0
                              ? "#7C3AED"
                              : "var(--text-low)",
                        fontWeight: 600,
                      }}
                    >
                      {fmt(r.deliveredQty)}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "11px 14px",
                      color: "var(--text-mid)",
                      fontSize: 12,
                    }}
                  >
                    {r.driverName ?? "—"}
                  </td>
                  <td
                    style={{ padding: "11px 14px", color: "var(--text-mid)" }}
                  >
                    {fmtIDR(Number(r.pricePerUnit) * r.orderedQty)}
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <StatusBadge status={r.status} />
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
