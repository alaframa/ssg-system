// src/app/layout.tsx
import "./globals.css";
import { SessionProvider } from "next-auth/react";
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
        {/* SessionProvider must wrap the client layout */}
        <SessionProvider>
          <ClientLayout>{children}</ClientLayout>
        </SessionProvider>
      </body>
    </html>
  );
}
