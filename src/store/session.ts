// store/session.ts
"use client";

import { create } from "zustand";
import { setAuthTokenStatic } from "@/lib/api";

const STORAGE_KEY = "app/session.v1";
export type Plan = "basic" | "premium";

export type SessionUser = {
  userId: string;
  email?: string | null;
  username?: string | null;
  roleId?: number | null;
  token?: string | null;
  plan: Plan;
  raw?: Record<string, unknown>;
};

type SignInPayload =
  | string
  | {
      token: string;
      user: {
        userId?: string | null;
        email?: string | null;
        username?: string | null;
        roleId?: number | null;
        isPremium?: boolean | null;
        [k: string]: unknown;
      };
    };

type SessionState = {
  user: SessionUser | null;

  hydrate: () => Promise<void>;
  signIn: (payload: SignInPayload) => Promise<void> | void;
  signOut: () => Promise<void> | void;
  upgrade: () => void;
  setPlan: (plan: Plan) => void;
};

function writeCookie(name: string, value: string, days = 7) {
  if (typeof document === "undefined") return;
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;expires=${d.toUTCString()}`;
}
function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Max-Age=0; path=/`;
}

async function persist(u: SessionUser | null) {
  if (typeof localStorage === "undefined") return;
  if (!u) {
    localStorage.removeItem(STORAGE_KEY);
    deleteCookie("auth_token");
    setAuthTokenStatic(null);
    return;
  }
  const data = {
    token: u.token ?? null,
    user: {
      userId: u.userId,
      email: u.email ?? null,
      username: u.username ?? null,
      roleId: u.roleId ?? null,
      isPremium: u.plan === "premium",
      raw: u.raw ?? null,
    },
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  if (u.token) writeCookie("auth_token", u.token);
  setAuthTokenStatic(u.token ?? null);
}

function readPersisted(): {
  token?: string;
  user?: {
    userId?: string;
    email?: string | null;
    username?: string | null;
    roleId?: number | null;
    isPremium?: boolean;
    raw?: Record<string, unknown> | null;
  };
  userId?: string;
  [k: string]: unknown;
} | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export const useSessionStore = create<SessionState>((set, get) => ({
  user: null,

  hydrate: async () => {
    const saved = readPersisted();
    if (saved?.token && (saved.user?.userId || saved.userId)) {
      const uid = (saved.user?.userId ?? saved.userId) as string;
      const isPremium = !!saved.user?.isPremium;
      const u: SessionUser = {
        userId: uid,
        email: saved.user?.email ?? null,
        username: saved.user?.username ?? null,
        roleId: saved.user?.roleId ?? null,
        token: saved.token,
        plan: isPremium ? "premium" : "basic",
        raw: saved.user?.raw ?? null,
      };
      set({ user: u });
      setAuthTokenStatic(u.token ?? null);
      return;
    }
    // không SSR getSession ở bản đơn giản này
    set({ user: null });
    setAuthTokenStatic(null);
  },

  signIn: async (payload: SignInPayload) => {
    if (typeof payload === "string") {
      const email = payload;
      const u: SessionUser = {
        userId: "dev-mock",
        email,
        username: email?.split("@")?.[0] ?? null,
        roleId: null,
        token: null,
        plan: "basic",
      };
      set({ user: u });
      await persist(u);
      return;
    }

    const { token, user } = payload;
    const uid = (user?.userId ?? "unknown") as string;
    const isPremium = !!user?.isPremium;

    const u: SessionUser = {
      userId: uid,
      email: user?.email ?? null,
      username: user?.username ?? null,
      roleId: user?.roleId ?? null,
      token,
      plan: isPremium ? "premium" : "basic",
      raw: user ?? null,
    };
    set({ user: u });
    await persist(u);
  },

  signOut: async () => {
    set({ user: null });
    await persist(null);
  },

  upgrade: () => {
    const u = get().user;
    if (!u) return;
    if (u.plan !== "premium") {
      const up: SessionUser = { ...u, plan: "premium" };
      set({ user: up });
      void persist(up);
    }
  },

  setPlan: (plan: Plan) => {
    const u = get().user;
    if (!u) return;
    const up: SessionUser = { ...u, plan };
    set({ user: up });
    void persist(up);
  },
}));
