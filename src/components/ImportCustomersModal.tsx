"use client";

import { useState, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface RowResult {
  row: number;
  code: string;
  name: string;
  status: "imported" | "skipped" | "error";
  reason?: string;
}

interface ImportSummary {
  total: number;
  imported: number;
  skipped: number;
  errors: number;
}

interface Props {
  onClose: () => void;
  onImported: (count: number) => void;
}

type Stage = "idle" | "uploading" | "done" | "error";

// ─── Status badge helper ───────────────────────────────────────────────────────
const STATUS_STYLE: Record<
  RowResult["status"],
  { color: string; bg: string; label: string }
> = {
  imported: { color: "#15803D", bg: "rgba(21,128,61,0.08)", label: "Imported" },
  skipped: { color: "#D97706", bg: "rgba(217,119,6,0.08)", label: "Skipped" },
  error: { color: "#DC2626", bg: "rgba(220,38,38,0.08)", label: "Error" },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function ImportCustomersModal({ onClose, onImported }: Props) {
  const [stage, setStage] = useState<Stage>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [results, setResults] = useState<RowResult[]>([]);
  const [apiError, setApiError] = useState("");
  const [filter, setFilter] = useState<"all" | RowResult["status"]>("all");

  const inputRef = useRef<HTMLInputElement>(null);

  // ── Drag & Drop ──────────────────────────────────────────────────────────────
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (
      dropped &&
      (dropped.name.endsWith(".xlsx") || dropped.name.endsWith(".xls"))
    ) {
      setFile(dropped);
    }
  }, []);

  // ── Upload ───────────────────────────────────────────────────────────────────
  async function handleUpload() {
    if (!file) return;
    setStage("uploading");
    setApiError("");

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/customers/import", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);

      setSummary(data.summary);
      setResults(data.results ?? []);
      setStage("done");
      if (data.summary.imported > 0) onImported(data.summary.imported);
    } catch (e: unknown) {
      setApiError(e instanceof Error ? e.message : "Import failed.");
      setStage("error");
    }
  }

  const filtered =
    filter === "all" ? results : results.filter((r) => r.status === filter);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="cd-ov" onClick={onClose} />
      <div
        className="cd-modal"
        style={{ width: 620, maxHeight: "calc(100vh - 48px)" }}
      >
        {/* Header */}
        <div className="cd-mhd">
          <div>
            <div className="cd-mtitle">Import Customers</div>
            <div
              style={{ fontSize: 11, color: "var(--text-mid)", marginTop: 2 }}
            >
              Excel import · max 500 rows per file
            </div>
          </div>
          <button className="cd-mclose" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="cd-mbdy">
          {/* ── Stage: idle / pick file ── */}
          {(stage === "idle" || stage === "error") && (
            <>
              {/* Download template */}
              <div
                style={{
                  background: "rgba(37,99,235,0.05)",
                  border: "1px solid rgba(37,99,235,0.15)",
                  borderRadius: "var(--radius-sm)",
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--text-hi)",
                    }}
                  >
                    📥 Download Template
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-mid)",
                      marginTop: 2,
                    }}
                  >
                    Use the official template with correct columns and sample
                    data.
                  </div>
                </div>
                <a
                  href="/api/customers/import/template"
                  download="customer_import_template.xlsx"
                  style={{
                    background: "var(--accent)",
                    color: "#fff",
                    borderRadius: "var(--radius-sm)",
                    padding: "7px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  Download .xlsx
                </a>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragging ? "var(--accent)" : file ? "var(--success)" : "var(--border)"}`,
                  borderRadius: "var(--radius-md)",
                  padding: "32px 24px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: dragging
                    ? "rgba(37,99,235,0.03)"
                    : file
                      ? "rgba(21,128,61,0.03)"
                      : "var(--bg)",
                  transition: "all 0.15s",
                }}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setFile(f);
                  }}
                />
                <div style={{ fontSize: 28, marginBottom: 8 }}>
                  {file ? "✅" : "📂"}
                </div>
                {file ? (
                  <>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--success)",
                      }}
                    >
                      {file.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-mid)",
                        marginTop: 4,
                      }}
                    >
                      {(file.size / 1024).toFixed(1)} KB — Click to change file
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--text-hi)",
                      }}
                    >
                      Drop your Excel file here, or click to browse
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-mid)",
                        marginTop: 4,
                      }}
                    >
                      Supports .xlsx · Paste your customer data starting from
                      row 4
                    </div>
                  </>
                )}
              </div>

              {/* Format reminder */}
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-low)",
                  lineHeight: 1.7,
                }}
              >
                <strong style={{ color: "var(--text-mid)" }}>
                  Required columns:
                </strong>{" "}
                branch_code*, customer_code*, name*, customer_type*
                (RETAIL/AGEN/INDUSTRI), is_active*
                <br />
                <strong style={{ color: "var(--text-mid)" }}>
                  Optional:
                </strong>{" "}
                phone, email, address (required for AGEN/INDUSTRI), npwp,
                credit_limit
              </div>

              {apiError && <div className="cd-err">⚠ {apiError}</div>}
            </>
          )}

          {/* ── Stage: uploading ── */}
          {stage === "uploading" && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-hi)",
                }}
              >
                Importing customers…
              </div>
              <div
                style={{ fontSize: 11, color: "var(--text-mid)", marginTop: 4 }}
              >
                This may take a moment for large files.
              </div>
            </div>
          )}

          {/* ── Stage: done — show summary + results ── */}
          {stage === "done" && summary && (
            <>
              {/* Summary cards */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 10,
                }}
              >
                {[
                  {
                    label: "Total Rows",
                    value: summary.total,
                    color: "var(--accent)",
                  },
                  {
                    label: "Imported",
                    value: summary.imported,
                    color: "var(--success)",
                  },
                  {
                    label: "Skipped",
                    value: summary.skipped,
                    color: "#D97706",
                  },
                  {
                    label: "Errors",
                    value: summary.errors,
                    color: "var(--danger)",
                  },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    style={{
                      background: "var(--bg)",
                      border: "1px solid var(--border)",
                      borderTop: `3px solid ${color}`,
                      borderRadius: "var(--radius-sm)",
                      padding: "12px 10px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 22, fontWeight: 900, color }}>
                      {value}
                    </div>
                    <div
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "var(--text-low)",
                        marginTop: 3,
                      }}
                    >
                      {label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Filter tabs */}
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  borderBottom: "1px solid var(--border)",
                  paddingBottom: 8,
                }}
              >
                {(["all", "imported", "skipped", "error"] as const).map((f) => {
                  const count =
                    f === "all"
                      ? results.length
                      : results.filter((r) => r.status === f).length;
                  const active = filter === f;
                  return (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      style={{
                        background: active ? "var(--accent)" : "transparent",
                        border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                        borderRadius: "var(--radius-sm)",
                        padding: "4px 10px",
                        fontSize: 11,
                        fontWeight: 600,
                        color: active ? "#fff" : "var(--text-mid)",
                        cursor: "pointer",
                      }}
                    >
                      {f === "all"
                        ? "All"
                        : f.charAt(0).toUpperCase() + f.slice(1)}{" "}
                      ({count})
                    </button>
                  );
                })}
              </div>

              {/* Results table */}
              <div
                style={{
                  maxHeight: 260,
                  overflowY: "auto",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 11,
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: "var(--bg)",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <th
                        style={{
                          padding: "7px 10px",
                          textAlign: "left",
                          color: "var(--text-low)",
                          fontWeight: 700,
                          letterSpacing: "0.07em",
                          textTransform: "uppercase",
                          fontSize: 9,
                        }}
                      >
                        Row
                      </th>
                      <th
                        style={{
                          padding: "7px 10px",
                          textAlign: "left",
                          color: "var(--text-low)",
                          fontWeight: 700,
                          letterSpacing: "0.07em",
                          textTransform: "uppercase",
                          fontSize: 9,
                        }}
                      >
                        Code
                      </th>
                      <th
                        style={{
                          padding: "7px 10px",
                          textAlign: "left",
                          color: "var(--text-low)",
                          fontWeight: 700,
                          letterSpacing: "0.07em",
                          textTransform: "uppercase",
                          fontSize: 9,
                        }}
                      >
                        Name
                      </th>
                      <th
                        style={{
                          padding: "7px 10px",
                          textAlign: "left",
                          color: "var(--text-low)",
                          fontWeight: 700,
                          letterSpacing: "0.07em",
                          textTransform: "uppercase",
                          fontSize: 9,
                        }}
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => {
                      const s = STATUS_STYLE[r.status];
                      return (
                        <tr
                          key={r.row}
                          style={{
                            borderBottom: "1px solid var(--border-muted)",
                          }}
                        >
                          <td
                            style={{
                              padding: "6px 10px",
                              color: "var(--text-low)",
                              fontFamily: "var(--font-mono)",
                            }}
                          >
                            {r.row}
                          </td>
                          <td
                            style={{
                              padding: "6px 10px",
                              color: "var(--text-mid)",
                              fontFamily: "var(--font-mono)",
                              fontSize: 10,
                            }}
                          >
                            {r.code}
                          </td>
                          <td
                            style={{
                              padding: "6px 10px",
                              color: "var(--text-hi)",
                              fontWeight: 600,
                            }}
                          >
                            {r.name}
                          </td>
                          <td style={{ padding: "6px 10px" }}>
                            <div>
                              <span
                                style={{
                                  background: s.bg,
                                  color: s.color,
                                  borderRadius: 4,
                                  padding: "2px 7px",
                                  fontSize: 9,
                                  fontWeight: 700,
                                  letterSpacing: "0.07em",
                                  textTransform: "uppercase",
                                }}
                              >
                                {s.label}
                              </span>
                              {r.reason && (
                                <div
                                  style={{
                                    fontSize: 10,
                                    color: "var(--text-low)",
                                    marginTop: 2,
                                  }}
                                >
                                  {r.reason}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          style={{
                            padding: "20px",
                            textAlign: "center",
                            color: "var(--text-low)",
                            fontSize: 12,
                          }}
                        >
                          No rows to show.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="cd-mfoot">
          {stage === "done" ? (
            <button className="btn-pri" onClick={onClose}>
              Close
            </button>
          ) : (
            <>
              <button
                className="btn-gho"
                onClick={onClose}
                disabled={stage === "uploading"}
              >
                Cancel
              </button>
              <button
                className="btn-pri"
                onClick={handleUpload}
                disabled={!file || stage === "uploading"}
              >
                {stage === "uploading" ? "Importing…" : "Import Customers"}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
