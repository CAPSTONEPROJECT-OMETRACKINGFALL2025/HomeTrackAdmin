// components/auth/LoginForm.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { login } from "@/services/auth";
import { useSessionStore } from "@/store/session";
import { passwordErrors, validateEmail } from "@/lib/validators";

export default function LoginForm() {
  const router = useRouter();
  const { signIn } = useSessionStore();

  const [email, setEmail] = React.useState("");
  const [pw, setPw] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [capsOn, setCapsOn] = React.useState(false);

  const [touched, setTouched] = React.useState({ email: false, pw: false });
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const emailErr = touched.email ? validateEmail(email) : undefined;
  const pwErrList = touched.pw ? passwordErrors(pw) : [];

  function handleCapsCheck(e: React.KeyboardEvent<HTMLInputElement>) {
    // Heuristic caps-lock detection
    const isLetter = e.key.length === 1 && /[a-zA-Z]/.test(e.key);
    if (!isLetter) return;
    const caps =
      (e.getModifierState && e.getModifierState("CapsLock")) ||
      (e.shiftKey ? e.key === e.key.toLowerCase() : e.key === e.key.toUpperCase());
    setCapsOn(!!caps);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ email: true, pw: true });
    setError(null);

    const hasEmailErr = !!validateEmail(email);
    const hasPwErrs = passwordErrors(pw).length > 0;
    if (hasEmailErr || hasPwErrs) return;

    try {
      setSubmitting(true);
      const result = await login({ email, password: pw });
      await signIn({ token: result.token, user: result.user });

      // Nếu không muốn lưu cookie lâu khi tắt "Remember me":
      if (!remember && typeof document !== "undefined") {
        // Ghi cookie auth_token với Max-Age ngắn (session)
        document.cookie = `auth_token=${encodeURIComponent(result.token)};path=/;`;
      }

      router.replace("/"); // hoặc "/dashboard"
    } catch (err: unknown) {
      const errorMessage = err && typeof err === "object" && "message" in err ? String(err.message) : "Đăng nhập thất bại";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      {/* Card */}
      <div className="rounded-2xl border border-neutral-200/70 bg-white p-8 shadow-xl">
        {/* Brand */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-400 text-white shadow">
            {/* Simple box-logo */}
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path
                d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8.5Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div className="text-xl font-extrabold tracking-tight text-neutral-900">Home Track</div>
        </div>

        <h1 className="mb-1 text-center text-3xl font-bold tracking-tight">Đăng nhập</h1>
        <p className="mb-8 text-center text-neutral-600">
          Truy cập bảng điều khiển quản trị của bạn
        </p>

        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-neutral-800"
            >
              Email
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-neutral-400">
                {/* mail icon */}
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M20 4H4a2 2 0 0 0-2 2v.4l10 6.25L22 6.4V6a2 2 0 0 0-2-2Zm2 5.25-9.35 5.84a1 1 0 0 1-1.3 0L2 9.25V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9.25Z"
                  />
                </svg>
              </span>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                autoComplete="email"
                className="block w-full rounded-xl border border-neutral-300 bg-white pl-10 pr-3 py-2.5 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                placeholder="you@example.com"
                aria-invalid={!!emailErr}
                aria-describedby={emailErr ? "email-error" : undefined}
              />
            </div>
            {!!emailErr && (
              <p id="email-error" className="mt-1.5 text-sm text-red-600">
                • {emailErr}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-neutral-800">
                Password
              </label>
              {capsOn && (
                <span className="text-xs font-medium text-amber-600">Caps Lock đang bật</span>
              )}
            </div>

            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-neutral-400">
                {/* lock icon */}
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5Zm3 8H9V6a3 3 0 0 1 6 0v3Z"
                  />
                </svg>
              </span>
              <input
                id="password"
                type={showPw ? "text" : "password"}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, pw: true }))}
                onKeyUp={handleCapsCheck}
                autoComplete="current-password"
                className="block w-full rounded-xl border border-neutral-300 bg-white pl-10 pr-12 py-2.5 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                placeholder="••••••••"
                aria-invalid={pwErrList.length > 0}
                aria-describedby={pwErrList.length ? "password-error" : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-sm font-medium text-neutral-600 hover:text-neutral-800"
                aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPw ? "Ẩn" : "Hiện"}
              </button>
            </div>

            {!!pwErrList.length && (
              <div id="password-error" className="mt-1.5 space-y-1">
                {pwErrList.map((msg) => (
                  <p key={msg} className="text-sm text-red-600">
                    • {msg}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between">
            <label className="inline-flex cursor-pointer select-none items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded border-neutral-300 text-orange-600 focus:ring-orange-500"
              />
              Remember me
            </label>

            <button
              type="button"
              className="text-sm font-medium text-orange-600 hover:underline"
              onClick={() => alert("Tự triển khai luồng quên mật khẩu")}
            >
              Forgot password?
            </button>
          </div>

          {/* Error block */}
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="relative inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 px-4 py-2.5 text-base font-semibold text-white shadow transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-80"
          >
            {submitting && (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />
            )}
            {submitting ? "Signing in…" : "Sign in"}
          </button>

          {/* Divider */}
          <div className="my-2 flex items-center gap-3">
            <div className="h-px flex-1 bg-neutral-200" />
            <span className="text-xs text-neutral-500">Or continue with</span>
            <div className="h-px flex-1 bg-neutral-200" />
          </div>


          {/* Foot note */}
          <p className="mt-4 text-center text-sm text-neutral-600">
            Chưa có tài khoản?{" "}
            <a href="/signup" className="font-semibold text-orange-600 hover:underline">
              Đăng ký ngay
            </a>
          </p>
        </form>
      </div>

      {/* Small helper under card */}
      <p className="mt-4 text-center text-xs text-neutral-500">
        Bằng việc đăng nhập, bạn đồng ý với{" "}
        <a href="#" className="underline hover:text-neutral-700">
          Điều khoản
        </a>{" "}
        &{" "}
        <a href="#" className="underline hover:text-neutral-700">
          Chính sách bảo mật
        </a>
        .
      </p>
    </div>
  );
}
