/**
 * Typed env — NEXT_PUBLIC_* only (safe to expose).
 * Use this instead of process.env for type safety and single source of truth.
 */

interface Env {
  NEXT_PUBLIC_API_URL: string;
  NEXT_PUBLIC_CALC_ENGINE_URL: string;
  NEXT_PUBLIC_CALC_ENGINE_SECRET: string;
  NEXT_PUBLIC_DEV_EMAIL: string;
  NEXT_PUBLIC_DEV_PASSWORD: string;
  NEXT_PUBLIC_DEV_CONFIRM_CODE: string;
}

function getEnv(): Env {
  return {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "",
    NEXT_PUBLIC_CALC_ENGINE_URL: process.env.NEXT_PUBLIC_CALC_ENGINE_URL ?? "",
    NEXT_PUBLIC_CALC_ENGINE_SECRET: process.env.NEXT_PUBLIC_CALC_ENGINE_SECRET ?? "",
    NEXT_PUBLIC_DEV_EMAIL: process.env.NEXT_PUBLIC_DEV_EMAIL ?? "",
    NEXT_PUBLIC_DEV_PASSWORD: process.env.NEXT_PUBLIC_DEV_PASSWORD ?? "",
    NEXT_PUBLIC_DEV_CONFIRM_CODE: process.env.NEXT_PUBLIC_DEV_CONFIRM_CODE ?? "",
  };
}

let cached: Env | null = null;

export function env(): Env {
  if (cached === null) {
    cached = getEnv();
  }
  return cached;
}
