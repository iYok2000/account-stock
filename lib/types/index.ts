/**
 * Shared types (no API dependency).
 */

export type DateRange = {
  from: Date;
  to: Date;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type NavItem = {
  title: string;
  href: string;
  icon?: string;
  badge?: number;
};
