// src/services/subcription-member.ts
import { api } from "@/lib/api";

export type ConfirmMemberInviteResponse = {
  message?: string;
  [k: string]: unknown;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function unwrapApiResponse<T>(res: unknown): T {
  // api.post của bạn đôi khi trả { data }, đôi khi trả body trực tiếp
  if (isRecord(res) && "data" in res) {
    return (res as { data: T }).data;
  }
  return res as T;
}

export async function confirmMemberInvite(payload: {
  email: string;
  planId: string;
}): Promise<ConfirmMemberInviteResponse> {
  const raw = await api.post<ConfirmMemberInviteResponse>("/Subcription", payload);
  const res = unwrapApiResponse<ConfirmMemberInviteResponse>(raw);
  return res ?? { message: "OK" };
}
