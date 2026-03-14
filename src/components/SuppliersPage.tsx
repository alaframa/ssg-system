"use client";

import { useState, useEffect, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Branch {
  id: string;
  code: string;
  name: string;
}

interface HmtQuota {
  id: string;
  branchId: string;
  cylinderSize: CylinderSize;
  periodMonth: number;
  periodYear: number;
  quotaQty: number;
  usedQty: number;
  pricePerUnit: string;
  branch: Branch;
}

interface Supplier {
  id: string;
  code: string;
  name: string;
  npwp: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: string;
  supplierHmtQuotas: HmtQuota[];
  _count: { supplierPos: number };
}

type CylinderSize = "KG12" | "KG50";

const CYL_SIZES: CylinderSize[] = ["KG12", "KG50"];

const CYL_LABELS: Record<CylinderSize, string> = {
  KG12: "12 Kg",
  KG50: "50 Kg",
};
const CYL_COLORS: Record<...> = {
  KG12: { text: "#D97706", bg: "rgba(217,119,6,0.08)", border: "rgba(217,119,6,0.22)" },
  KG50: { text: "#7C3AED", bg: "rgba(124,58,237,0.08)", border: "rgba(124,58,237,0.22)" },
};


const CYL_COLORS: Record<
  CylinderSize,
  { text: string; bg: string; border: string }
> = {
  
  KG12: {
    text: "#D97706",
    bg: "rgba(217,119,6,0.08)",
    border: "rgba(217,119,6,0.22)",
  },
  KG50: {
    text: "#7C3AED",
    bg: "rgba(124,58,237,0.08)",
    border: "rgba(124,58,237,0.22)",
  },
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const NOW_YEAR = new Date().getFullYear();
const NOW_MONTH = new Date().getMonth() + 1;

const fmtIDR = (v: string | number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(v));

// ─── QuotaCard — single cell in the summary grid ─────────────────────────────
function QuotaCard({
  quota,
  branchCode,
  size,
}: {
  quota: HmtQuota | undefined;
  branchCode: string;
  size: CylinderSize;
}) {
  const cc = CYL_COLORS[size];
  const pct = quota
    ? Math.min(
        100,
        Math.round((quota.usedQty / Math.max(quota.quotaQty, 1)) * 100),
      )
    : 0;
  const isOver = pct >= 90;

  return (
    <div
      style={{
        background: "var(--card)",
        border: `1px solid ${cc.border}`,
        borderTop: `3px solid ${cc.text}`,
        borderRadius: "var(--radius-md)",
        padding: "12px 14px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 8,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text-low)",
            }}
          >
            {branchCode}
          </div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: cc.text,
              marginTop: 2,
            }}
          >
            {CYL_LABELS[size]}
          </div>
        </div>
        {quota ? (
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: cc.text,
                lineHeight: 1,
              }}
            >
              {quota.quotaQty.toLocaleString("id-ID")}
            </div>
            <div
              style={{
                fontSize: 9,
                color: "var(--text-low)",
                letterSpacing: "0.05em",
                marginTop: 1,
              }}
            >
              tabung
            </div>
          </div>
        ) : (
          <div
            style={{
              fontSize: 10,
              color: "var(--text-low)",
              fontStyle: "italic",
              marginTop: 6,
            }}
          >
            not set
          </div>
        )}
      </div>

      {quota && (
        <>
          {/* Usage bar */}
          <div
            style={{
              height: 4,
              background: "var(--bg)",
              borderRadius: 2,
              overflow: "hidden",
              marginBottom: 6,
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${pct}%`,
                background: isOver ? "var(--danger)" : cc.text,
                borderRadius: 2,
                transition: "width 0.5s ease",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 10,
              color: "var(--text-low)",
            }}
          >
            <span>
              Used{" "}
              <strong style={{ color: isOver ? "var(--danger)" : cc.text }}>
                {quota.usedQty}
              </strong>
            </span>
            <span>
              Sisa{" "}
              <strong style={{ color: "var(--text-mid)" }}>
                {quota.quotaQty - quota.usedQty}
              </strong>
            </span>
            <span
              style={{
                color: isOver ? "var(--danger)" : "var(--text-low)",
                fontWeight: isOver ? 700 : 400,
              }}
            >
              {pct}%
            </span>
          </div>
          <div
            style={{
              marginTop: 7,
              paddingTop: 7,
              borderTop: "1px solid var(--border-muted)",
              fontSize: 10,
              color: "var(--text-low)",
            }}
          >
            HMT Price{" "}
            <span
              style={{
                color: "var(--text-hi)",
                fontWeight: 600,
                float: "right",
              }}
            >
              {fmtIDR(quota.pricePerUnit)}/tbg
            </span>
          </div>
        </>
      )}
    </div>
  );
}

// ─── QuotaEditorModal ─────────────────────────────────────────────────────────
function QuotaEditorModal({
  supplier,
  branches,
  allQuotas,
  onClose,
  onSaved,
}: {
  supplier: Supplier;
  branches: Branch[];
  allQuotas: HmtQuota[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [year, setYear] = useState(NOW_YEAR);
  const [month, setMonth] = useState(NOW_MONTH);
  const [saving, setSaving] = useState(false);
  const [apiErr, setApiErr] = useState("");

  // Local form state: branchId__cylinderSize → { quotaQty, pricePerUnit }
  type RowKey = string;
  interface RowVal {
    quotaQty: string;
    pricePerUnit: string;
  }
  const [rows, setRows] = useState<Record<RowKey, RowVal>>({});

  // Refresh local form whenever period changes
  useEffect(() => {
    const map: Record<RowKey, RowVal> = {};
    for (const b of branches) {
      for (const s of CYL_SIZES) {
        const key = `${b.id}__${s}`;
        const q = allQuotas.find(
          (x) =>
            x.branchId === b.id &&
            x.cylinderSize === s &&
            x.periodYear === year &&
            x.periodMonth === month,
        );
        map[key] = {
          quotaQty: q ? String(q.quotaQty) : "",
          pricePerUnit: q ? String(q.pricePerUnit) : "",
        };
      }
    }
    setRows(map);
    setApiErr("");
  }, [year, month, allQuotas, branches]);

  function setCell(key: string, field: keyof RowVal, value: string) {
    setRows((r) => ({ ...r, [key]: { ...r[key], [field]: value } }));
  }

  async function handleSave() {
    const toSave: {
      branchId: string;
      cylinderSize: CylinderSize;
      quotaQty: number;
      pricePerUnit: number;
    }[] = [];

    for (const b of branches) {
      for (const s of CYL_SIZES) {
        const key = `${b.id}__${s}`;
        const row = rows[key];
        if (!row || (row.quotaQty === "" && row.pricePerUnit === "")) continue;
        toSave.push({
          branchId: b.id,
          cylinderSize: s,
          quotaQty: Number(row.quotaQty) || 0,
          pricePerUnit: Number(row.pricePerUnit) || 0,
        });
      }
    }

    if (toSave.length === 0) {
      onClose();
      return;
    }

    setSaving(true);
    setApiErr("");
    try {
      const results = await Promise.all(
        toSave.map((entry) =>
          fetch(`/api/suppliers/${supplier.id}/hmt-quota`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...entry,
              periodYear: year,
              periodMonth: month,
            }),
          }),
        ),
      );
      const failed = results.filter((r) => !r.ok);
      if (failed.length > 0)
        throw new Error(`${failed.length} entries failed to save.`);
      onSaved();
      onClose();
    } catch (e: unknown) {
      setApiErr(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="cd-ov" onClick={onClose} />
      <div
        className="cd-modal"
        style={{
          width: "min(760px, calc(100vw - 32px))",
          maxHeight: "calc(100vh - 48px)",
        }}
      >
        <div className="cd-mhd">
          <div>
            <div className="cd-mtitle">HMT Quota Management</div>
            <div
              style={{ fontSize: 11, color: "var(--text-mid)", marginTop: 2 }}
            >
              {supplier.name} · Harga Mulut Tambang — monthly allocation per
              branch &amp; size
            </div>
          </div>
          <button className="cd-mclose" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="cd-mbdy">
          {/* Period picker */}
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              padding: "10px 14px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-mid)",
                letterSpacing: "0.05em",
              }}
            >
              PERIOD
            </span>
            <select
              className="cd-inp"
              style={{ width: 110, flex: "none" }}
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              className="cd-inp"
              style={{ width: 90, flex: "none" }}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {[NOW_YEAR - 1, NOW_YEAR, NOW_YEAR + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <span
              style={{
                fontSize: 10,
                color: "var(--text-low)",
                marginLeft: "auto",
              }}
            >
              Leave blank to skip · changes are upserted immediately on Save
            </span>
          </div>

          {/* Grid table */}
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
                minWidth: 600,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "var(--bg)",
                    borderBottom: "2px solid var(--border)",
                  }}
                >
                  <th
                    style={{
                      padding: "8px 12px",
                      textAlign: "left",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--text-mid)",
                      width: 90,
                    }}
                  >
                    Branch
                  </th>
                  {CYL_SIZES.map((s) => (
                    <th
                      key={s}
                      colSpan={2}
                      style={{
                        padding: "8px 10px",
                        textAlign: "center",
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: CYL_COLORS[s].text,
                      }}
                    >
                      {CYL_LABELS[s]}
                    </th>
                  ))}
                </tr>
                <tr
                  style={{
                    background: "#F9FAFB",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <th style={{ padding: "4px 12px" }} />
                  {CYL_SIZES.flatMap((s) => [
                    <th
                      key={`${s}_q`}
                      style={{
                        padding: "4px 8px",
                        fontSize: 9,
                        fontWeight: 600,
                        color: "var(--text-low)",
                        textAlign: "center",
                        letterSpacing: "0.06em",
                      }}
                    >
                      QUOTA (tbg)
                    </th>,
                    <th
                      key={`${s}_p`}
                      style={{
                        padding: "4px 8px",
                        fontSize: 9,
                        fontWeight: 600,
                        color: "var(--text-low)",
                        textAlign: "center",
                        letterSpacing: "0.06em",
                      }}
                    >
                      PRICE/tbg (Rp)
                    </th>,
                  ])}
                </tr>
              </thead>
              <tbody>
                {branches.map((b, bi) => (
                  <tr
                    key={b.id}
                    style={{
                      borderBottom: "1px solid var(--border-muted)",
                      background: bi % 2 === 0 ? "#fff" : "#FAFAFA",
                    }}
                  >
                    <td style={{ padding: "8px 12px" }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: "var(--text-hi)",
                        }}
                      >
                        {b.code}
                      </span>
                      <div
                        style={{
                          fontSize: 9,
                          color: "var(--text-low)",
                          marginTop: 1,
                        }}
                      >
                        {b.name}
                      </div>
                    </td>
                    {CYL_SIZES.flatMap((s) => {
                      const key = `${b.id}__${s}`;
                      const row = rows[key] ?? {
                        quotaQty: "",
                        pricePerUnit: "",
                      };
                      const cc = CYL_COLORS[s];
                      return [
                        <td key={`${key}_q`} style={{ padding: "5px 5px" }}>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={row.quotaQty}
                            onChange={(e) =>
                              setCell(key, "quotaQty", e.target.value)
                            }
                            style={{
                              width: "100%",
                              minWidth: 72,
                              padding: "6px 8px",
                              border: `1px solid ${cc.border}`,
                              borderRadius: "var(--radius-sm)",
                              fontSize: 12,
                              fontWeight: 700,
                              color: cc.text,
                              background: cc.bg,
                              outline: "none",
                              textAlign: "right",
                            }}
                          />
                        </td>,
                        <td key={`${key}_p`} style={{ padding: "5px 5px" }}>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={row.pricePerUnit}
                            onChange={(e) =>
                              setCell(key, "pricePerUnit", e.target.value)
                            }
                            style={{
                              width: "100%",
                              minWidth: 100,
                              padding: "6px 8px",
                              border: "1px solid var(--border)",
                              borderRadius: "var(--radius-sm)",
                              fontSize: 12,
                              color: "var(--text-hi)",
                              background: "#fff",
                              outline: "none",
                              textAlign: "right",
                            }}
                          />
                        </td>,
                      ];
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {apiErr && <div className="cd-err">⚠ {apiErr}</div>}
        </div>

        <div className="cd-mfoot">
          <button className="btn-gho" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn-pri" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Quotas"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQuota, setShowQuota] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const [profForm, setProfForm] = useState({
    name: "",
    npwp: "",
    phone: "",
    email: "",
    address: "",
    isActive: true,
  });
  const [profSaving, setProfSaving] = useState(false);
  const [profErr, setProfErr] = useState("");

  const bootstrapped = useRef(false);

  // ── Bootstrap: load supplier list + branches once ─────────────────────────
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    (async () => {
      setLoading(true);
      try {
        const [supRes, brRes] = await Promise.all([
          fetch("/api/suppliers"),
          fetch("/api/branches"),
        ]);
        const [sups, brs]: [Supplier[], Branch[]] = await Promise.all([
          supRes.json(),
          brRes.json(),
        ]);
        setSuppliers(sups);
        setBranches(brs);
        // Auto-select first supplier
        if (sups.length > 0) {
          await loadDetail(sups[0].id);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Load full supplier detail (with fresh quotas) ─────────────────────────
  async function loadDetail(id: string) {
    try {
      const res = await fetch(`/api/suppliers/${id}`);
      const data = await res.json();
      setSelected(data);
    } catch {
      // keep current selection on failure
    }
  }

  function startEdit(s: Supplier) {
    setProfForm({
      name: s.name,
      npwp: s.npwp ?? "",
      phone: s.phone ?? "",
      email: s.email ?? "",
      address: s.address ?? "",
      isActive: s.isActive,
    });
    setProfErr("");
    setEditProfile(true);
  }

  async function saveProfile() {
    if (!selected) return;
    setProfSaving(true);
    setProfErr("");
    try {
      const res = await fetch(`/api/suppliers/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed.");
      setSelected((s) => (s ? { ...s, ...data } : s));
      setSuppliers((list) =>
        list.map((x) => (x.id === selected.id ? { ...x, ...data } : x)),
      );
      setEditProfile(false);
    } catch (e: unknown) {
      setProfErr(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setProfSaving(false);
    }
  }

  // ── Skeleton loader ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="skeleton-row"
            style={{ height: 56, borderRadius: "var(--radius-md)" }}
          />
        ))}
      </div>
    );
  }

  if (suppliers.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "80px 0",
          color: "var(--text-low)",
          fontSize: 13,
        }}
      >
        <div style={{ fontSize: 36, opacity: 0.18, marginBottom: 12 }}>🏬</div>
        No suppliers found. Add your first supplier to get started.
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "var(--font-sans)" }}>
      {/* Page header */}
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
          <span style={{ color: "var(--accent)" }}>SUPPLIERS</span>
        </div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 900,
            color: "var(--sidebar)",
            letterSpacing: "-0.03em",
            lineHeight: 1,
          }}
        >
          Suppliers
        </div>
        <div style={{ fontSize: 11, color: "var(--text-mid)", marginTop: 4 }}>
          Supplier profile &amp; HMT quota management
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "220px 1fr",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* ── Left rail: supplier list ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {suppliers.map((s) => {
            const active = selected?.id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => loadDetail(s.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: "11px 13px",
                  background: active ? "var(--accent-bg)" : "var(--card)",
                  border: `1px solid ${active ? "var(--accent-border)" : "var(--border)"}`,
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "border-color 0.12s, background 0.12s",
                  boxShadow: active ? "none" : "var(--shadow-sm)",
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    flexShrink: 0,
                    borderRadius: "var(--radius-sm)",
                    background: active ? "var(--accent)" : "var(--bg)",
                    color: active ? "#fff" : "var(--text-mid)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: 13,
                  }}
                >
                  {s.code.slice(0, 2)}
                </div>
                <div style={{ overflow: "hidden", flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: active ? "var(--accent)" : "var(--text-hi)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {s.name}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: "var(--text-low)",
                      marginTop: 1,
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {s.code}
                  </div>
                </div>
                {!s.isActive && (
                  <span
                    style={{
                      fontSize: 9,
                      color: "#9CA3AF",
                      border: "1px solid #E5E7EB",
                      borderRadius: 3,
                      padding: "1px 5px",
                      flexShrink: 0,
                    }}
                  >
                    OFF
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Right: detail panel ── */}
        {selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* ── Profile card ── */}
            <div
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div
                style={{
                  height: 3,
                  background:
                    "linear-gradient(90deg, var(--accent) 0%, rgba(37,99,235,0.08) 80%, transparent)",
                }}
              />

              <div style={{ padding: "20px 24px" }}>
                {editProfile ? (
                  /* ── Edit form ── */
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 14,
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 12,
                      }}
                    >
                      {(
                        [
                          { label: "Name", key: "name", type: "text" },
                          { label: "NPWP", key: "npwp", type: "text" },
                          { label: "Phone", key: "phone", type: "text" },
                          { label: "Email", key: "email", type: "email" },
                        ] as const
                      ).map(({ label, key, type }) => (
                        <div key={key} className="cd-fld">
                          <label className="cd-flbl">{label}</label>
                          <input
                            type={type}
                            className="cd-inp"
                            value={(profForm as Record<string, string>)[key]}
                            onChange={(e) =>
                              setProfForm((f) => ({
                                ...f,
                                [key]: e.target.value,
                              }))
                            }
                          />
                        </div>
                      ))}
                    </div>
                    <div className="cd-fld">
                      <label className="cd-flbl">Address</label>
                      <textarea
                        className="cd-inp"
                        rows={2}
                        style={{ resize: "vertical" }}
                        value={profForm.address}
                        onChange={(e) =>
                          setProfForm((f) => ({
                            ...f,
                            address: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="cd-fld">
                      <label className="cd-flbl">Status</label>
                      <div className="cd-tog-row">
                        {([true, false] as const).map((v) => (
                          <button
                            key={String(v)}
                            className="cd-tog"
                            onClick={() =>
                              setProfForm((f) => ({ ...f, isActive: v }))
                            }
                            style={{
                              background:
                                profForm.isActive === v
                                  ? v
                                    ? "rgba(21,128,61,0.08)"
                                    : "rgba(220,38,38,0.08)"
                                  : "transparent",
                              borderColor:
                                profForm.isActive === v
                                  ? v
                                    ? "#15803D"
                                    : "#DC2626"
                                  : "#E5E7EB",
                              color:
                                profForm.isActive === v
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
                    {profErr && <div className="cd-err">⚠ {profErr}</div>}
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        className="btn-gho"
                        onClick={() => setEditProfile(false)}
                        disabled={profSaving}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn-pri"
                        onClick={saveProfile}
                        disabled={profSaving}
                      >
                        {profSaving ? "Saving…" : "Save"}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── View mode ── */
                  <>
                    <div
                      style={{
                        display: "flex",
                        gap: 16,
                        alignItems: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          flexShrink: 0,
                          borderRadius: "var(--radius-md)",
                          background: "var(--accent-bg)",
                          border: "1px solid var(--accent-border)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 20,
                          fontWeight: 900,
                          color: "var(--accent)",
                        }}
                      >
                        {selected.code.slice(0, 2)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 20,
                            fontWeight: 900,
                            color: "var(--sidebar)",
                            letterSpacing: "-0.02em",
                          }}
                        >
                          {selected.name}
                        </div>
                        <div
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 11,
                            color: "var(--text-mid)",
                            marginTop: 2,
                          }}
                        >
                          {selected.code}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            marginTop: 10,
                            flexWrap: "wrap",
                            alignItems: "center",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: 4,
                              border: `1px solid ${selected.isActive ? "rgba(21,128,61,0.25)" : "#E5E7EB"}`,
                              color: selected.isActive
                                ? "#15803D"
                                : "var(--text-low)",
                              background: selected.isActive
                                ? "rgba(21,128,61,0.07)"
                                : "transparent",
                            }}
                          >
                            {selected.isActive ? "● Active" : "○ Inactive"}
                          </span>
                          <span
                            style={{ fontSize: 10, color: "var(--text-low)" }}
                          >
                            {selected._count.supplierPos} Purchase Orders
                          </span>
                        </div>
                      </div>
                      <button
                        className="btn-pri"
                        style={{ fontSize: 12, flexShrink: 0 }}
                        onClick={() => startEdit(selected)}
                      >
                        ✎ Edit Profile
                      </button>
                    </div>

                    {/* Info fields */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 0,
                        marginTop: 18,
                        paddingTop: 14,
                        borderTop: "1px solid var(--border-muted)",
                      }}
                    >
                      {[
                        { label: "NPWP", value: selected.npwp },
                        { label: "Phone", value: selected.phone },
                        { label: "Email", value: selected.email },
                        { label: "Address", value: selected.address },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ padding: "6px 0" }}>
                          <div
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              letterSpacing: "0.07em",
                              textTransform: "uppercase",
                              color: "var(--text-low)",
                            }}
                          >
                            {label}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: value
                                ? "var(--text-hi)"
                                : "var(--text-low)",
                              fontStyle: value ? "normal" : "italic",
                              marginTop: 2,
                            }}
                          >
                            {value || "—"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── HMT Quota section ── */}
            <div
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              {/* Section header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 20px",
                  borderBottom: "1px solid var(--border-muted)",
                  background: "#FAFAFA",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--text-hi)",
                    }}
                  >
                    HMT Quota — {MONTHS[NOW_MONTH - 1]} {NOW_YEAR}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--text-low)",
                      marginTop: 2,
                    }}
                  >
                    Harga Mulut Tambang · monthly allocation &amp; usage per
                    branch
                  </div>
                </div>
                <button
                  className="btn-pri"
                  style={{ fontSize: 12 }}
                  onClick={() => setShowQuota(true)}
                >
                  ⊞ Manage Quotas
                </button>
              </div>

              <div style={{ padding: 16 }}>
                {branches.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: 24,
                      color: "var(--text-low)",
                      fontSize: 12,
                    }}
                  >
                    No branches configured.
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 18,
                    }}
                  >
                    {branches.map((b) => {
                      // Filter quotas for this branch + current period
                      const branchQuotas = selected.supplierHmtQuotas.filter(
                        (q) =>
                          q.branchId === b.id &&
                          q.periodYear === NOW_YEAR &&
                          q.periodMonth === NOW_MONTH,
                      );
                      const anySet = branchQuotas.length > 0;

                      return (
                        <div key={b.id}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              marginBottom: 10,
                            }}
                          >
                            <span
                              style={{
                                background: "var(--sidebar)",
                                color: "#fff",
                                fontSize: 10,
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: 4,
                                letterSpacing: "0.05em",
                              }}
                            >
                              {b.code}
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: "var(--text-mid)",
                              }}
                            >
                              {b.name}
                            </span>
                            {!anySet && (
                              <span
                                style={{
                                  fontSize: 9,
                                  color: "var(--text-low)",
                                  fontStyle: "italic",
                                  marginLeft: 4,
                                }}
                              >
                                — no quota set for this period
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                "repeat(auto-fill, minmax(160px, 1fr))",
                              gap: 10,
                            }}
                          >
                            {CYL_SIZES.map((s) => {
                              const quota = branchQuotas.find(
                                (q) => q.cylinderSize === s,
                              );
                              return (
                                <QuotaCard
                                  key={s}
                                  quota={quota}
                                  branchCode={b.code}
                                  size={s}
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quota editor modal */}
      {showQuota && selected && (
        <QuotaEditorModal
          supplier={selected}
          branches={branches}
          allQuotas={selected.supplierHmtQuotas}
          onClose={() => setShowQuota(false)}
          onSaved={() => loadDetail(selected.id)}
        />
      )}
    </div>
  );
}
