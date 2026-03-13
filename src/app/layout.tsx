// src/app/layout.tsx
import "./globals.css";
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
          <ClientLayout>{children}</ClientLayout>
        </NextAuthProvider>
      </body>
    </html>
  );
}
