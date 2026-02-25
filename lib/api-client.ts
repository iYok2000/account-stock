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

/**
 * fetch ไปที่ backend — ใส่ Authorization: Bearer เมื่อมี token; ถ้าได้ 401 เรียก onUnauthorized แล้ว throw
 */
export async function apiRequest<T>(
  pathOrFullUrl: string,
  options?: RequestInit
): Promise<T> {
  const base = getApiBase();
  const url = pathOrFullUrl.startsWith("http") ? pathOrFullUrl : `${base}${pathOrFullUrl}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options?.headers as Record<string, string> | undefined),
  };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  // Cross-origin: ใช้ omit เพื่อไม่ให้เบราว์เซอร์ต้องการ Access-Control-Allow-Credentials (auth ใช้ Bearer ใน header)
  const credentials = base ? "omit" as RequestCredentials : "include";
  const res = await fetch(url, {
    ...options,
    headers,
    credentials,
  });
  if (res.status === 401) {
    authToken = null;
    onUnauthorized?.();
    const body: ApiErrorBody = await res.json().catch(() => ({ error: "Unauthorized" }));
    throw new Error(body.error ?? "Unauthorized");
  }
  if (!res.ok) {
    const body: ApiErrorBody = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}
