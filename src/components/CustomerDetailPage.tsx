"use client";

import { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Branch {
  id: string;
  code: string;
  name: string;
}
interface CylinderHolding {
  id: string;
  cylinderSize: "KG3" | "KG5_5" | "KG12" | "KG50";
  heldQty: number;
  depositPerUnit: string;
  lastUpdated: string;
}
interface CustomerDetail {
  id: string;
  code: string;
  name: string;
  customerType: "RETAIL" | "AGEN" | "INDUSTRI";
  phone: string | null;
  email: string | null;
  address: string | null;
  npwp: string | null;
  creditLimit: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  branch: Branch;
  cylinderHoldings: CylinderHolding[];
  _count: {
    deliveryOrders: number;
    gasbackLedgers: number;
    gasbackClaims: number;
  };
}

// ─── Design tokens (light theme) ─────────────────────────────────────────────
const TYPE_META = {
  RETAIL: {
    label: "Retail",
    text: "#2563EB",
    bg: "rgba(37,99,235,0.08)",
    border: "rgba(37,99,235,0.2)",
  },
  AGEN: {
    label: "Agen",
    text: "#D97706",
    bg: "rgba(217,119,6,0.08)",
    border: "rgba(217,119,6,0.2)",
  },
  INDUSTRI: {
    label: "Industri",
    text: "#7C3AED",
    bg: "rgba(124,58,237,0.08)",
    border: "rgba(124,58,237,0.2)",
  },
} as const;

const CYL_META = {
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
} as const;

const CYL_ORDER = ["KG3", "KG5_5", "KG12", "KG50"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtIDR = (v: string | number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(v));

const fmtDateTime = (d: string) =>
  new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

// ─── Sub-components ───────────────────────────────────────────────────────────
function Field({
  label,
  children,
  accent,
  muted,
}: {
  label: string;
  children: React.ReactNode;
  accent?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="cd-row">
      <span className="cd-key">{label}</span>
      <span
        className="cd-val"
        style={
          accent
            ? { color: "#2563EB" }
            : muted
              ? { color: "#9CA3AF", fontSize: 10 }
              : undefined
        }
      >
        {children ?? (
          <span style={{ color: "#D1D5DB", fontStyle: "italic" }}>—</span>
        )}
      </span>
    </div>
  );
}

function Card({
  title,
  icon,
  extra,
  children,
}: {
  title: string;
  icon: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="cd-card">
      <div className="cd-card-hd">
        <span className="cd-card-ic">{icon}</span>
        <span className="cd-card-tl">{title}</span>
        {extra && <span style={{ marginLeft: "auto" }}>{extra}</span>}
      </div>
      <div className="cd-card-bd">{children}</div>
    </div>
  );
}

function CylCard({ h }: { h: CylinderHolding }) {
  const m = CYL_META[h.cylinderSize];
  const total = Number(h.depositPerUnit) * h.heldQty;
  const pct = Math.min(h.heldQty, 100);
  return (
    <div className="cd-cyl-card" style={{ borderColor: m.border }}>
      <div className="cd-cyl-r1">
        <span
          className="cd-cyl-badge"
          style={{ color: m.text, borderColor: m.border, background: m.bg }}
        >
          {m.label}
        </span>
        <span
          className="cd-cyl-qty"
          style={{ color: h.heldQty > 0 ? m.text : "#9CA3AF" }}
        >
          {h.heldQty}
          <span className="cd-cyl-unit">tbg</span>
        </span>
      </div>
      <div className="cd-cyl-track">
        <div
          className="cd-cyl-fill"
          style={{
            width: `${pct}%`,
            background: m.text,
            opacity: h.heldQty > 0 ? 1 : 0.15,
          }}
        />
      </div>
      <div className="cd-cyl-ft">
        <div>
          <div className="cd-cyl-mk">Deposit / unit</div>
          <div className="cd-cyl-mv">{fmtIDR(h.depositPerUnit)}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="cd-cyl-mk">Total deposit</div>
          <div className="cd-cyl-mv" style={{ color: "#15803D" }}>
            {fmtIDR(total)}
          </div>
        </div>
      </div>
      <div className="cd-cyl-up">Updated {fmtDate(h.lastUpdated)}</div>
    </div>
  );
}

function EditModal({
  c,
  onClose,
  onSaved,
}: {
  c: CustomerDetail;
  onClose: () => void;
  onSaved: (u: CustomerDetail) => void;
}) {
  const [form, setForm] = useState({
    name: c.name,
    customerType: c.customerType as string,
    phone: c.phone ?? "",
    email: c.email ?? "",
    address: c.address ?? "",
    npwp: c.npwp ?? "",
    creditLimit: c.creditLimit,
    isActive: c.isActive,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/customers/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      onSaved({ ...c, ...(await res.json()) });
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="cd-ov" onClick={onClose} />
      <div className="cd-modal">
        <div className="cd-mhd">
          <div className="cd-mtitle">Edit Customer</div>
          <button className="cd-mclose" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="cd-mbdy">
          <div className="cd-fld">
            <label className="cd-flbl">Customer Type</label>
            <select
              className="cd-inp"
              value={form.customerType}
              onChange={(e) => set("customerType", e.target.value)}
            >
              <option value="RETAIL">Retail</option>
              <option value="AGEN">Agen</option>
              <option value="INDUSTRI">Industri</option>
            </select>
          </div>

          {(
            [
              { label: "Full Name", key: "name" },
              { label: "Phone", key: "phone" },
              { label: "Email", key: "email", type: "email" },
              { label: "NPWP", key: "npwp" },
              { label: "Credit Limit", key: "creditLimit", type: "number" },
            ] as const
          ).map(({ label, key, type }) => (
            <div key={key} className="cd-fld">
              <label className="cd-flbl">{label}</label>
              <input
                type={type ?? "text"}
                className="cd-inp"
                value={String(form[key as keyof typeof form])}
                onChange={(e) => set(key, e.target.value)}
              />
            </div>
          ))}

          <div className="cd-fld">
            <label className="cd-flbl">Address</label>
            <textarea
              className="cd-inp"
              rows={3}
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              style={{ resize: "vertical" }}
            />
          </div>

          <div className="cd-fld">
            <label className="cd-flbl">Status</label>
            <div className="cd-tog-row">
              {([true, false] as const).map((v) => (
                <button
                  key={String(v)}
                  className="cd-tog"
                  onClick={() => set("isActive", v)}
                  style={{
                    background:
                      form.isActive === v
                        ? v
                          ? "rgba(21,128,61,0.08)"
                          : "rgba(220,38,38,0.08)"
                        : "transparent",
                    borderColor:
                      form.isActive === v
                        ? v
                          ? "#15803D"
                          : "#DC2626"
                        : "#E5E7EB",
                    color:
                      form.isActive === v
                        ? v
                          ? "#15803D"
                          : "#DC2626"
                        : "#9CA3AF",
                  }}
                >
                  {v ? "● Active" : "○ Inactive"}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="cd-err">⚠ {error}</div>}
        </div>

        <div className="cd-mfoot">
          <button className="btn-gho" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn-pri" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CustomerDetailPage({
  customerId,
  onBack,
}: {
  customerId: string;
  onBack: () => void;
}) {
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`/api/customers/${customerId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setCustomer)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [customerId]);

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 320,
          color: "#9CA3AF",
          fontSize: 13,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, opacity: 0.2, marginBottom: 12 }}>👥</div>
          <div>Loading customer…</div>
        </div>
      </div>
    );

  if (error || !customer)
    return (
      <div
        style={{
          padding: 20,
          background: "rgba(220,38,38,0.06)",
          border: "1px solid rgba(220,38,38,0.2)",
          borderRadius: 10,
          color: "#DC2626",
          fontSize: 13,
        }}
      >
        ⚠ {error || "Customer not found"}
      </div>
    );

  const tm = TYPE_META[customer.customerType];
  const sortedHold = [...customer.cylinderHoldings].sort(
    (a, b) =>
      CYL_ORDER.indexOf(a.cylinderSize) - CYL_ORDER.indexOf(b.cylinderSize),
  );
  const totalHeld = customer.cylinderHoldings.reduce(
    (s, h) => s + h.heldQty,
    0,
  );
  const totalDeposit = customer.cylinderHoldings.reduce(
    (s, h) => s + Number(h.depositPerUnit) * h.heldQty,
    0,
  );

  return (
    <div className="cd">
      {/* Breadcrumb */}
      <div className="cd-nav">
        <button className="cd-back" onClick={onBack}>
          ← Back
        </button>
        <div className="cd-crumb">
          <span>Customers</span>
          <span style={{ opacity: 0.4 }}>›</span>
          <span className="cd-crumb-cur">{customer.name}</span>
        </div>
      </div>

      {/* Hero */}
      <div className="cd-hero">
        <div className="cd-avatar">{customer.name.charAt(0).toUpperCase()}</div>
        <div className="cd-hero-body">
          <div className="cd-name">{customer.name}</div>
          <div className="cd-code">{customer.code}</div>
          <div className="cd-chips">
            <span
              className="chip"
              style={{
                color: tm.text,
                borderColor: tm.border,
                background: tm.bg,
              }}
            >
              {tm.label}
            </span>
            <span
              className="chip"
              style={{
                color: customer.isActive ? "#15803D" : "#9CA3AF",
                borderColor: customer.isActive
                  ? "rgba(21,128,61,0.25)"
                  : "#E5E7EB",
                background: customer.isActive
                  ? "rgba(21,128,61,0.07)"
                  : "transparent",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: customer.isActive ? "#15803D" : "#D1D5DB",
                  display: "inline-block",
                }}
              />
              {customer.isActive ? "Active" : "Inactive"}
            </span>
            <span style={{ fontSize: 12, color: "#64748B", fontWeight: 500 }}>
              {customer.branch.name}
            </span>
          </div>
        </div>
        <div className="cd-actions">
          <button className="btn-pri" onClick={() => setEditing(true)}>
            ✎ Edit
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="cd-stats">
        {[
          {
            label: "Delivery Orders",
            value: customer._count.deliveryOrders,
            color: "#2563EB",
          },
          {
            label: "Gasback Txns",
            value: customer._count.gasbackLedgers,
            color: "#D97706",
          },
          {
            label: "Gasback Claims",
            value: customer._count.gasbackClaims,
            color: "#7C3AED",
          },
          { label: "Cylinders Held", value: totalHeld, color: "#15803D" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="cd-stat"
            style={{
              borderColor: color + "30",
              borderTop: `3px solid ${color}`,
            }}
          >
            <div className="cd-stat-v" style={{ color }}>
              {value}
            </div>
            <div className="cd-stat-l">{label}</div>
          </div>
        ))}
        <div
          className="cd-stat"
          style={{
            borderColor: "#15803D30",
            borderTop: "3px solid #15803D",
            gridColumn: "span 2",
          }}
        >
          <div className="cd-stat-v" style={{ color: "#15803D", fontSize: 18 }}>
            {fmtIDR(totalDeposit)}
          </div>
          <div className="cd-stat-l">Total Cylinder Deposit</div>
        </div>
      </div>

      {/* Detail grid */}
      <div className="cd-grid">
        <Card title="Identity" icon="🪪">
          <Field label="Customer Code" accent>
            {customer.code}
          </Field>
          <Field label="Full Name">{customer.name}</Field>
          <Field label="Type">
            <span
              className="chip"
              style={{
                color: tm.text,
                borderColor: tm.border,
                background: tm.bg,
              }}
            >
              {tm.label}
            </span>
          </Field>
          <Field label="Branch">{customer.branch.name}</Field>
          <Field label="Status">
            <span
              style={{
                color: customer.isActive ? "#15803D" : "#9CA3AF",
                fontWeight: 600,
              }}
            >
              {customer.isActive ? "● Active" : "○ Inactive"}
            </span>
          </Field>
        </Card>

        <Card title="Contact Information" icon="📞">
          <Field label="Phone">{customer.phone}</Field>
          <Field label="Email">{customer.email}</Field>
          <Field label="Address">{customer.address}</Field>
          <Field label="NPWP" accent>
            {customer.npwp}
          </Field>
        </Card>

        <Card title="Financial" icon="💳">
          <Field label="Credit Limit">
            <span style={{ color: "#15803D", fontWeight: 700 }}>
              {fmtIDR(customer.creditLimit)}
            </span>
          </Field>
          <Field label="Total Deposit">
            <span style={{ color: "#15803D", fontWeight: 700 }}>
              {fmtIDR(totalDeposit)}
            </span>
          </Field>
        </Card>

        <Card title="System" icon="⚙️">
          <Field label="Customer ID" muted>
            {customer.id}
          </Field>
          <Field label="Created At">{fmtDateTime(customer.createdAt)}</Field>
          <Field label="Last Updated">{fmtDateTime(customer.updatedAt)}</Field>
        </Card>

        {/* Cylinder Holdings */}
        <div className="cd-cyl">
          <div className="cd-card-hd">
            <span className="cd-card-ic">🛢️</span>
            <span className="cd-card-tl">
              Cylinder Holdings (Tabung Dipegang)
            </span>
            {totalHeld > 0 && (
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 11,
                  color: "#15803D",
                  fontWeight: 600,
                }}
              >
                {totalHeld} tabung · {fmtIDR(totalDeposit)}
              </span>
            )}
          </div>
          {sortedHold.length === 0 ? (
            <div className="cd-cyl-empty">
              <div style={{ fontSize: 28, opacity: 0.2, marginBottom: 8 }}>
                🛢️
              </div>
              <div>No cylinder holdings recorded</div>
              <div style={{ fontSize: 11, marginTop: 4, color: "#D1D5DB" }}>
                Holdings are auto-populated from delivery orders
              </div>
            </div>
          ) : (
            <div className="cd-cyl-grid">
              {sortedHold.map((h) => (
                <CylCard key={h.id} h={h} />
              ))}
            </div>
          )}
        </div>
      </div>

      {editing && (
        <EditModal
          c={customer}
          onClose={() => setEditing(false)}
          onSaved={(u) => {
            setCustomer(u);
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}
