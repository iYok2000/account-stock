/**
 * API client — ใส่ Bearer token อัตโนมัติ และจัดการ 401 ที่เดียว (interceptor-style).
 * หลัง login ที่ได้ JWT จาก backend ให้เรียก setAuthToken(token); ใช้ getAuthToken() เพื่ออ่าน
 */

import type { ApiErrorBody } from "@/types/api/errors";
import { env } from "@/lib/env";

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

/** ลงทะเบียน callback เมื่อได้ 401 (เช่น clear session / redirect) */
export function setOnUnauthorized(cb: (() => void) | null): void {
  onUnauthorized = cb;
}

export function getApiBase(): string {
  return env().NEXT_PUBLIC_API_URL;
}

export type ApiRequestOptions = RequestInit & {
  /**
   * true = endpoint นี้เป็น auth-critical (เช่น /api/auth/me)
   * เมื่อได้ 401 พร้อมมี token จะ trigger onUnauthorized → logout
   *
   * false (default) = data endpoint; ได้ 401 แค่ throw error
   * ไม่ logout เพราะ backend อาจยังไม่ implement หรือ token expire เฉพาะ route นั้น
   */
  authEndpoint?: boolean;
};

/**
 * fetch ไปที่ backend — ใส่ Authorization: Bearer เมื่อมี token
 * ถ้าได้ 401 และ authEndpoint=true (เฉพาะ /api/auth/me) → เรียก onUnauthorized แล้ว throw
 * Data endpoints (dashboard, inventory ฯลฯ) ได้ 401 → แค่ throw ไม่ logout
 */
export async function apiRequest<T>(
  pathOrFullUrl: string,
  options?: ApiRequestOptions
): Promise<T> {
  const { authEndpoint = false, ...fetchOptions } = options ?? {};

  // เผื่อกรณี component เรียก apiRequest เร็วเกินกว่าที่ AuthProvider จะ setAuthToken ให้
  // ดึง token จาก sessionStorage มาก่อน แล้ว cache ไว้ในตัวแปรโมดูล
  if (!authToken && typeof window !== "undefined") {
    try {
      const cached = sessionStorage.getItem("auth_token");
      if (cached) {
        authToken = cached;
      }
    } catch {
      /* ignore */
    }
  }

  const base = getApiBase();
  const url = pathOrFullUrl.startsWith("http") ? pathOrFullUrl : `${base}${pathOrFullUrl}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(fetchOptions?.headers as Record<string, string> | undefined),
  };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  // Cross-origin: ใช้ omit เพื่อไม่ให้เบราว์เซอร์ต้องการ Access-Control-Allow-Credentials (auth ใช้ Bearer ใน header)
  const credentials = base ? ("omit" as RequestCredentials) : "include";
  const res = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials,
  });
  if (res.status === 401) {
    const hadToken = !!authToken;
    // authEndpoint=true เท่านั้นที่ถือว่า token ใช้ไม่ได้แล้ว → clear + logout
    // data endpoints (dashboard, inventory ฯลฯ) ได้ 401 → แค่ throw แต่ยังเก็บ token ไว้
    if (authEndpoint) {
      authToken = null;
      if (hadToken) onUnauthorized?.();
    }
    const body: ApiErrorBody = await res.json().catch(() => ({ error: "Unauthorized" }));
    throw new Error(body.error ?? "Unauthorized");
  }
  if (!res.ok) {
    const body: ApiErrorBody = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}
