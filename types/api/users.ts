/**
 * GET /api/users response (SuperAdmin only). Backend may return [] until DB is wired.
 */
export interface UserItemApi {
  id: string;
  company_id?: string;
  email?: string;
  display_name?: string;
  role?: string;
  tier?: string;
}

export interface UsersListResponseApi {
  users: UserItemApi[];
}
