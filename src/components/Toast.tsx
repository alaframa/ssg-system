"use client";

import { useEffect, useState } from "react";

export type ToastType = "info" | "success" | "warning" | "error";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

// ── Styles per type ────────────────────────────────────────────────────────────
const TOAST_STYLES: Record<
  ToastType,
  { bg: string; border: string; color: string; icon: string }
> = {
  info: {
    bg: "rgba(37,99,235,0.08)",
    border: "rgba(37,99,235,0.25)",
    color: "#2563EB",
    icon: "ℹ",
  },
  success: {
    bg: "rgba(21,128,61,0.08)",
    border: "rgba(21,128,61,0.25)",
    color: "#15803D",
    icon: "✓",
  },
  warning: {
    bg: "rgba(217,119,6,0.08)",
    border: "rgba(217,119,6,0.25)",
    color: "#D97706",
    icon: "⚠",
  },
  error: {
    bg: "rgba(220,38,38,0.08)",
    border: "rgba(220,38,38,0.25)",
    color: "#DC2626",
    icon: "✕",
  },
};

// ── Single toast item ──────────────────────────────────────────────────────────
function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const s = TOAST_STYLES[toast.type];

  // Fade in on mount
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  // Auto-dismiss after 4s
  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(toast.id), 300); // wait for fade-out
    }, 4000);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  return (
    <div
      role="alert"
      onClick={() => {
        setVisible(false);
        setTimeout(() => onDismiss(toast.id), 300);
      }}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        background: "#fff",
        border: `1px solid ${s.border}`,
        borderLeft: `4px solid ${s.color}`,
        borderRadius: "var(--radius-md, 10px)",
        padding: "12px 16px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
        cursor: "pointer",
        minWidth: 280,
        maxWidth: 380,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.25s ease, transform 0.25s ease",
        pointerEvents: "auto",
      }}
    >
      {/* Icon */}
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: s.bg,
          color: s.color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 700,
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        {s.icon}
      </span>

      {/* Message */}
      <span
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: "#111827",
          lineHeight: 1.45,
          flex: 1,
        }}
      >
        {toast.message}
      </span>

      {/* Dismiss */}
      <span
        style={{
          fontSize: 14,
          color: "#9CA3AF",
          flexShrink: 0,
          marginTop: 1,
          marginLeft: 4,
        }}
      >
        ✕
      </span>
    </div>
  );
}

// ── Toast container (fixed bottom-right) ──────────────────────────────────────
export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        pointerEvents: "none", // container is click-through; items are not
      }}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// ── Hook: useToast ─────────────────────────────────────────────────────────────
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  function show(message: string, type: ToastType = "info") {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
  }

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return { toasts, show, dismiss };
}
