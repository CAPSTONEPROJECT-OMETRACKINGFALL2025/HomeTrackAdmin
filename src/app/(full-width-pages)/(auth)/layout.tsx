"use client";

import { useSessionStore } from "@/store/session";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hydrate = useSessionStore((s) => s.hydrate);
  const user = useSessionStore((s) => s.user);
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Restore user session from localStorage on mount
    const checkAuth = async () => {
      await hydrate();
      setIsCheckingAuth(false);
    };
    checkAuth();
  }, [hydrate]);

  useEffect(() => {
    // Redirect to home if already authenticated
    if (!isCheckingAuth && user) {
      router.replace("/");
    }
  }, [user, isCheckingAuth, router]);

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="h-svh flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Don't render auth pages if user is already logged in
  if (user) {
    return null;
  }

  return (
    <div className="h-svh">
        {children}
    </div>
  );
}
