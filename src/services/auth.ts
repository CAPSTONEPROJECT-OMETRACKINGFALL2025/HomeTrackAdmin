// services/auth.ts
import { api } from "@/lib/api";

export type LoginPayload = { email: string; password: string };

export async function login(payload: LoginPayload): Promise<{
  token: string;
  user: {
    userId?: string | null;
    email?: string | null;
    username?: string | null;
    roleId?: number | null;
    isPremium?: boolean | null;
    [k: string]: unknown;
  };
}> {
  // api.post trả về body đã parse — KHÔNG phải axios response
  const response = await api.post<{
    token?: string;
    accessToken?: string;
    user?: {
      userId?: string | null;
      email?: string | null;
      username?: string | null;
      roleId?: number | null;
      isPremium?: boolean | null;
      [k: string]: unknown;
    };
    userId?: string | null;
    email?: string | null;
    username?: string | null;
    roleId?: number | null;
    isPremium?: boolean | null;
    [k: string]: unknown;
  }>("/auth/login", payload);
  const res: any = response.data ?? response;

  const token: string = res?.token ?? res?.accessToken ?? "";
  if (!token) throw new Error("Thiếu token từ server.");

  const user = {
    userId: res?.user?.userId ?? res?.userId ?? "unknown",
    email: res?.user?.email ?? res?.email ?? payload.email,
    username: res?.user?.username ?? res?.username ?? payload.email.split("@")[0],
    roleId: res?.user?.roleId ?? res?.roleId ?? null,
    isPremium: res?.user?.isPremium ?? res?.isPremium ?? false,
    raw: res?.user ?? res ?? null,
  };

  return { token, user };
}

/* ---------- REGISTER ---------- */

export type RegisterPayload = {
  username: string;
  email: string;
  password: string;
  // các trường tuỳ chọn nếu backend cần
  roleId?: number;
  pictureProfile?: string;
  dateOfBirth?: string; // ISO
  phone?: string;
};

export async function register(payload: RegisterPayload): Promise<{
  message?: string;
  user?: Record<string, unknown>;
}> {
  // dùng endpoint giống RN của bạn
  const res = await api.post<{
    message?: string;
    user?: Record<string, unknown>;
    [k: string]: unknown;
  }>("/api/Auth/register", payload);
  // backend của bạn có thể trả { message, user, ... } hoặc 204
  return (res ?? {}) as { message?: string; user?: Record<string, unknown> };
}
