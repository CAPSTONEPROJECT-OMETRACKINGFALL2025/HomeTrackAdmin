// src/app/register-member/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { register, login } from "@/services/auth";
import { useSessionStore } from "@/store/session";
import { validateEmail, passwordErrors } from "@/lib/validators";
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
  return "Đăng ký / xác nhận thất bại";
}

export default function RegisterMemberClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const emailParam = sp.get("email") || "";
  const planId = sp.get("planId") || sp.get("plan") || "";

  const signIn = useSessionStore((s) => s.signIn);

  const [username, setUsername] = React.useState("");
  const [pw, setPw] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [agree, setAgree] = React.useState(true);

  const [touched, setTouched] = React.useState({ username: false, pw: false });
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const usernameErr =
    touched.username && (!username || username.trim().length < 3)
      ? "Username phải ≥ 3 ký tự"
      : undefined;

  const pwErrList = touched.pw ? passwordErrors(pw) : [];

  const q = React.useMemo(() => {
    const p = new URLSearchParams({ email: emailParam, planId });
    return p.toString();
  }, [emailParam, planId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ username: true, pw: true });
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

    if (!username || username.trim().length < 3) return;
    if (passwordErrors(pw).length > 0) return;
    if (!agree) {
      setError("Bạn cần đồng ý Điều khoản & Chính sách để tiếp tục.");
      return;
    }

    try {
      setSubmitting(true);

      await register({
        username,
        email: emailParam,
        password: pw,
        roleId: 2,
        pictureProfile: "",
        dateOfBirth: new Date().toISOString(),
        phone: "",
      });

      // Redirect to verify email page with password in query params
      const verifyParams = new URLSearchParams({
        email: emailParam,
        planId,
        password: pw, // Pass password for auto login after verification
      });
      router.replace(`/verify-email?${verifyParams.toString()}`);
    } catch (err: unknown) {
      setError(toErrorMessage(err));
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
            Đăng ký để xác nhận
          </h1>
          <p className="mb-6 text-center text-neutral-600">
            Tạo tài khoản xong hệ thống sẽ tự xác nhận lời mời membership.
          </p>

          <div className="mb-5 rounded-xl bg-neutral-50 p-3 text-xs text-neutral-600">
            <div>
              <span className="font-semibold">Email invite:</span>{" "}
              {emailParam || "—"}
            </div>
            <div>
              <span className="font-semibold">PlanId:</span>{" "}
              {planId || "—"}
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-800">
                Username
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, username: true }))}
                className="block w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                placeholder="nhatnam"
                aria-invalid={!!usernameErr}
              />
              {!!usernameErr && (
                <p className="mt-1.5 text-sm text-red-600">• {usernameErr}</p>
              )}
            </div>

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
                Email lấy từ link mời (không thể thay đổi).
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
                  onBlur={() => setTouched((t) => ({ ...t, pw: true }))}
                  autoComplete="new-password"
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
                    <p key={msg} className="text-sm text-red-600">
                      • {msg}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-start gap-3">
              <input
                id="agree"
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-1 rounded border-neutral-300 text-orange-600 focus:ring-orange-500"
              />
              <label htmlFor="agree" className="text-sm text-neutral-700">
                Tôi đồng ý với{" "}
                <span className="font-medium text-orange-600">Điều khoản</span> &{" "}
                <span className="font-medium text-orange-600">
                  Chính sách bảo mật
                </span>
                .
              </label>
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
              {submitting ? "Creating…" : "Create & Confirm"}
            </button>

            <p className="text-center text-sm text-neutral-600">
              Đã có tài khoản?{" "}
              <Link
                className="font-semibold text-orange-600 hover:underline"
                href={`/login-member?${q}`}
              >
                Đăng nhập tại đây
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
