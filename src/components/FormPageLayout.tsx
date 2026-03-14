// src/components/FormPageLayout.tsx
"use client";

import { useRouter } from "next/navigation";

interface Crumb {
  label: string;
  href?: string;
}

interface FormPageLayoutProps {
  crumbs: Crumb[]; // e.g. [{label:"SSG"}, {label:"Customers", href:"/customers"}, {label:"Add Customer"}]
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function FormPageLayout({
  crumbs,
  title,
  subtitle,
  children,
}: FormPageLayoutProps) {
  const router = useRouter();

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 0 48px" }}>
      {/* Breadcrumb */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--text-low)",
          marginBottom: 8,
        }}
      >
        {crumbs.map((c, i) => (
          <span
            key={i}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            {i > 0 && <span style={{ opacity: 0.4 }}>›</span>}
            {c.href ? (
              <button
                onClick={() => router.push(c.href!)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--text-low)",
                  textDecoration: "underline",
                  textDecorationColor: "transparent",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) =>
                  ((e.target as HTMLElement).style.color = "var(--accent)")
                }
                onMouseLeave={(e) =>
                  ((e.target as HTMLElement).style.color = "var(--text-low)")
                }
              >
                {c.label}
              </button>
            ) : (
              <span
                style={{
                  color: i === crumbs.length - 1 ? "var(--accent)" : undefined,
                }}
              >
                {c.label}
              </span>
            )}
          </span>
        ))}
      </div>

      {/* Page title */}
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            fontSize: 26,
            fontWeight: 900,
            color: "var(--sidebar)",
            letterSpacing: "-0.03em",
            lineHeight: 1,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 11, color: "var(--text-mid)", marginTop: 4 }}>
            {subtitle}
          </div>
        )}
      </div>

      {/* Form card */}
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          padding: 28,
        }}
      >
        {children}
      </div>
    </div>
  );
}
