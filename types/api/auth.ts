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
  company_id?: string;
  shop_id?: string | null;
  shop_name?: string;
}
