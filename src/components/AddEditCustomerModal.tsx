"use client";

import { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Branch {
  id: string;
  code: string;
  name: string;
}

interface CustomerFormData {
  branchId: string;
  code: string;
  name: string;
  customerType: string;
  phone: string;
  email: string;
  address: string;
  npwp: string;
  creditLimitKg12: string;
  creditLimitKg50: string;
  isActive: boolean;
}

interface CustomerLike extends CustomerFormData {
  id: string;
}

interface Props {
  customer?: CustomerLike;
  branches: Branch[];
  onClose: () => void;
  onSaved: (customer: any) => void;
}

// ─── Validation ───────────────────────────────────────────────────────────────
const PHONE_RE = /^(\+62|62|0)[0-9]{8,13}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form: CustomerFormData): Record<string, string> {
  const err: Record<string, string> = {};

  if (!form.branchId) err.branchId = "Branch is required.";
  if (!form.name.trim()) err.name = "Name is required.";
  if (!form.customerType) err.customerType = "Customer type is required.";

  if (
    ["AGEN", "INDUSTRI"].includes(form.customerType) &&
    !form.address.trim()
  ) {
    err.address = "Address is required for Agen and Industri.";
  }

  const phone = form.phone.replace(/\s+/g, "");
  if (phone && !PHONE_RE.test(phone)) {
    err.phone = "Use Indonesian format: 0812xxxxxxx or +62812xxxxxxx";
  }

  if (form.email.trim() && !EMAIL_RE.test(form.email)) {
    err.email = "Invalid email address.";
  }

  if (
    form.creditLimitKg12 !== "" &&
    (!Number.isInteger(Number(form.creditLimitKg12)) ||
      Number(form.creditLimitKg12) < 0)
  ) {
    err.creditLimitKg12 = "Must be a non-negative whole number.";
  }

  if (
    form.creditLimitKg50 !== "" &&
    (!Number.isInteger(Number(form.creditLimitKg50)) ||
      Number(form.creditLimitKg50) < 0)
  ) {
    err.creditLimitKg50 = "Must be a non-negative whole number.";
  }

  return err;
}

// ─── Field — outside component to prevent remount on every render ─────────────
function Field({
  label,
  required,
  children,
  error,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
  hint?: string;
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

// ─── inputStyle — outside component ──────────────────────────────────────────
function inputStyle(
  errors: Record<string, string>,
  key: string,
): React.CSSProperties {
  return errors[key]
    ? {
        borderColor: "var(--danger)",
        boxShadow: "0 0 0 3px rgba(220,38,38,0.1)",
      }
    : {};
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AddEditCustomerModal({
  customer,
  branches,
  onClose,
  onSaved,
}: Props) {
  const isEdit = Boolean(customer);

  const [form, setForm] = useState<CustomerFormData>({
    branchId: customer?.branchId ?? "",
    code: customer?.code ?? "",
    name: customer?.name ?? "",
    customerType: customer?.customerType ?? "RETAIL",
    phone: customer?.phone ?? "",
    email: customer?.email ?? "",
    address: customer?.address ?? "",
    npwp: customer?.npwp ?? "",
    creditLimitKg12: String(customer?.creditLimitKg12 ?? "0"),
    creditLimitKg50: String(customer?.creditLimitKg50 ?? "0"),
    isActive: customer?.isActive ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    if (!["AGEN", "INDUSTRI"].includes(form.customerType)) {
      setErrors((e) => {
        const n = { ...e };
        delete n.address;
        return n;
      });
    }
  }, [form.customerType]);

  function set<K extends keyof CustomerFormData>(
    key: K,
    value: CustomerFormData[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => {
      const n = { ...e };
      delete n[key];
      return n;
    });
  }

  async function handleSave() {
    const fieldErrors = validate(form);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setSaving(true);
    setApiError("");

    try {
      const url = isEdit ? `/api/customers/${customer!.id}` : "/api/customers";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          creditLimitKg12: Number(form.creditLimitKg12) || 0,
          creditLimitKg50: Number(form.creditLimitKg50) || 0,
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

      onSaved(data);
      onClose();
    } catch (e: unknown) {
      setApiError(e instanceof Error ? e.message : "Unexpected error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="cd-ov" onClick={onClose} />
      <div
        className="cd-modal"
        style={{ width: 560 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="cd-mhd">
          <div className="cd-mtitle">
            {isEdit ? "Edit Customer" : "Add New Customer"}
          </div>
          <button className="cd-mclose" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="cd-mbdy">
          {/* Row: Branch + Type */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Field label="Branch" required error={errors.branchId}>
              <select
                className="cd-inp"
                style={inputStyle(errors, "branchId")}
                value={form.branchId}
                onChange={(e) => set("branchId", e.target.value)}
                disabled={isEdit}
              >
                <option value="">Select branch…</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Customer Type" required error={errors.customerType}>
              <select
                className="cd-inp"
                style={inputStyle(errors, "customerType")}
                value={form.customerType}
                onChange={(e) => set("customerType", e.target.value)}
              >
                <option value="RETAIL">Retail</option>
                <option value="AGEN">Agen</option>
                <option value="INDUSTRI">Industri</option>
              </select>
            </Field>
          </div>

          {/* Customer Code — shown but disabled on edit */}
          {isEdit && (
            <Field label="Customer Code">
              <input
                className="cd-inp"
                value={form.code}
                disabled
                style={{ opacity: 0.6, cursor: "not-allowed" }}
              />
            </Field>
          )}

          {/* Name */}
          <Field label="Full Name" required error={errors.name}>
            <input
              className="cd-inp"
              style={inputStyle(errors, "name")}
              placeholder="e.g. 1966 Coffee House"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </Field>

          {/* Phone */}
          <Field
            label="Phone"
            error={errors.phone}
            hint="Indonesian format: 0812xxxxxxx or +62812xxxxxxx"
          >
            <input
              className="cd-inp"
              style={inputStyle(errors, "phone")}
              placeholder="0812xxxxxxx"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </Field>

          {/* Email */}
          <Field label="Email" error={errors.email}>
            <input
              type="email"
              className="cd-inp"
              style={inputStyle(errors, "email")}
              placeholder="customer@example.com"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>

          {/* Address */}
          <Field
            label="Address"
            required={["AGEN", "INDUSTRI"].includes(form.customerType)}
            error={errors.address}
            hint={
              ["AGEN", "INDUSTRI"].includes(form.customerType)
                ? "Required for Agen and Industri."
                : undefined
            }
          >
            <textarea
              className="cd-inp"
              style={{ ...inputStyle(errors, "address"), resize: "vertical" }}
              rows={3}
              placeholder="Full address…"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
            />
          </Field>

          {/* NPWP */}
          <Field label="NPWP" hint="XX.XXX.XXX.X-XXX.XXX">
            <input
              className="cd-inp"
              placeholder="12.345.678.9-101.000"
              value={form.npwp}
              onChange={(e) => set("npwp", e.target.value)}
            />
          </Field>

          {/* Credit Limit — per cylinder size in tabung */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <Field
              label="Credit Limit 12 kg (tabung)"
              error={errors.creditLimitKg12}
            >
              <input
                type="number"
                className="cd-inp"
                style={inputStyle(errors, "creditLimitKg12")}
                placeholder="0"
                min="0"
                step="1"
                value={form.creditLimitKg12}
                onChange={(e) => set("creditLimitKg12", e.target.value)}
              />
            </Field>
            <Field
              label="Credit Limit 50 kg (tabung)"
              error={errors.creditLimitKg50}
            >
              <input
                type="number"
                className="cd-inp"
                style={inputStyle(errors, "creditLimitKg50")}
                placeholder="0"
                min="0"
                step="1"
                value={form.creditLimitKg50}
                onChange={(e) => set("creditLimitKg50", e.target.value)}
              />
            </Field>
          </div>

          {/* Status toggle */}
          <Field label="Status">
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
          </Field>

          {apiError && <div className="cd-err">⚠ {apiError}</div>}
        </div>

        {/* Footer */}
        <div className="cd-mfoot">
          <button className="btn-gho" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn-pri" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Customer"}
          </button>
        </div>
      </div>
    </>
  );
}
