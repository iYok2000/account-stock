/**
 * Typed env — NEXT_PUBLIC_* only (safe to expose).
 * Use this instead of process.env for type safety and single source of truth.
 */

interface Env {
  NEXT_PUBLIC_API_URL: string;
  NEXT_PUBLIC_TEST_USER: string;
  NEXT_PUBLIC_TEST_PASS: string;
  NEXT_PUBLIC_MOCK_ROLE: string;
  NEXT_PUBLIC_CALC_ENGINE_URL: string;
  NEXT_PUBLIC_CALC_ENGINE_SECRET: string;
}

function getEnv(): Env {
  return {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "",
    NEXT_PUBLIC_TEST_USER: process.env.NEXT_PUBLIC_TEST_USER ?? "useradmin1234",
    NEXT_PUBLIC_TEST_PASS: process.env.NEXT_PUBLIC_TEST_PASS ?? "pass@1",
    NEXT_PUBLIC_MOCK_ROLE: process.env.NEXT_PUBLIC_MOCK_ROLE ?? "Staff",
    NEXT_PUBLIC_CALC_ENGINE_URL: process.env.NEXT_PUBLIC_CALC_ENGINE_URL ?? "",
    NEXT_PUBLIC_CALC_ENGINE_SECRET: process.env.NEXT_PUBLIC_CALC_ENGINE_SECRET ?? "",
  };
}

let cached: Env | null = null;

export function env(): Env {
  if (cached === null) {
    cached = getEnv();
  }
  return cached;
}
