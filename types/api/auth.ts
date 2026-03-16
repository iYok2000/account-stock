/**
 * GET /api/auth/me — response from backend (raw JSON).
 * Mapped to UserSession in AuthContext.
 */
export interface MeResponseApi {
  user?: {
    id?: string;
    displayName?: string;
  };
  roles?: string[];
  permissions?: string[];
  tier?: string;
  tier_started_at?: string | null;
  tier_expires_at?: string | null;
  invite_code_used?: string | null;
  invite_slots?: number;
  company_id?: string;
  shop_id?: string | null;
  shop_name?: string;
}
