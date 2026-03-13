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

// ─── Constants ────────────────────────────────────────────────────────────────
const TYPE_META = {
  RETAIL: { label: "Retail", color: "#5b9bd5" },
  AGEN: { label: "Agen", color: "#e2b14a" },
  INDUSTRI: { label: "Industri", color: "#c97cd4" },
} as const;

const CYL_META = {
  KG3: { label: "3 Kg", color: "#6dbf8c" },
  KG5_5: { label: "5.5 Kg", color: "#5b9bd5" },
  KG12: { label: "12 Kg", color: "#e2b14a" },
  KG50: { label: "50 Kg", color: "#c97cd4" },
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

// ─── CSS ──────────────────────────────────────────────────────────────────────
const PAGE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,400;0,500;1,400&family=Syne:wght@600;700;800&display=swap');

.cd { display:flex; flex-direction:column; gap:20px; font-family:'DM Mono',monospace; animation:cd-in 0.2s ease; }
@keyframes cd-in { from{opacity:0;transform:translateY(7px)} to{opacity:1;transform:translateY(0)} }

/* nav */
.cd-nav { display:flex; align-items:center; gap:10px; }
.cd-back {
  display:flex; align-items:center; gap:6px;
  background:#1f2640; border:1px solid rgba(255,255,255,0.07);
  border-radius:7px; padding:7px 13px; color:#8a96a8;
  font-family:'DM Mono',monospace; font-size:11px; letter-spacing:0.05em;
  cursor:pointer; transition:all 0.14s;
}
.cd-back:hover { background:#262d45; color:#d8dff0; }
.cd-crumb { font-size:11px; letter-spacing:0.07em; text-transform:uppercase; color:#505a72; display:flex; align-items:center; gap:7px; }
.cd-crumb-cur { color:#d8dff0; font-weight:500; text-transform:none; letter-spacing:0; }

/* hero */
.cd-hero {
  background:#1f2640; border:1px solid rgba(255,255,255,0.07); border-radius:14px;
  padding:26px 28px; display:flex; gap:18px; flex-wrap:wrap; align-items:flex-start;
  position:relative; overflow:hidden;
}
.cd-hero::before {
  content:''; position:absolute; top:0; left:0; right:0; height:2px;
  background:linear-gradient(90deg,#e2b14a,rgba(226,177,74,0.2) 70%,transparent);
}
.cd-avatar {
  width:58px; height:58px; border-radius:13px; flex-shrink:0;
  background:rgba(226,177,74,0.1); border:1px solid rgba(226,177,74,0.22);
  display:flex; align-items:center; justify-content:center;
  font-family:'Syne',sans-serif; font-size:24px; font-weight:800; color:#e2b14a;
}
.cd-hero-body { flex:1; min-width:0; }
.cd-name { font-family:'Syne',sans-serif; font-size:21px; font-weight:800; color:#d8dff0; line-height:1.2; word-break:break-word; }
.cd-code { font-size:11px; color:#e2b14a; letter-spacing:0.1em; margin-top:5px; }
.cd-chips { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-top:12px; }
.chip { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:5px; font-size:10px; letter-spacing:0.09em; text-transform:uppercase; font-weight:500; border:1px solid; }
.cd-actions { display:flex; gap:8px; align-items:flex-start; flex-shrink:0; }

/* buttons */
.btn-pri {
  display:flex; align-items:center; gap:6px;
  background:#e2b14a; border:none; border-radius:8px; padding:8px 16px;
  color:#111520; font-family:'DM Mono',monospace; font-size:11px; font-weight:500;
  letter-spacing:0.05em; cursor:pointer; transition:all 0.15s; white-space:nowrap;
}
.btn-pri:hover { background:#d0a33c; }
.btn-pri:disabled { opacity:0.5; cursor:not-allowed; }
.btn-gho {
  display:flex; align-items:center; gap:6px;
  background:transparent; border:1px solid rgba(255,255,255,0.1); border-radius:8px;
  padding:8px 16px; color:#8a96a8; font-family:'DM Mono',monospace;
  font-size:11px; letter-spacing:0.05em; cursor:pointer; transition:all 0.15s; white-space:nowrap;
}
.btn-gho:hover { background:#262d45; color:#d8dff0; }
.btn-gho:disabled { opacity:0.5; cursor:not-allowed; }

/* stats */
.cd-stats { display:grid; gap:10px; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); }
.cd-stat { background:#1f2640; border:1px solid; border-radius:11px; padding:16px 14px; text-align:center; }
.cd-stat-v { font-family:'Syne',sans-serif; font-size:22px; font-weight:800; line-height:1; }
.cd-stat-l { font-size:9px; letter-spacing:0.1em; text-transform:uppercase; color:#505a72; margin-top:5px; }

/* grid */
.cd-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
@media(max-width:820px){ .cd-grid{ grid-template-columns:1fr; } }

/* section cards */
.cd-card { background:#1f2640; border:1px solid rgba(255,255,255,0.07); border-radius:12px; overflow:hidden; }
.cd-card-hd { display:flex; align-items:center; gap:8px; padding:11px 16px; border-bottom:1px solid rgba(255,255,255,0.06); background:#181d2e; }
.cd-card-ic { font-size:12px; opacity:0.5; }
.cd-card-tl { font-size:9px; letter-spacing:0.13em; text-transform:uppercase; color:#8a96a8; font-weight:500; }
.cd-card-bd { padding:4px 0; }

/* field rows */
.cd-row { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; padding:10px 16px; border-bottom:1px solid rgba(255,255,255,0.03); }
.cd-row:last-child { border-bottom:none; }
.cd-key { font-size:11px; color:#505a72; letter-spacing:0.04em; flex-shrink:0; min-width:90px; }
.cd-val { font-size:11px; color:#d8dff0; text-align:right; word-break:break-word; max-width:260px; }

/* cylinder */
.cd-cyl { background:#1f2640; border:1px solid rgba(255,255,255,0.07); border-radius:12px; overflow:hidden; grid-column:1/-1; }
.cd-cyl-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(190px,1fr)); gap:12px; padding:16px; }
.cd-cyl-empty { padding:44px 24px; text-align:center; color:#505a72; font-size:12px; }
.cd-cyl-card { background:#181d2e; border:1px solid; border-radius:11px; padding:14px 16px; transition:transform 0.15s,box-shadow 0.15s; }
.cd-cyl-card:hover { transform:translateY(-2px); box-shadow:0 4px 18px rgba(0,0,0,0.28); }
.cd-cyl-r1 { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
.cd-cyl-badge { font-size:10px; letter-spacing:0.09em; text-transform:uppercase; font-weight:500; padding:3px 9px; border-radius:4px; border:1px solid; }
.cd-cyl-qty { font-family:'Syne',sans-serif; font-size:28px; font-weight:800; line-height:1; }
.cd-cyl-unit { font-size:10px; color:#505a72; margin-left:3px; }
.cd-cyl-track { height:3px; background:rgba(255,255,255,0.06); border-radius:2px; overflow:hidden; margin-bottom:12px; }
.cd-cyl-fill { height:100%; border-radius:2px; transition:width 0.6s cubic-bezier(.4,0,.2,1); }
.cd-cyl-ft { display:flex; justify-content:space-between; align-items:flex-end; }
.cd-cyl-mk { font-size:9px; color:#505a72; letter-spacing:0.08em; text-transform:uppercase; margin-bottom:3px; }
.cd-cyl-mv { font-size:11px; color:#d8dff0; }
.cd-cyl-up { font-size:9px; color:#505a72; margin-top:10px; }

/* modal */
.cd-ov { position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:40; backdrop-filter:blur(3px); }
.cd-modal {
  position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
  width:460px; max-width:calc(100vw - 32px); max-height:calc(100vh - 64px);
  background:#181d2e; border:1px solid rgba(255,255,255,0.1); border-radius:14px;
  z-index:50; display:flex; flex-direction:column; overflow:hidden; animation:modal-in 0.18s ease;
}
@keyframes modal-in { from{opacity:0;transform:translate(-50%,-48%) scale(0.96)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
.cd-mhd { display:flex; align-items:center; justify-content:space-between; padding:18px 20px 14px; border-bottom:1px solid rgba(255,255,255,0.07); flex-shrink:0; }
.cd-mtitle { font-family:'Syne',sans-serif; font-size:16px; font-weight:700; color:#d8dff0; }
.cd-mclose { background:#1f2640; border:1px solid rgba(255,255,255,0.07); border-radius:6px; color:#8a96a8; width:30px; height:30px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:14px; transition:all 0.14s; }
.cd-mclose:hover { color:#d8dff0; background:#262d45; }
.cd-mbdy { padding:18px 20px; display:flex; flex-direction:column; gap:14px; overflow-y:auto; flex:1; }
.cd-mfoot { padding:14px 20px; border-top:1px solid rgba(255,255,255,0.07); display:flex; justify-content:flex-end; gap:8px; flex-shrink:0; }
.cd-fld { display:flex; flex-direction:column; gap:5px; }
.cd-flbl { font-size:10px; letter-spacing:0.1em; text-transform:uppercase; color:#505a72; }
.cd-inp { background:#1f2640; border:1px solid rgba(255,255,255,0.08); border-radius:7px; padding:9px 11px; color:#d8dff0; font-family:'DM Mono',monospace; font-size:12px; outline:none; transition:border-color 0.14s; width:100%; box-sizing:border-box; }
.cd-inp:focus { border-color:rgba(226,177,74,0.45); }
.cd-inp option { background:#1f2640; }
.cd-tog-row { display:flex; gap:8px; }
.cd-tog { flex:1; padding:8px 14px; border-radius:7px; border:1px solid; cursor:pointer; font-family:'DM Mono',monospace; font-size:11px; letter-spacing:0.06em; transition:all 0.14s; }
.cd-err { background:rgba(224,123,90,0.1); border:1px solid rgba(224,123,90,0.25); border-radius:7px; padding:9px 12px; color:#e07b5a; font-size:12px; }
`;

// ─── Field Row ────────────────────────────────────────────────────────────────
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
            ? { color: "#e2b14a" }
            : muted
              ? { color: "#505a72", fontSize: 10 }
              : undefined
        }
      >
        {children ?? (
          <span style={{ color: "#383f52", fontStyle: "italic" }}>—</span>
        )}
      </span>
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
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

// ─── Cylinder Card ────────────────────────────────────────────────────────────
function CylCard({ h }: { h: CylinderHolding }) {
  const m = CYL_META[h.cylinderSize];
  const total = Number(h.depositPerUnit) * h.heldQty;
  const pct = Math.min(h.heldQty, 100);
  return (
    <div className="cd-cyl-card" style={{ borderColor: m.color + "2e" }}>
      <div className="cd-cyl-r1">
        <span
          className="cd-cyl-badge"
          style={{
            color: m.color,
            borderColor: m.color + "44",
            background: m.color + "12",
          }}
        >
          {m.label}
        </span>
        <span
          className="cd-cyl-qty"
          style={{ color: h.heldQty > 0 ? m.color : "#505a72" }}
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
            background: m.color,
            opacity: h.heldQty > 0 ? 1 : 0.12,
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
          <div className="cd-cyl-mv" style={{ color: "#6dbf8c" }}>
            {fmtIDR(total)}
          </div>
        </div>
      </div>
      <div className="cd-cyl-up">Updated {fmtDate(h.lastUpdated)}</div>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
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
          {/* Type */}
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

          {/* Text fields */}
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

          {/* Address textarea */}
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

          {/* Status toggle */}
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
                          ? "rgba(109,191,140,0.14)"
                          : "rgba(224,123,90,0.14)"
                        : "transparent",
                    borderColor:
                      form.isActive === v
                        ? v
                          ? "#6dbf8c"
                          : "#e07b5a"
                        : "rgba(255,255,255,0.08)",
                    color:
                      form.isActive === v
                        ? v
                          ? "#6dbf8c"
                          : "#e07b5a"
                        : "#505a72",
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
          color: "#505a72",
          fontFamily: "'DM Mono',monospace",
          fontSize: 12,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36, opacity: 0.18, marginBottom: 12 }}>◈</div>
          <div>Loading customer…</div>
        </div>
      </div>
    );

  if (error || !customer)
    return (
      <div
        style={{
          padding: 20,
          background: "rgba(224,123,90,0.08)",
          border: "1px solid rgba(224,123,90,0.2)",
          borderRadius: 10,
          color: "#e07b5a",
          fontFamily: "'DM Mono',monospace",
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
    <>
      <style>{PAGE_CSS}</style>

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
          <div className="cd-avatar">
            {customer.name.charAt(0).toUpperCase()}
          </div>

          <div className="cd-hero-body">
            <div className="cd-name">{customer.name}</div>
            <div className="cd-code">{customer.code}</div>

            <div className="cd-chips">
              <span
                className="chip"
                style={{
                  color: tm.color,
                  borderColor: tm.color + "44",
                  background: tm.color + "12",
                }}
              >
                {tm.label}
              </span>
              <span
                className="chip"
                style={{
                  color: customer.isActive ? "#6dbf8c" : "#505a72",
                  borderColor: customer.isActive
                    ? "rgba(109,191,140,0.3)"
                    : "rgba(80,90,114,0.3)",
                  background: customer.isActive
                    ? "rgba(109,191,140,0.1)"
                    : "transparent",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: customer.isActive ? "#6dbf8c" : "#505a72",
                    boxShadow: customer.isActive ? "0 0 6px #6dbf8c" : "none",
                    display: "inline-block",
                  }}
                />
                {customer.isActive ? "Active" : "Inactive"}
              </span>
              <span style={{ fontSize: 11, color: "#505a72" }}>
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
              color: "#5b9bd5",
            },
            {
              label: "Gasback Txns",
              value: customer._count.gasbackLedgers,
              color: "#e2b14a",
            },
            {
              label: "Gasback Claims",
              value: customer._count.gasbackClaims,
              color: "#c97cd4",
            },
            { label: "Cylinders Held", value: totalHeld, color: "#6dbf8c" },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="cd-stat"
              style={{ borderColor: color + "28", background: color + "08" }}
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
              borderColor: "#6dbf8c28",
              background: "#6dbf8c08",
              gridColumn: "span 2",
            }}
          >
            <div
              className="cd-stat-v"
              style={{ color: "#6dbf8c", fontSize: 16 }}
            >
              {fmtIDR(totalDeposit)}
            </div>
            <div className="cd-stat-l">Total Cylinder Deposit</div>
          </div>
        </div>

        {/* Detail grid */}
        <div className="cd-grid">
          {/* ── Identity ── */}
          <Card title="Identity" icon="◈">
            <Field label="Customer Code" accent>
              {customer.code}
            </Field>
            <Field label="Full Name">{customer.name}</Field>
            <Field label="Type">
              <span
                className="chip"
                style={{
                  color: tm.color,
                  borderColor: tm.color + "44",
                  background: tm.color + "12",
                }}
              >
                {tm.label}
              </span>
            </Field>
            <Field label="Branch">{customer.branch.name}</Field>
            <Field label="Status">
              <span
                style={{ color: customer.isActive ? "#6dbf8c" : "#505a72" }}
              >
                {customer.isActive ? "● Active" : "○ Inactive"}
              </span>
            </Field>
          </Card>

          {/* ── Contact ── */}
          <Card title="Contact Information" icon="◉">
            <Field label="Phone">{customer.phone}</Field>
            <Field label="Email">{customer.email}</Field>
            <Field label="Address">{customer.address}</Field>
            <Field label="NPWP" accent>
              {customer.npwp}
            </Field>
          </Card>

          {/* ── Financial ── */}
          <Card title="Financial" icon="▣">
            <Field label="Credit Limit">
              <span style={{ color: "#6dbf8c" }}>
                {fmtIDR(customer.creditLimit)}
              </span>
            </Field>
            <Field label="Total Deposit">
              <span style={{ color: "#6dbf8c" }}>{fmtIDR(totalDeposit)}</span>
            </Field>
          </Card>

          {/* ── System ── */}
          <Card title="System" icon="▤">
            <Field label="Customer ID" muted>
              {customer.id}
            </Field>
            <Field label="Created At">{fmtDateTime(customer.createdAt)}</Field>
            <Field label="Last Updated">
              {fmtDateTime(customer.updatedAt)}
            </Field>
          </Card>

          {/* ── Cylinder Holdings ── */}
          <div className="cd-cyl">
            <div className="cd-card-hd">
              <span className="cd-card-ic">⬡</span>
              <span className="cd-card-tl">
                Cylinder Holdings (Tabung Dipegang)
              </span>
              {totalHeld > 0 && (
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 10,
                    color: "#6dbf8c",
                    letterSpacing: "0.05em",
                  }}
                >
                  {totalHeld} tabung · {fmtIDR(totalDeposit)}
                </span>
              )}
            </div>

            {sortedHold.length === 0 ? (
              <div className="cd-cyl-empty">
                <div style={{ fontSize: 30, opacity: 0.18, marginBottom: 8 }}>
                  ⬡
                </div>
                <div>No cylinder holdings recorded</div>
                <div style={{ fontSize: 10, marginTop: 4, color: "#383f52" }}>
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
    </>
  );
}
