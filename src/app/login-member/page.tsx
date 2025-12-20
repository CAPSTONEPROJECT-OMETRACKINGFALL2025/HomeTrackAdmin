// app/login-member/page.tsx
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { login } from "@/services/auth";
import { useSessionStore } from "@/store/session";
import { passwordErrors, validateEmail } from "@/lib/validators";
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
      <div className="text-xl font-extrabold tracking-tight text-neutral-900">Home Track</div>
    </div>
  );
}

export default function LoginMemberPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const emailParam = sp.get("email") || "";
  const planId = sp.get("planId") || sp.get("plan") || ""; // nhận cả plan để tương thích

  const { signIn } = useSessionStore();

  const [email] = React.useState(emailParam); // khóa email theo invite
  const [pw, setPw] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);

  const [touched, setTouched] = React.useState({ pw: false });
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const pwErrList = touched.pw ? passwordErrors(pw) : [];

  const q = React.useMemo(() => {
    const p = new URLSearchParams({ email: emailParam, planId });
    return p.toString();
  }, [emailParam, planId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ pw: true });
    setError(null);

    if (!emailParam || !planId) {
      setError("Thiếu param bắt buộc: email & planId.");
      return;
    }
    const emailErr = validateEmail(emailParam);
    if (emailErr) {
      setError(emailErr);
      return;
    }
    if (passwordErrors(pw).length > 0) return;

    try {
      setSubmitting(true);

      // login
      const result = await login({ email: emailParam, password: pw });
      await signIn({ token: result.token, user: result.user });

      // confirm member theo param
      await confirmMemberInvite({ email: emailParam, planId });

      // sang trang chúc mừng (không confirm lại)
      router.replace(`/confirm-member?${q}&done=1`);
    } catch (err: any) {
      setError(err?.message || "Đăng nhập / xác nhận thất bại");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-neutral-50 px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl border border-neutral-200/70 bg-white p-8 shadow-xl">
          <Brand />

          <h1 className="mb-1 text-center text-3xl font-bold tracking-tight">
            Đăng nhập để xác nhận
          </h1>
          <p className="mb-6 text-center text-neutral-600">
            Đăng nhập xong hệ thống sẽ tự xác nhận lời mời membership.
          </p>

          <div className="mb-5 rounded-xl bg-neutral-50 p-3 text-xs text-neutral-600">
            <div>
              <span className="font-semibold">Email invite:</span> {emailParam || "—"}
            </div>
            <div>
              <span className="font-semibold">PlanId:</span> {planId || "—"}
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-800">
                Email
              </label>
              <input
                value={emailParam}
                disabled
                className="block w-full cursor-not-allowed rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-700"
              />
              <p className="mt-1.5 text-xs text-neutral-500">
                Email này lấy từ link mời (không thể thay đổi).
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-800">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  onBlur={() => setTouched({ pw: true })}
                  autoComplete="current-password"
                  className="block w-full rounded-xl border border-neutral-300 bg-white pr-12 px-3 py-2.5 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                  placeholder="••••••••"
                  aria-invalid={pwErrList.length > 0}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-sm font-medium text-neutral-600 hover:text-neutral-800"
                >
                  {showPw ? "Ẩn" : "Hiện"}
                </button>
              </div>
              {!!pwErrList.length && (
                <div className="mt-1.5 space-y-1">
                  {pwErrList.map((msg) => (
                    <p key={msg} className="text-sm text-red-600">• {msg}</p>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="relative inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 px-4 py-2.5 text-base font-semibold text-white shadow transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-80"
            >
              {submitting && (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />
              )}
              {submitting ? "Signing in…" : "Sign in & Confirm"}
            </button>

            <p className="text-center text-sm text-neutral-600">
              Chưa có tài khoản?{" "}
              <a
                className="font-semibold text-orange-600 hover:underline"
                href={`/register-member?${q}`}
              >
                Đăng ký tại đây
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
