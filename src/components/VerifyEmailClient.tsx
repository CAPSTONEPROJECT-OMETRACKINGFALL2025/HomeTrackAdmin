"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { checkOtpEmail } from "@/services/auth";

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
  return "Xác thực email thất bại";
}

export default function VerifyEmailClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const emailParam = sp.get("email") || "";
  const planId = sp.get("planId") || sp.get("plan") || "";

  const [otp, setOtp] = React.useState<string[]>(["", "", "", "", "", ""]);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const q = React.useMemo(() => {
    const p = new URLSearchParams({ email: emailParam, planId });
    return p.toString();
  }, [emailParam, planId]);

  const handleOtpChange = (index: number, value: string) => {
    // Chỉ cho phép số
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError(null);

    // Tự động focus vào ô tiếp theo
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Xóa và focus về ô trước khi nhấn Backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    const digits = pastedData.replace(/\D/g, "").slice(0, 6).split("");

    if (digits.length === 6) {
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (i < 6) newOtp[i] = digit;
      });
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!emailParam) {
      setError("Thiếu email.");
      return;
    }

    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Vui lòng nhập đầy đủ 6 số OTP.");
      return;
    }

    try {
      setSubmitting(true);

      // Verify OTP
      await checkOtpEmail({
        otpRequest: otpString,
        email: emailParam,
      });

      // Sau khi verify thành công, redirect về login-member
      router.replace(`/login-member?${q}`);
    } catch (err: unknown) {
      setError(toErrorMessage(err));
      // Reset OTP on error
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setSubmitting(false);
    }
  }

  React.useEffect(() => {
    // Auto focus vào ô đầu tiên khi mount
    inputRefs.current[0]?.focus();
  }, []);

  return (
    <div className="min-h-[100dvh] bg-neutral-50 px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl border border-neutral-200/70 bg-white p-8 shadow-xl">
          <Brand />

          <h1 className="mb-1 text-center text-3xl font-bold tracking-tight">
            Xác thực Email
          </h1>
          <p className="mb-6 text-center text-neutral-600">
            Vui lòng nhập mã OTP 6 số đã được gửi đến email của bạn
          </p>

          <div className="mb-5 rounded-xl bg-neutral-50 p-3 text-xs text-neutral-600">
            <div>
              <span className="font-semibold">Email:</span> {emailParam || "—"}
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <div>
              <label className="mb-3 block text-center text-sm font-medium text-neutral-800">
                Mã OTP
              </label>
              <div className="flex justify-center gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className="h-14 w-14 rounded-xl border-2 border-neutral-300 bg-white text-center text-2xl font-bold text-neutral-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                    aria-label={`OTP digit ${index + 1}`}
                  />
                ))}
              </div>
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
              {submitting ? "Đang xác thực…" : "Xác thực"}
            </button>

            <p className="text-center text-sm text-neutral-600">
              Chưa nhận được mã?{" "}
              <button
                type="button"
                className="font-semibold text-orange-600 hover:underline"
                onClick={() => {
                  // TODO: Implement resend OTP
                  alert("Tính năng gửi lại mã OTP sẽ được triển khai");
                }}
              >
                Gửi lại mã
              </button>
            </p>

            <p className="text-center text-sm text-neutral-600">
              <Link
                className="font-semibold text-orange-600 hover:underline"
                href={`/register-member?${q}`}
              >
                Quay lại đăng ký
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

