// lib/api.ts
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
export type Query = Record<string, string | number | boolean | null | undefined>;

export interface RequestOptions {
  headers?: Record<string, string>;
  body?: any;
  query?: Query;
  timeoutMs?: number;
  signal?: AbortSignal | null;
}

export interface ApiErrorPayload {
  message?: string;
  code?: string | number;
  [k: string]: any;
}

export class ApiError extends Error {
  status: number;
  payload?: ApiErrorPayload;
  constructor(message: string, status: number, payload?: ApiErrorPayload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

/** ---- Runtime config ---- */
type TokenProvider = () => Promise<string | null> | string | null;

let tokenMemory: string | null = null;

const config = {
  baseURL:
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
    "https://hometrack.mlhr.org/api",
  timeoutMs: 15000,
  defaultHeaders: {
    Accept: "application/json",
    "Content-Type": "application/json",
  } as Record<string, string>,
  getAuthToken: null as TokenProvider | null,
};

export function configureApi(opts: {
  baseURL?: string;
  timeoutMs?: number;
  defaultHeaders?: Record<string, string>;
  getAuthToken?: TokenProvider | null;
}) {
  if (opts.baseURL) config.baseURL = opts.baseURL.replace(/\/+$/, "");
  if (typeof opts.timeoutMs === "number") config.timeoutMs = opts.timeoutMs;
  if (opts.defaultHeaders) config.defaultHeaders = { ...config.defaultHeaders, ...opts.defaultHeaders };
  if (typeof opts.getAuthToken !== "undefined") config.getAuthToken = opts.getAuthToken;
}

/** Set token tạm trong bộ nhớ (sau login) */
export function setAuthTokenStatic(token: string | null) {
  tokenMemory = token;
  config.getAuthToken = () => tokenMemory;
}

function buildURL(endpoint: string, query?: Query): string {
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = new URL(config.baseURL + path);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v === null || typeof v === "undefined") return;
      url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

function mergeHeaders(
  base: Record<string, string>,
  extra?: Record<string, string>
) {
  const h = { ...base };
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v == null) continue;
      h[k] = v;
    }
  }
  return h;
}

async function maybeAttachAuth(headers: Record<string, string>) {
  // Ưu tiên tokenMemory; nếu không có, thử lấy từ cookie (client)
  let t: string | null = null;
  if (config.getAuthToken) t = await config.getAuthToken();
  if (!t && typeof document !== "undefined") {
    const m = document.cookie.match(/(?:^|;\s*)auth_token=([^;]+)/);
    t = m ? decodeURIComponent(m[1]) : null;
  }
  if (t) headers.Authorization = headers.Authorization ?? `Bearer ${t}`;
  return headers;
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function request<T = any>(
  method: HttpMethod,
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, headers, query, timeoutMs, signal } = options;
  const url = buildURL(endpoint, query);

  let hdrs = mergeHeaders(config.defaultHeaders, headers);
  hdrs = await maybeAttachAuth(hdrs);

  const controller = new AbortController();
  if (signal) {
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }
  const timeout = setTimeout(() => controller.abort(), timeoutMs ?? config.timeoutMs);

  try {
    const init: RequestInit = { method, headers: hdrs, signal: controller.signal };
    if (method !== "GET" && typeof body !== "undefined") {
      const ct = hdrs["Content-Type"]?.toLowerCase();
      if (ct && ct.includes("application/json") && typeof body === "object") {
        init.body = JSON.stringify(body);
      } else {
        init.body = body as any;
      }
    }

    const res = await fetch(url, init);
    const resText = await res.text();
    const isJson = (res.headers.get("content-type") || "").includes("application/json");
    const parsed = resText ? (isJson ? safeJson(resText) : resText) : null;

    if (!res.ok) {
      // Check for .error field first, then .message, then fallback
      let message = `Request failed with status ${res.status}`;
      if (parsed && typeof parsed === "object") {
        const errorObj = parsed as any;
        if (errorObj.error) {
          message = String(errorObj.error);
        } else if (errorObj.message) {
          message = String(errorObj.message);
        }
      }
      throw new ApiError(message, res.status, isJson ? (parsed as any) : { raw: resText });
    }

    if (res.status === 204 || !resText) return null as T;
    return parsed as T;
  } catch (err: any) {
    if (err?.name === "AbortError") throw new ApiError("Request timeout/aborted", 0);
    if (err instanceof ApiError) throw err;
    throw new ApiError(err?.message || "Network error", 0);
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  get<T = any>(endpoint: string, query?: Query, opts?: Omit<RequestOptions, "query" | "body">) {
    return request<T>("GET", endpoint, { ...opts, query });
  },
  post<T = any>(endpoint: string, body?: any, opts?: Omit<RequestOptions, "body">) {
    return request<T>("POST", endpoint, { ...opts, body });
  },
  put<T = any>(endpoint: string, body?: any, opts?: Omit<RequestOptions, "body">) {
    return request<T>("PUT", endpoint, { ...opts, body });
  },
  del<T = any>(endpoint: string, opts?: RequestOptions) {
    return request<T>("DELETE", endpoint, opts);
  },
};
