"use client";

// src/components/WarehousePage.tsx
// Sprint 2 — Warehouse & Cylinder Stock
// Tabs: Stock Dashboard | Inbound (GR) | Empty Returns | Write-offs

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type CylSize = "KG12" | "KG50";
const CYL_LABELS: Record<CylSize, string> = {
  KG12: "12 kg",
  KG50: "50 kg",
};

interface Branch {
  id: string;
  code: string;
  name: string;
}
interface StockRow {
  id: string;
  cylinderSize: CylSize;
  fullQty: number;
  emptyQty: number;
  onTransitQty: number;
  stockDate: string;
}
interface HmtQuota {
  cylinderSize: CylSize;
  quotaQty: number;
  usedQty: number;
  pricePerUnit: string;
  branch: { code: string };
}
interface InboundRow {
  id: string;
  grNumber: string;
  receivedDate: string;
  cylinderSize: CylSize;
  receivedQty: number;
  goodQty: number;
  rejectQty: number;
  notes: string | null;
  supplierPo: { poNumber: string };
  receivedBy: { name: string };
}
interface ReturnRow {
  id: string;
  returnNumber: string;
  returnDate: string;
  cylinderSize: CylSize;
  returnedQty: number;
  sourceType: string;
  sourceRef: string | null;
  notes: string | null;
  recordedBy: { name: string };
}
interface WriteoffRow {
  id: string;
  writeoffNumber: string;
  writeoffDate: string;
  cylinderSize: CylSize;
  qty: number;
  reason: string;
  notes: string | null;
  createdBy: { name: string };
}
interface PoOption {
  id: string;
  poNumber: string;
  cylinderSize: CylSize;
  orderedQty: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString();
const today = () => new Date().toISOString().slice(0, 10);

// FIX: was incorrectly placed here at module level — moved into WarehousePage component body
// const [showStockForm, setShowStockForm] = useState(false);  ← REMOVED

const REASON_LABELS: Record<string, string> = {
  RUSAK_BERAT: "Rusak Berat",
  HILANG: "Hilang",
  KADALUARSA_UJI: "Kadaluarsa Uji",
  BOCOR_PARAH: "Bocor Parah",
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function WarehousePage({
  activeBranchId,
}: {
  activeBranchId: string;
}) {
  const [tab, setTab] = useState<"stock" | "inbound" | "returns" | "writeoff">(
    "stock",
  );

  // branch meta
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState(activeBranchId);

  // stock
  const [stock, setStock] = useState<StockRow[]>([]);
  const [hmtQuota, setHmtQuota] = useState<HmtQuota[]>([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [showStockForm, setShowStockForm] = useState(false); // FIX: moved here from module level

  // inbound
  const [inbound, setInbound] = useState<InboundRow[]>([]);
  const [inboundTotal, setInboundTotal] = useState(0);
  const [inboundPage, setInboundPage] = useState(1);
  const [inboundLoading, setInboundLoading] = useState(false);
  const [showGrForm, setShowGrForm] = useState(false);

  // empty returns
  const [returns, setReturns] = useState<ReturnRow[]>([]);
  const [returnsTotal, setReturnsTotal] = useState(0);
  const [returnsPage, setReturnsPage] = useState(1);
  const [returnsLoading, setReturnsLoading] = useState(false);
  const [showRetForm, setShowRetForm] = useState(false);

  // writeoffs
  const [writeoffs, setWriteoffs] = useState<WriteoffRow[]>([]);
  const [writeoffsTotal, setWriteoffsTotal] = useState(0);
  const [writeoffsPage, setWriteoffsPage] = useState(1);
  const [writeoffsLoading, setWriteoffsLoading] = useState(false);
  const [showWoForm, setShowWoForm] = useState(false);

  // PO options for GR form
  const [poOptions, setPoOptions] = useState<PoOption[]>([]);

  // ── Load branches once ────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/branches")
      .then((r) => r.json())
      .then(setBranches)
      .catch(() => {});
  }, []);

  // ── Load stock ────────────────────────────────────────────────────────────
  const loadStock = useCallback(async () => {
    if (!branchId) return;
    setStockLoading(true);
    try {
      const [stockRes, hmtRes] = await Promise.all([
        fetch(`/api/warehouse/stock?branchId=${branchId}`).then((r) =>
          r.json(),
        ),
        fetch(`/api/suppliers`).then((r) => r.json()),
      ]);
      setStock(Array.isArray(stockRes) ? stockRes : []);

      // Flatten HMT quotas for current month
      if (Array.isArray(hmtRes) && hmtRes.length > 0) {
        const supplierId = hmtRes[0]?.id;
        if (supplierId) {
          const now = new Date();
          const q = await fetch(
            `/api/suppliers/${supplierId}/hmt-quota?year=${now.getFullYear()}&month=${now.getMonth() + 1}`,
          ).then((r) => r.json());
          setHmtQuota(
            Array.isArray(q)
              ? q.filter(
                  (x: HmtQuota) =>
                    x.branch?.code ===
                    branches.find((b) => b.id === branchId)?.code,
                )
              : [],
          );
        }
      }
    } finally {
      setStockLoading(false);
    }
  }, [branchId, branches]);

  // ── Load inbound ──────────────────────────────────────────────────────────
  const loadInbound = useCallback(async () => {
    if (!branchId) return;
    setInboundLoading(true);
    try {
      const data = await fetch(
        `/api/warehouse/inbound?branchId=${branchId}&page=${inboundPage}&limit=20`,
      ).then((r) => r.json());
      setInbound(data.rows ?? []);
      setInboundTotal(data.total ?? 0);
    } finally {
      setInboundLoading(false);
    }
  }, [branchId, inboundPage]);

  // ── Load returns ──────────────────────────────────────────────────────────
  const loadReturns = useCallback(async () => {
    if (!branchId) return;
    setReturnsLoading(true);
    try {
      const data = await fetch(
        `/api/warehouse/empty-return?branchId=${branchId}&page=${returnsPage}&limit=20`,
      ).then((r) => r.json());
      setReturns(data.rows ?? []);
      setReturnsTotal(data.total ?? 0);
    } finally {
      setReturnsLoading(false);
    }
  }, [branchId, returnsPage]);

  // ── Load writeoffs ────────────────────────────────────────────────────────
  const loadWriteoffs = useCallback(async () => {
    if (!branchId) return;
    setWriteoffsLoading(true);
    try {
      const data = await fetch(
        `/api/warehouse/writeoff?branchId=${branchId}&page=${writeoffsPage}&limit=20`,
      ).then((r) => r.json());
      setWriteoffs(data.rows ?? []);
      setWriteoffsTotal(data.total ?? 0);
    } finally {
      setWriteoffsLoading(false);
    }
  }, [branchId, writeoffsPage]);

  // ── Load PO options for GR form ───────────────────────────────────────────
  const loadPoOptions = useCallback(async () => {
    if (!branchId) return;
    const data = await fetch(
      `/api/purchase-orders?branchId=${branchId}&status=CONFIRMED&status=SUBMITTED&limit=100`,
    )
      .then((r) => r.json())
      .catch(() => ({ rows: [] }));
    setPoOptions(data.rows ?? []);
  }, [branchId]);

  useEffect(() => {
    loadStock();
  }, [loadStock]);
  useEffect(() => {
    if (tab === "inbound") loadInbound();
  }, [tab, loadInbound]);
  useEffect(() => {
    if (tab === "returns") loadReturns();
  }, [tab, loadReturns]);
  useEffect(() => {
    if (tab === "writeoff") loadWriteoffs();
  }, [tab, loadWriteoffs]);

  const branchLabel = branches.find((b) => b.id === branchId)?.code ?? "—";

  // ─────────────────────────────────────────────────────────────────────────
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
          <span style={{ color: "var(--accent)" }}>WAREHOUSE</span>
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
              Warehouse
            </div>
            <div
              style={{ fontSize: 11, color: "var(--text-mid)", marginTop: 4 }}
            >
              Stock · Inbound (GR) · Empty Returns · Write-offs
            </div>
          </div>
          {/* Branch filter */}
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
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
        </div>
      </div>

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: 2,
          borderBottom: "2px solid var(--border)",
          marginBottom: 24,
        }}
      >
        {(["stock", "inbound", "returns", "writeoff"] as const).map((t) => {
          const labels = {
            stock: "📦 Stock Dashboard",
            inbound: "📥 Inbound (GR)",
            returns: "↩️ Empty Returns",
            writeoff: "✂️ Write-offs",
          };
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "10px 18px",
                border: "none",
                background: "transparent",
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                fontWeight: tab === t ? 700 : 400,
                color: tab === t ? "var(--accent)" : "var(--text-mid)",
                cursor: "pointer",
                borderBottom:
                  tab === t
                    ? "2px solid var(--accent)"
                    : "2px solid transparent",
                marginBottom: -2,
                transition: "all 0.12s",
              }}
            >
              {labels[t]}
            </button>
          );
        })}
      </div>

      {/* ── TAB: STOCK DASHBOARD ── */}
      {tab === "stock" && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 16,
            }}
          >
            <button
              className="btn-gho"
              onClick={() => setShowStockForm((v) => !v)}
            >
              ✏️ Adjust Stock
            </button>
          </div>
          {showStockForm && (
            <ManualStockForm
              branchId={branchId}
              onClose={() => setShowStockForm(false)}
              onSaved={() => {
                setShowStockForm(false);
                loadStock();
              }}
            />
          )}

          <div>
            {stockLoading ? (
              <div style={{ color: "var(--text-low)", fontSize: 13 }}>
                Loading stock…
              </div>
            ) : (
              <>
                {/* Stock cards */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(240px, 1fr))",
                    gap: 16,
                    marginBottom: 32,
                  }}
                >
                  {(["KG12", "KG50"] as CylSize[]).map((size) => {
                    const row = stock.find((s) => s.cylinderSize === size);
                    const quota = hmtQuota.find((q) => q.cylinderSize === size);
                    const pct = quota
                      ? Math.round(
                          (quota.usedQty / Math.max(1, quota.quotaQty)) * 100,
                        )
                      : null;
                    const warn = pct !== null && pct >= 90;
                    return (
                      <div
                        key={size}
                        style={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-md)",
                          padding: 20,
                          borderTop: `3px solid ${
                            warn ? "var(--danger)" : "var(--accent)"
                          }`,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "var(--text-low)",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            marginBottom: 12,
                          }}
                        >
                          {CYL_LABELS[size]}
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            gap: 8,
                            marginBottom: 12,
                          }}
                        >
                          {[
                            {
                              label: "Full",
                              val: row?.fullQty ?? 0,
                              color: "var(--accent)",
                            },
                            {
                              label: "Empty",
                              val: row?.emptyQty ?? 0,
                              color: "var(--text-mid)",
                            },
                            {
                              label: "Transit",
                              val: row?.onTransitQty ?? 0,
                              color: "#F59E0B",
                            },
                          ].map(({ label, val, color }) => (
                            <div key={label} style={{ textAlign: "center" }}>
                              <div
                                style={{
                                  fontSize: 20,
                                  fontWeight: 900,
                                  color,
                                  lineHeight: 1,
                                }}
                              >
                                {fmt(val)}
                              </div>
                              <div
                                style={{
                                  fontSize: 10,
                                  color: "var(--text-low)",
                                  marginTop: 2,
                                }}
                              >
                                {label}
                              </div>
                            </div>
                          ))}
                        </div>
                        {quota && (
                          <div>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontSize: 10,
                                color: warn
                                  ? "var(--danger)"
                                  : "var(--text-low)",
                                marginBottom: 4,
                              }}
                            >
                              <span>HMT Quota</span>
                              <span>
                                {fmt(quota.usedQty)} / {fmt(quota.quotaQty)} (
                                {pct ?? 0}%)
                              </span>
                            </div>
                            <div
                              style={{
                                height: 5,
                                background: "var(--border)",
                                borderRadius: 3,
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  height: "100%",
                                  width: `${Math.min(100, pct ?? 0)}%`,
                                  background: warn
                                    ? "var(--danger)"
                                    : "var(--accent)",
                                  transition: "width 0.4s",
                                  borderRadius: 3,
                                }}
                              />
                            </div>
                          </div>
                        )}
                        {row?.stockDate && (
                          <div
                            style={{
                              fontSize: 10,
                              color: "var(--text-low)",
                              marginTop: 8,
                            }}
                          >
                            Last update:{" "}
                            {new Date(row.stockDate).toLocaleDateString(
                              "id-ID",
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {stock.length === 0 && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "60px 0",
                      color: "var(--text-low)",
                      fontSize: 13,
                    }}
                  >
                    No stock data yet. Record an inbound receiving to start
                    tracking.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: INBOUND (GR) ── */}
      {tab === "inbound" && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 16,
            }}
          >
            <button
              className="btn-pri"
              onClick={() => {
                loadPoOptions();
                setShowGrForm(true);
              }}
            >
              + Record GR
            </button>
          </div>

          {showGrForm && (
            <GrForm
              branchId={branchId}
              poOptions={poOptions}
              onClose={() => setShowGrForm(false)}
              onSaved={() => {
                setShowGrForm(false);
                loadInbound();
                loadStock();
              }}
            />
          )}

          <ListTable
            loading={inboundLoading}
            cols={[
              "GR Number",
              "Date",
              "PO",
              "Size",
              "Rcvd",
              "Good",
              "Reject",
              "By",
            ]}
            rows={inbound.map((r) => [
              r.grNumber,
              new Date(r.receivedDate).toLocaleDateString("id-ID"),
              r.supplierPo?.poNumber ?? "—",
              CYL_LABELS[r.cylinderSize],
              fmt(r.receivedQty),
              fmt(r.goodQty),
              r.rejectQty > 0 ? (
                <span style={{ color: "var(--danger)" }}>{r.rejectQty}</span>
              ) : (
                "0"
              ),
              r.receivedBy?.name ?? "—",
            ])}
            total={inboundTotal}
            page={inboundPage}
            onPage={setInboundPage}
            emptyMsg="No inbound records yet."
            emptyIcon="📥"
          />
        </div>
      )}

      {/* ── TAB: EMPTY RETURNS ── */}
      {tab === "returns" && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 16,
            }}
          >
            <button className="btn-pri" onClick={() => setShowRetForm(true)}>
              + Record Return
            </button>
          </div>

          {showRetForm && (
            <ReturnForm
              branchId={branchId}
              onClose={() => setShowRetForm(false)}
              onSaved={() => {
                setShowRetForm(false);
                loadReturns();
                loadStock();
              }}
            />
          )}

          <ListTable
            loading={returnsLoading}
            cols={["Return #", "Date", "Size", "Qty", "Source", "Ref", "By"]}
            rows={returns.map((r) => [
              r.returnNumber,
              new Date(r.returnDate).toLocaleDateString("id-ID"),
              CYL_LABELS[r.cylinderSize],
              fmt(r.returnedQty),
              r.sourceType,
              r.sourceRef ?? "—",
              r.recordedBy?.name ?? "—",
            ])}
            total={returnsTotal}
            page={returnsPage}
            onPage={setReturnsPage}
            emptyMsg="No empty returns recorded yet."
            emptyIcon="↩️"
          />
        </div>
      )}

      {/* ── TAB: WRITE-OFFS ── */}
      {tab === "writeoff" && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 16,
            }}
          >
            <button className="btn-pri" onClick={() => setShowWoForm(true)}>
              + Record Write-off
            </button>
          </div>

          {showWoForm && (
            <WriteoffForm
              branchId={branchId}
              onClose={() => setShowWoForm(false)}
              onSaved={() => {
                setShowWoForm(false);
                loadWriteoffs();
                loadStock();
              }}
            />
          )}

          <ListTable
            loading={writeoffsLoading}
            cols={["WO Number", "Date", "Size", "Qty", "Reason", "Notes", "By"]}
            rows={writeoffs.map((r) => [
              r.writeoffNumber,
              new Date(r.writeoffDate).toLocaleDateString("id-ID"),
              CYL_LABELS[r.cylinderSize],
              <span style={{ color: "var(--danger)", fontWeight: 700 }}>
                {fmt(r.qty)}
              </span>,
              REASON_LABELS[r.reason] ?? r.reason,
              r.notes ?? "—",
              r.createdBy?.name ?? "—",
            ])}
            total={writeoffsTotal}
            page={writeoffsPage}
            onPage={setWriteoffsPage}
            emptyMsg="No write-offs recorded yet."
            emptyIcon="✂️"
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

// ── Reusable table ────────────────────────────────────────────────────────────
function ListTable({
  loading,
  cols,
  rows,
  total,
  page,
  onPage,
  emptyMsg,
  emptyIcon,
}: {
  loading: boolean;
  cols: string[];
  rows: (React.ReactNode | string | number)[][];
  total: number;
  page: number;
  onPage: (p: number) => void;
  emptyMsg: string;
  emptyIcon: string;
}) {
  const limit = 20;
  const pages = Math.ceil(total / limit);

  return (
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
            {cols.map((c) => (
              <th
                key={c}
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
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                {cols.map((_, j) => (
                  <td key={j} style={{ padding: "12px 14px" }}>
                    <div
                      style={{
                        height: 12,
                        background: "var(--border)",
                        borderRadius: 3,
                        width: "60%",
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
                colSpan={cols.length}
                style={{
                  padding: "60px 0",
                  textAlign: "center",
                  color: "var(--text-low)",
                  fontSize: 13,
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>{emptyIcon}</div>
                {emptyMsg}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={i}
                style={{
                  borderBottom: "1px solid var(--border)",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLTableRowElement).style.background =
                    "var(--bg)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLTableRowElement).style.background =
                    "")
                }
              >
                {row.map((cell, j) => (
                  <td
                    key={j}
                    style={{
                      padding: "11px 14px",
                      color: "var(--text-hi)",
                      verticalAlign: "middle",
                    }}
                  >
                    {cell}
                  </td>
                ))}
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
              onClick={() => onPage(i + 1)}
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
  );
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────
function ModalForm({
  title,
  onClose,
  onSubmit,
  saving,
  children,
}: {
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  saving: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: 24,
        marginBottom: 24,
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
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
          {title}
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
        {children}
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
        <button className="btn-pri" onClick={onSubmit} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

// ── FormField ─────────────────────────────────────────────────────────────────
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

// ── GR Form ───────────────────────────────────────────────────────────────────
function GrForm({
  branchId,
  poOptions,
  onClose,
  onSaved,
}: {
  branchId: string;
  poOptions: PoOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    supplierPoId: "",
    grNumber: `GR-${Date.now()}`,
    receivedDate: today(),
    cylinderSize: "KG12" as CylSize,
    receivedQty: "",
    goodQty: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Auto-fill cylinderSize from chosen PO
  useEffect(() => {
    const po = poOptions.find((p) => p.id === form.supplierPoId);
    if (po) setForm((f) => ({ ...f, cylinderSize: po.cylinderSize }));
  }, [form.supplierPoId, poOptions]);

  // Auto-fill goodQty when receivedQty changes
  const set = (k: string, v: string) => {
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (k === "receivedQty") next.goodQty = v;
      return next;
    });
  };

  async function handleSubmit() {
    setSaving(true);
    setErrors({});
    try {
      const res = await fetch("/api/warehouse/inbound", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          branchId,
          receivedQty: Number(form.receivedQty),
          goodQty: Number(form.goodQty),
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
    <ModalForm
      title="Record Goods Receipt (GR)"
      onClose={onClose}
      onSubmit={handleSubmit}
      saving={saving}
    >
      <FormField label="Supplier PO" error={errors.supplierPoId}>
        <select
          value={form.supplierPoId}
          onChange={(e) => set("supplierPoId", e.target.value)}
          style={fieldStyle}
        >
          <option value="">— Select PO —</option>
          {poOptions.map((po) => (
            <option key={po.id} value={po.id}>
              {po.poNumber} · {CYL_LABELS[po.cylinderSize]} ×{" "}
              {fmt(po.orderedQty)}
            </option>
          ))}
        </select>
      </FormField>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormField label="GR Number" error={errors.grNumber}>
          <input
            value={form.grNumber}
            onChange={(e) => set("grNumber", e.target.value)}
            style={fieldStyle}
          />
        </FormField>
        <FormField label="Received Date" error={errors.receivedDate}>
          <input
            type="date"
            value={form.receivedDate}
            onChange={(e) => set("receivedDate", e.target.value)}
            style={fieldStyle}
          />
        </FormField>
      </div>
      <FormField label="Cylinder Size" error={errors.cylinderSize}>
        <select
          value={form.cylinderSize}
          onChange={(e) => set("cylinderSize", e.target.value)}
          style={fieldStyle}
        >
          {(Object.keys(CYL_LABELS) as CylSize[]).map((s) => (
            <option key={s} value={s}>
              {CYL_LABELS[s]}
            </option>
          ))}
        </select>
      </FormField>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormField label="Received Qty" error={errors.receivedQty}>
          <input
            type="number"
            min={1}
            value={form.receivedQty}
            onChange={(e) => set("receivedQty", e.target.value)}
            style={fieldStyle}
          />
        </FormField>
        <FormField label="Good Qty" error={errors.goodQty}>
          <input
            type="number"
            min={0}
            value={form.goodQty}
            onChange={(e) => set("goodQty", e.target.value)}
            style={fieldStyle}
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
    </ModalForm>
  );
}

// ── Return Form ───────────────────────────────────────────────────────────────
function ReturnForm({
  branchId,
  onClose,
  onSaved,
}: {
  branchId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    returnNumber: `RET-${Date.now()}`,
    returnDate: today(),
    cylinderSize: "KG12" as CylSize,
    returnedQty: "",
    sourceType: "CUSTOMER",
    sourceRef: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit() {
    setSaving(true);
    setErrors({});
    try {
      const res = await fetch("/api/warehouse/empty-return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          branchId,
          returnedQty: Number(form.returnedQty),
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
    <ModalForm
      title="Record Empty Return"
      onClose={onClose}
      onSubmit={handleSubmit}
      saving={saving}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormField label="Return Number" error={errors.returnNumber}>
          <input
            value={form.returnNumber}
            onChange={(e) => set("returnNumber", e.target.value)}
            style={fieldStyle}
          />
        </FormField>
        <FormField label="Return Date" error={errors.returnDate}>
          <input
            type="date"
            value={form.returnDate}
            onChange={(e) => set("returnDate", e.target.value)}
            style={fieldStyle}
          />
        </FormField>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormField label="Cylinder Size" error={errors.cylinderSize}>
          <select
            value={form.cylinderSize}
            onChange={(e) => set("cylinderSize", e.target.value)}
            style={fieldStyle}
          >
            {(Object.keys(CYL_LABELS) as CylSize[]).map((s) => (
              <option key={s} value={s}>
                {CYL_LABELS[s]}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Returned Qty" error={errors.returnedQty}>
          <input
            type="number"
            min={1}
            value={form.returnedQty}
            onChange={(e) => set("returnedQty", e.target.value)}
            style={fieldStyle}
          />
        </FormField>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormField label="Source Type" error={errors.sourceType}>
          <select
            value={form.sourceType}
            onChange={(e) => set("sourceType", e.target.value)}
            style={fieldStyle}
          >
            <option value="CUSTOMER">Customer</option>
            <option value="DRIVER">Driver</option>
            <option value="DEPOT">Depot</option>
          </select>
        </FormField>
        <FormField label="Source Ref (name/code)" error={errors.sourceRef}>
          <input
            value={form.sourceRef}
            onChange={(e) => set("sourceRef", e.target.value)}
            style={fieldStyle}
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
    </ModalForm>
  );
}

// ── Writeoff Form ─────────────────────────────────────────────────────────────
function WriteoffForm({
  branchId,
  onClose,
  onSaved,
}: {
  branchId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    writeoffNumber: `WO-${Date.now()}`,
    writeoffDate: today(),
    cylinderSize: "KG12" as CylSize,
    qty: "",
    reason: "RUSAK_BERAT",
    serialNumbers: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit() {
    setSaving(true);
    setErrors({});
    try {
      const res = await fetch("/api/warehouse/writeoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, branchId, qty: Number(form.qty) }),
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
    <ModalForm
      title="Record Write-off (WO)"
      onClose={onClose}
      onSubmit={handleSubmit}
      saving={saving}
    >
      <FormField label="WO Number" error={errors.writeoffNumber}>
        <input
          value={form.writeoffNumber}
          onChange={(e) => set("writeoffNumber", e.target.value)}
          style={fieldStyle}
        />
      </FormField>
      <FormField label="Date" error={errors.writeoffDate}>
        <input
          type="date"
          value={form.writeoffDate}
          onChange={(e) => set("writeoffDate", e.target.value)}
          style={fieldStyle}
        />
      </FormField>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormField label="Cylinder Size" error={errors.cylinderSize}>
          <select
            value={form.cylinderSize}
            onChange={(e) => set("cylinderSize", e.target.value)}
            style={fieldStyle}
          >
            {(Object.keys(CYL_LABELS) as CylSize[]).map((s) => (
              <option key={s} value={s}>
                {CYL_LABELS[s]}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Qty" error={errors.qty}>
          <input
            type="number"
            min={1}
            value={form.qty}
            onChange={(e) => set("qty", e.target.value)}
            style={fieldStyle}
          />
        </FormField>
      </div>
      <FormField label="Reason" error={errors.reason}>
        <select
          value={form.reason}
          onChange={(e) => set("reason", e.target.value)}
          style={fieldStyle}
        >
          {Object.entries(REASON_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </FormField>
      <FormField
        label="Serial Numbers (comma-separated, optional)"
        error={errors.serialNumbers}
      >
        <input
          value={form.serialNumbers}
          onChange={(e) => set("serialNumbers", e.target.value)}
          style={fieldStyle}
          placeholder="e.g. SN001, SN002"
        />
      </FormField>
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
    </ModalForm>
  );
}

// ── ManualStockForm ───────────────────────────────────────────────────────────
function ManualStockForm({
  branchId,
  onClose,
  onSaved,
}: {
  branchId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    cylinderSize: "KG12" as CylSize,
    stockDate: today(),
    fullQty: "",
    emptyQty: "",
    onTransitQty: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    setSaving(true);
    setErrors({});
    try {
      const res = await fetch("/api/warehouse/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId,
          cylinderSize: form.cylinderSize,
          stockDate: form.stockDate,
          fullQty: Number(form.fullQty || 0),
          emptyQty: Number(form.emptyQty || 0),
          onTransitQty: Number(form.onTransitQty || 0),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ _: data.error ?? "Failed." });
        return;
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalForm
      title="Adjust Stock (Manual)"
      onClose={onClose}
      onSubmit={handleSubmit}
      saving={saving}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormField label="Cylinder Size" error={errors.cylinderSize}>
          <select
            value={form.cylinderSize}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                cylinderSize: e.target.value as CylSize,
              }))
            }
            style={fieldStyle}
          >
            {(Object.keys(CYL_LABELS) as CylSize[]).map((s) => (
              <option key={s} value={s}>
                {CYL_LABELS[s]}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Stock Date" error={errors.stockDate}>
          <input
            type="date"
            value={form.stockDate}
            onChange={(e) =>
              setForm((f) => ({ ...f, stockDate: e.target.value }))
            }
            style={fieldStyle}
          />
        </FormField>
      </div>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}
      >
        <FormField label="Full Qty" error={errors.fullQty}>
          <input
            type="number"
            min={0}
            value={form.fullQty}
            onChange={(e) =>
              setForm((f) => ({ ...f, fullQty: e.target.value }))
            }
            style={fieldStyle}
          />
        </FormField>
        <FormField label="Empty Qty" error={errors.emptyQty}>
          <input
            type="number"
            min={0}
            value={form.emptyQty}
            onChange={(e) =>
              setForm((f) => ({ ...f, emptyQty: e.target.value }))
            }
            style={fieldStyle}
          />
        </FormField>
        <FormField label="On Transit" error={errors.onTransitQty}>
          <input
            type="number"
            min={0}
            value={form.onTransitQty}
            onChange={(e) =>
              setForm((f) => ({ ...f, onTransitQty: e.target.value }))
            }
            style={fieldStyle}
          />
        </FormField>
      </div>
      {errors._ && (
        <div style={{ color: "var(--danger)", fontSize: 12 }}>{errors._}</div>
      )}
    </ModalForm>
  );
}
