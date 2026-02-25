/**
 * Calculator / calc engine — รอต่อ API.
 * เมื่อ backend หรือ calc service พร้อม ให้เรียก API แทนและใช้ response type จาก types/api/calculator.
 */

import type { ProfitCalcInputApi, ProfitCalcResultApi } from "@/types/api/calculator";
import { env } from "@/lib/env";

export async function callProfitCalc(
  input: ProfitCalcInputApi
): Promise<ProfitCalcResultApi> {
  const { NEXT_PUBLIC_CALC_ENGINE_URL: CALC_ENGINE_URL, NEXT_PUBLIC_CALC_ENGINE_SECRET: CALC_ENGINE_SECRET } = env();
  if (!CALC_ENGINE_URL) {
    throw new Error("รอต่อ API — ยังไม่ได้ตั้งค่า CALC_ENGINE_URL");
  }
  const res = await fetch(`${CALC_ENGINE_URL}/api/calculator/profit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(CALC_ENGINE_SECRET
        ? { Authorization: `Bearer ${CALC_ENGINE_SECRET}` }
        : {}),
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(
      (err as { detail?: string }).detail || `Calc engine error: ${res.statusText}`
    );
  }
  return res.json();
}
