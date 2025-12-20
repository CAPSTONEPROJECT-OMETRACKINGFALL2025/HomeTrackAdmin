// src/app/register-member/page.tsx
import RegisterMemberClient from "@/components/RegisterMemberClient ";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] bg-neutral-50 px-4 py-10">
          <div className="mx-auto w-full max-w-md rounded-2xl border border-neutral-200/70 bg-white p-8 text-center shadow-xl">
            <div className="mx-auto mb-4 inline-block h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-orange-500" />
            <p className="text-sm text-neutral-600">Loading…</p>
          </div>
        </div>
      }
    >
      <RegisterMemberClient />
    </Suspense>
  );
}
