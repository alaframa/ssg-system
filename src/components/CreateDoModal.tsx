"use client";

import { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type CylinderSize = "KG12" | "KG50";

interface PoOption {
  id: string;
  poNumber: string;
  cylinderSize: string;
  orderedQty: number;
  receivedQty: number;
  pricePerUnit: string;
  poDate: string;
  branch: { id: string; code: string; name: string };
  customer: { id: string; name: string; code: string };
  supplier: { id: string; name: string };
}

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

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

export default function CreateDoModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    poId: "",
    doNumber: "",
    doDate: todayISO(),
    cylinderSize: "KG12" as CylinderSize,
    orderedQty: "",
    driverName: "",
    helperName: "",
    vehicleNo: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const [poOptions, setPoOptions] = useState<PoOption[]>([]);
  const [poLoading, setPoLoading] = useState(false);
  const [selectedPo, setSelectedPo] = useState<PoOption | null>(null);

  useEffect(() => {
    setPoLoading(true);
    Promise.all([
      fetch(`/api/purchase-orders?status=CONFIRMED&page=1`).then((r) =>
        r.json(),
      ),
      fetch(`/api/purchase-orders?status=PARTIALLY_RECEIVED&page=1`).then((r) =>
        r.json(),
      ),
    ])
      .then(([d1, d2]) => setPoOptions([...(d1.pos ?? []), ...(d2.pos ?? [])]))
      .catch(() => setPoOptions([]))
      .finally(() => setPoLoading(false));
  }, []);

  function selectPo(po: PoOption | null) {
    setSelectedPo(po);
    set("poId", po?.id ?? "");
    if (po) {
      set("cylinderSize", po.cylinderSize as CylinderSize);
      const remaining = po.orderedQty - po.receivedQty;
      if (remaining > 0) set("orderedQty", String(remaining));
      const poDate = new Date(po.poDate);
      poDate.setDate(poDate.getDate() + 1);
      set("doDate", poDate.toISOString().split("T")[0]);
    }
  }

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
    if (!form.poId) e.poId = "Purchase Order is required.";
    if (!form.doDate) e.doDate = "Date is required.";
    if (!form.orderedQty || Number(form.orderedQty) <= 0)
      e.orderedQty = "Quantity must be > 0.";
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
      const res = await fetch("/api/delivery-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          orderedQty: Number(form.orderedQty),
          doNumber: form.doNumber.trim() || undefined,
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

  const cc = CYL_COLORS[form.cylinderSize];

  return (
    <>
      <div className="cd-ov" onClick={onClose} />
      <div className="cd-modal" style={{ width: 580 }}>
        <div className="cd-mhd">
          <div>
            <div className="cd-mtitle">Create Delivery Order</div>
            <div
              style={{ fontSize: 11, color: "var(--text-mid)", marginTop: 2 }}
            >
              DO must be linked to a PO · number auto-generated if blank
            </div>
          </div>
          <button className="cd-mclose" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="cd-mbdy">
          {/* PO selector */}
          <Field
            label="Purchase Order"
            required
            error={errors.poId}
            hint={
              poLoading
                ? "Loading open POs…"
                : `${poOptions.length} confirmed/partial POs available`
            }
          >
            <select
              className="cd-inp"
              style={errStyle("poId")}
              value={form.poId}
              disabled={poLoading}
              onChange={(e) =>
                selectPo(poOptions.find((p) => p.id === e.target.value) ?? null)
              }
            >
              <option value="">— Select a Purchase Order —</option>
              {poOptions.map((po) => (
                <option key={po.id} value={po.id}>
                  {po.poNumber} ·{" "}
                  {po.cylinderSize === "KG12" ? "12 Kg" : "50 Kg"} ·{" "}
                  {po.orderedQty - po.receivedQty} tbg rem · {po.branch.name}
                </option>
              ))}
            </select>

            {selectedPo && (
              <div
                style={{
                  marginTop: 8,
                  padding: "10px 14px",
                  background: "rgba(37,99,235,0.05)",
                  border: "1px solid rgba(37,99,235,0.15)",
                  borderRadius: "var(--radius-sm)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 20 }}>📋</span>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: "var(--accent)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {selectedPo.poNumber}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-mid)",
                      marginTop: 3,
                      display: "flex",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <span>👤 {selectedPo.customer.name}</span>
                    <span>🏢 {selectedPo.branch.name}</span>
                    <span>
                      Remaining:{" "}
                      <strong style={{ color: "#15803D" }}>
                        {selectedPo.orderedQty - selectedPo.receivedQty} tbg
                      </strong>
                    </span>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    color: "#D97706",
                    fontWeight: 700,
                    textAlign: "right",
                    maxWidth: 120,
                  }}
                >
                  → Closes PO on delivery
                </span>
              </div>
            )}
          </Field>

          {/* Date */}
          <Field
            label="DO Date"
            required
            error={errors.doDate}
            hint="Defaults to PO date + 1 day, can be changed"
          >
            <input
              type="date"
              className="cd-inp"
              style={errStyle("doDate")}
              value={form.doDate}
              onChange={(e) => set("doDate", e.target.value)}
            />
          </Field>

          {/* Cylinder size — locked from PO */}
          <Field label="Cylinder Size">
            {selectedPo ? (
              <div
                style={{
                  padding: "9px 18px",
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  color: cc.text,
                  background: cc.bg,
                  border: `2px solid ${cc.border}`,
                }}
              >
                🛢 {form.cylinderSize === "KG12" ? "12 Kg" : "50 Kg"}
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    color: "var(--text-low)",
                  }}
                >
                  (locked from PO)
                </span>
              </div>
            ) : (
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-low)",
                  fontStyle: "italic",
                  padding: "8px 0",
                }}
              >
                Select a PO first — cylinder size will be set automatically
              </div>
            )}
          </Field>

          {/* Qty */}
          <Field
            label="Qty for this trip (tabung)"
            required
            error={errors.orderedQty}
            hint="Multiple DOs per PO allowed — e.g. split across trucks"
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
              disabled={!selectedPo}
              onChange={(e) => set("orderedQty", e.target.value)}
            />
          </Field>

          {/* Dispatch info */}
          <div
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--text-mid)",
                letterSpacing: "0.07em",
                textTransform: "uppercase",
              }}
            >
              🚛 Dispatch Info
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 12,
              }}
            >
              <Field label="Driver Name">
                <input
                  className="cd-inp"
                  placeholder="e.g. Budi Santoso"
                  value={form.driverName}
                  onChange={(e) => set("driverName", e.target.value)}
                />
              </Field>
              <Field label="Helper Name">
                <input
                  className="cd-inp"
                  placeholder="e.g. Ahmad"
                  value={form.helperName}
                  onChange={(e) => set("helperName", e.target.value)}
                />
              </Field>
              <Field label="Vehicle No.">
                <input
                  className="cd-inp"
                  placeholder="L 1234 AB"
                  value={form.vehicleNo}
                  onChange={(e) => set("vehicleNo", e.target.value)}
                  style={{
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase",
                  }}
                />
              </Field>
            </div>
          </div>

          {/* DO Number + Notes */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Field label="DO Number" hint="Leave blank to auto-generate">
              <input
                className="cd-inp"
                placeholder="DO-SBY-202503-0001"
                value={form.doNumber}
                onChange={(e) => set("doNumber", e.target.value)}
              />
            </Field>
            <Field label="Notes">
              <textarea
                className="cd-inp"
                rows={2}
                style={{ resize: "vertical" }}
                placeholder="Any special instructions…"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
            </Field>
          </div>

          {apiError && <div className="cd-err">⚠ {apiError}</div>}
        </div>

        <div className="cd-mfoot">
          <button className="btn-gho" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            className="btn-pri"
            onClick={handleSave}
            disabled={saving || !selectedPo}
          >
            {saving ? "Creating…" : "Create Delivery Order"}
          </button>
        </div>
      </div>
    </>
  );
}
