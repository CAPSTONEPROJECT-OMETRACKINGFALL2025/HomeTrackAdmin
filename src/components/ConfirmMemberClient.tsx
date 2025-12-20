// src/app/confirm-member/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSessionStore } from "@/store/session";
import { confirmMemberInvite } from "@/services/subcription-member";

function Brand() {
  return (
    <div className="mb-6 flex items-center justify-center gap-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-400 text-white shadow">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path
            d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8.5Z"
            fill="currentColor"
          />
        </svg>
      </div>
      <div className="text-xl font-extrabold tracking-tight text-neutral-900">
        Home Track
      </div>
    </div>
  );
}

function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Xác nhận thất bại.";
}

export default function ConfirmMemberClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const email = sp.get("email") || "";
  const planId = sp.get("planId") || "";
  const done = sp.get("done") === "1";

  const hydrate = useSessionStore((s) => s.hydrate);

  const [phase, setPhase] = React.useState<
    "hydrating" | "redirecting" | "confirming" | "success" | "error"
  >("hydrating");
  const [error, setError] = React.useState<string | null>(null);

  const q = React.useMemo(() => {
    const p = new URLSearchParams({ email, planId });
    return p.toString();
  }, [email, planId]);

  React.useEffect(() => {
    let alive = true;

    (async () => {
      setPhase("hydrating");
      setError(null);

      if (!email || !planId) {
        setPhase("error");
        setError("Thiếu param bắt buộc: email & planId.");
        return;
      }

      await hydrate();
      if (!alive) return;

      const token = useSessionStore.getState().user?.token;

      if (!token) {
        setPhase("redirecting");
        router.replace(`/login-member?${q}`);
        return;
      }

      if (done) {
        setPhase("success");
        return;
      }

      try {
        setPhase("confirming");
        await confirmMemberInvite({ email, planId });
        setPhase("success");
      } catch (e: unknown) {
        setPhase("error");
        setError(toErrorMessage(e));
      }
    })();

    return () => {
      alive = false;
    };
  }, [email, planId, q, router, hydrate, done]);

  const retry = async () => {
    try {
      setError(null);
      setPhase("confirming");
      await confirmMemberInvite({ email, planId });
      setPhase("success");
    } catch (e: unknown) {
      setPhase("error");
      setError(toErrorMessage(e));
    }
  };

  return (
    <div className="min-h-[100dvh] bg-neutral-50 px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl border border-neutral-200/70 bg-white p-8 shadow-xl">
          <Brand />

          {(phase === "hydrating" ||
            phase === "confirming" ||
            phase === "redirecting") && (
            <>
              <h1 className="mb-2 text-center text-2xl font-bold tracking-tight">
                Đang xác nhận lời mời…
              </h1>
              <p className="mb-6 text-center text-sm text-neutral-600">
                Vui lòng chờ trong giây lát.
              </p>
              <div className="flex justify-center">
                <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-orange-500" />
              </div>

              <div className="mt-6 rounded-xl bg-neutral-50 p-3 text-xs text-neutral-600">
                <div>
                  <span className="font-semibold">Email:</span> {email}
                </div>
                <div>
                  <span className="font-semibold">PlanId:</span> {planId}
                </div>
              </div>
            </>
          )}

          {phase === "success" && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"
                  />
                </svg>
              </div>

              <h1 className="mb-2 text-center text-2xl font-bold tracking-tight">
                Chúc mừng! 🎉
              </h1>
              <p className="mb-6 text-center text-sm text-neutral-600">
                Bạn đã trở thành <span className="font-semibold">member</span> của gói này.
                Bạn có thể đăng nhập vào app để sử dụng.
              </p>

              <div className="rounded-xl bg-neutral-50 p-3 text-xs text-neutral-600">
                <div>
                  <span className="font-semibold">Email:</span> {email}
                </div>
                <div>
                  <span className="font-semibold">PlanId:</span> {planId}
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 px-4 py-2.5 font-semibold text-white shadow hover:brightness-105"
                >
                  Về trang chủ
                </Link>

                <Link
                  href={`/login-member?${q}`}
                  className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2.5 font-semibold text-neutral-900 hover:bg-neutral-50"
                >
                  Đăng nhập lại (nếu cần)
                </Link>
              </div>
            </>
          )}

          {phase === "error" && (
            <>
              <h1 className="mb-2 text-center text-2xl font-bold tracking-tight">
                Xác nhận thất bại
              </h1>
              <p className="mb-6 text-center text-sm text-neutral-600">
                {error || "Có lỗi xảy ra khi xác nhận."}
              </p>

              <div className="rounded-xl bg-neutral-50 p-3 text-xs text-neutral-600">
                <div>
                  <span className="font-semibold">Email:</span> {email || "—"}
                </div>
                <div>
                  <span className="font-semibold">PlanId:</span> {planId || "—"}
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                <button
                  onClick={retry}
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 px-4 py-2.5 font-semibold text-white shadow hover:brightness-105"
                >
                  Thử lại
                </button>

                <Link
                  href={`/login-member?${q}`}
                  className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2.5 font-semibold text-neutral-900 hover:bg-neutral-50"
                >
                  Đi tới đăng nhập
                </Link>

                <Link
                  href={`/register-member?${q}`}
                  className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-4 py-2.5 font-semibold text-neutral-900 hover:bg-neutral-50"
                >
                  Đi tới đăng ký
                </Link>
              </div>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-neutral-500">
          Link mời bắt buộc có <span className="font-semibold">email</span> &{" "}
          <span className="font-semibold">planId</span>.
        </p>
      </div>
    </div>
  );
}
