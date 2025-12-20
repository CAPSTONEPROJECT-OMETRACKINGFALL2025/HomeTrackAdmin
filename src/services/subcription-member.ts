// src/services/subcription-member.ts
import { api } from "@/lib/api";

export async function confirmMemberInvite(payload: { email: string; planId: string }) {
  const response = await api.post<{ message?: string; [k: string]: unknown }>(
    "/api/Subcription",
    payload,
  );

  // giống pattern services/auth.ts của bạn: có thể là response.data hoặc body trực tiếp
  const res: any = (response as any)?.data ?? response;

  return res ?? { message: "OK" };
}
