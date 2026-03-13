// src/app/layout.tsx
import "./globals.css";
import { Suspense } from "react";
import NextAuthProvider from "@/components/NextAuthProvider";
import ClientLayout from "@/components/ClientLayout";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <title>SSG Gas Distribution Admin</title>
      </head>
      <body>
        <NextAuthProvider>
          <Suspense
            fallback={
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100vh",
                  background: "#F3F4F6",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: "#1E293B",
                    color: "#fff",
                    fontWeight: 900,
                    fontSize: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  S
                </div>
              </div>
            }
          >
            <ClientLayout>{children}</ClientLayout>
          </Suspense>
        </NextAuthProvider>
      </body>
    </html>
  );
}
