"use client";

import { useState, useEffect } from "react";

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

type CylinderSize = "KG12" | "KG50";

interface Props {
  branches: Branch[];
  suppliers: Supplier[];
  onClose: () => void;
  onCreated: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CYL_OPTIONS: { value: CylinderSize; label: string }[] = [
  { value: "KG12", label: "12 Kg" },
  { value: "KG50", label: "50 Kg" },
];

const CYL_COLORS: Record<
  CylinderSize,
  { text: string; bg: string; border: string }
> = {
  KG12: {
    text: "#D97706",
    bg: "rgba(217,119,6,0.08)",
    border: "rgba(217,119,6,0.25)",
  },
  KG50: {
    text: "#7C3AED",
    bg: "rgba(124,58,237,0.08)",
    border: "rgba(124,58,237,0.25)",
  },
};

const todayISO = () => new Date().toISOString().split("T")[0];

const fmtIDR = (v: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(v);

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="cd-fld">
      <label className="cd-flbl">
        {label}
        {required && (
          <span style={{ color: "var(--danger)", marginLeft: 3 }}>*</span>
        )}
      </label>
      {children}
      {error && (
        <div style={{ fontSize: 11, color: "var(--danger)", marginTop: 3 }}>
          ⚠ {error}
        </div>
      )}
      {hint && !error && (
        <div style={{ fontSize: 11, color: "var(--text-low)", marginTop: 3 }}>
          {hint}
        </div>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function CreatePoModal({
  branches,
  suppliers,
  onClose,
  onCreated,
}: Props) {
  const [form, setForm] = useState({
    branchId: "",
    supplierId: "",
    poNumber: "", // blank = auto-generate
    poDate: todayISO(),
    cylinderSize: "KG12" as CylinderSize,
    orderedQty: "",
    pricePerUnit: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");

  // Quota hint — load HMT quota when branch+supplier+size changes
  const [quotaHint, setQuotaHint] = useState<{
    quotaQty: number;
    usedQty: number;
    pricePerUnit: string;
  } | null>(null);
  const [loadingQuota, setLoadingQuota] = useState(false);

  useEffect(() => {
    if (!form.supplierId || !form.branchId || !form.cylinderSize) {
      setQuotaHint(null);
      return;
    }
    setLoadingQuota(true);
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    fetch(
      `/api/suppliers/${form.supplierId}/hmt-quota?year=${year}&month=${month}`,
    )
      .then((r) => r.json())
      .then((quotas) => {
        const q = quotas.find(
          (x: any) =>
            x.branchId === form.branchId &&
            x.cylinderSize === form.cylinderSize,
        );
        setQuotaHint(q ?? null);
        // Auto-fill price if not yet filled
        if (q && !form.pricePerUnit) {
          setForm((f) => ({ ...f, pricePerUnit: String(q.pricePerUnit) }));
        }
      })
      .catch(() => setQuotaHint(null))
      .finally(() => setLoadingQuota(false));
  }, [form.supplierId, form.branchId, form.cylinderSize]); // eslint-disable-line

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => {
      const n = { ...e };
      delete n[key];
      return n;
    });
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!form.branchId) e.branchId = "Branch is required.";
    if (!form.supplierId) e.supplierId = "Supplier is required.";
    if (!form.poDate) e.poDate = "PO date is required.";
    if (!form.cylinderSize) e.cylinderSize = "Cylinder size is required.";
    if (!form.orderedQty || Number(form.orderedQty) <= 0)
      e.orderedQty = "Quantity must be greater than 0.";
    if (form.pricePerUnit !== "" && Number(form.pricePerUnit) < 0)
      e.pricePerUnit = "Price must be ≥ 0.";
    return e;
  }

  async function handleSave() {
    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setSaving(true);
    setApiError("");
    try {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          orderedQty: Number(form.orderedQty),
          pricePerUnit: Number(form.pricePerUnit) || 0,
          poNumber: form.poNumber.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) {
          setErrors(data.errors);
          return;
        }
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      onCreated();
      onClose();
    } catch (e: unknown) {
      setApiError(e instanceof Error ? e.message : "Unexpected error.");
    } finally {
      setSaving(false);
    }
  }

  const errStyle = (k: string): React.CSSProperties =>
    errors[k]
      ? {
          borderColor: "var(--danger)",
          boxShadow: "0 0 0 3px rgba(220,38,38,0.1)",
        }
      : {};

  const totalValue =
    Number(form.orderedQty || 0) * Number(form.pricePerUnit || 0);
  const selectedCyl = form.cylinderSize as CylinderSize;
  const cc = CYL_COLORS[selectedCyl];

  return (
    <>
      <div className="cd-ov" onClick={onClose} />
      <div className="cd-modal" style={{ width: 580 }}>
        {/* Header */}
        <div className="cd-mhd">
          <div>
            <div className="cd-mtitle">Create Purchase Order</div>
            <div
              style={{ fontSize: 11, color: "var(--text-mid)", marginTop: 2 }}
            >
              PO number will be auto-generated if left blank
            </div>
          </div>
          <button className="cd-mclose" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="cd-mbdy">
          {/* Branch + Supplier */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Field label="Branch" required error={errors.branchId}>
              <select
                className="cd-inp"
                style={errStyle("branchId")}
                value={form.branchId}
                onChange={(e) => set("branchId", e.target.value)}
              >
                <option value="">Select branch…</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Supplier" required error={errors.supplierId}>
              <select
                className="cd-inp"
                style={errStyle("supplierId")}
                value={form.supplierId}
                onChange={(e) => set("supplierId", e.target.value)}
              >
                <option value="">Select supplier…</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* PO Number + Date */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Field
              label="PO Number"
              hint="Leave blank to auto-generate"
              error={errors.poNumber}
            >
              <input
                className="cd-inp"
                style={errStyle("poNumber")}
                placeholder="e.g. PO-SBY-202503-0001"
                value={form.poNumber}
                onChange={(e) => set("poNumber", e.target.value)}
              />
            </Field>

            <Field label="PO Date" required error={errors.poDate}>
              <input
                type="date"
                className="cd-inp"
                style={errStyle("poDate")}
                value={form.poDate}
                onChange={(e) => set("poDate", e.target.value)}
              />
            </Field>
          </div>

          {/* Cylinder Size — pill selector */}
          <Field label="Cylinder Size" required error={errors.cylinderSize}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {CYL_OPTIONS.map((opt) => {
                const c = CYL_COLORS[opt.value];
                const sel = form.cylinderSize === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => set("cylinderSize", opt.value)}
                    style={{
                      padding: "8px 18px",
                      borderRadius: 20,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      border: `2px solid ${sel ? c.border : "var(--border)"}`,
                      color: sel ? c.text : "var(--text-mid)",
                      background: sel ? c.bg : "transparent",
                      transition: "all 0.12s",
                    }}
                  >
                    🛢 {opt.label}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* HMT Quota hint */}
          {(loadingQuota || quotaHint) && (
            <div
              style={{
                background: loadingQuota ? "var(--bg)" : "rgba(21,128,61,0.05)",
                border:
                  "1px solid " +
                  (loadingQuota ? "var(--border)" : "rgba(21,128,61,0.2)"),
                borderRadius: "var(--radius-sm)",
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              {loadingQuota ? (
                <span style={{ fontSize: 11, color: "var(--text-low)" }}>
                  Loading HMT quota…
                </span>
              ) : quotaHint ? (
                <>
                  <span style={{ fontSize: 18 }}>📋</span>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#15803D",
                      }}
                    >
                      HMT Quota for this month
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-mid)",
                        marginTop: 2,
                      }}
                    >
                      Allocated:{" "}
                      <strong>
                        {quotaHint.quotaQty.toLocaleString("id-ID")}
                      </strong>{" "}
                      tbg · Used:{" "}
                      <strong>
                        {quotaHint.usedQty.toLocaleString("id-ID")}
                      </strong>{" "}
                      · Remaining:{" "}
                      <strong style={{ color: "#15803D" }}>
                        {(
                          quotaHint.quotaQty - quotaHint.usedQty
                        ).toLocaleString("id-ID")}
                      </strong>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: 9,
                        color: "var(--text-low)",
                        textTransform: "uppercase",
                        fontWeight: 700,
                      }}
                    >
                      HMT Price
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 800,
                        color: "#15803D",
                      }}
                    >
                      {fmtIDR(Number(quotaHint.pricePerUnit))}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          )}

          {/* Qty + Price */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Field
              label="Ordered Qty (tabung)"
              required
              error={errors.orderedQty}
            >
              <input
                type="number"
                min="1"
                className="cd-inp"
                style={{
                  ...errStyle("orderedQty"),
                  fontWeight: 700,
                  fontSize: 15,
                }}
                placeholder="0"
                value={form.orderedQty}
                onChange={(e) => set("orderedQty", e.target.value)}
              />
            </Field>

            <Field
              label="Price Per Unit (Rp)"
              error={errors.pricePerUnit}
              hint="Auto-filled from HMT quota if available"
            >
              <input
                type="number"
                min="0"
                className="cd-inp"
                style={errStyle("pricePerUnit")}
                placeholder="0"
                value={form.pricePerUnit}
                onChange={(e) => set("pricePerUnit", e.target.value)}
              />
            </Field>
          </div>

          {/* Live total */}
          {totalValue > 0 && (
            <div
              style={{
                background: "rgba(21,128,61,0.05)",
                border: "1px solid rgba(21,128,61,0.15)",
                borderRadius: "var(--radius-sm)",
                padding: "12px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: "var(--text-mid)",
                  fontWeight: 600,
                }}
              >
                Total Order Value
              </span>
              <span style={{ fontSize: 20, fontWeight: 900, color: "#15803D" }}>
                {fmtIDR(totalValue)}
              </span>
            </div>
          )}

          {/* Notes */}
          <Field label="Notes">
            <textarea
              className="cd-inp"
              rows={3}
              style={{ resize: "vertical" }}
              placeholder="Internal notes, references, special instructions…"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </Field>

          {apiError && <div className="cd-err">⚠ {apiError}</div>}
        </div>

        {/* Footer */}
        <div className="cd-mfoot">
          <button className="btn-gho" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn-pri" onClick={handleSave} disabled={saving}>
            {saving ? "Creating…" : "Create Purchase Order"}
          </button>
        </div>
      </div>
    </>
  );
}
