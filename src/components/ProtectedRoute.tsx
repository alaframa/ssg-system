// src/components/ProtectedRoute.tsx
"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect } from "react";

interface Props {
  children: React.ReactNode;
  allowedRoles?: string[]; // optional roles filter
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      signIn(undefined, { callbackUrl: "/" }); // redirect to login
    }
  }, [status]);

  if (status === "loading") return <div>Loading...</div>;
  if (!session) return null;

  // Role check
  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return (
      <div className="p-4 text-red-600">
        Access Denied: Insufficient permissions
      </div>
    );
  }

  return <>{children}</>;
}
