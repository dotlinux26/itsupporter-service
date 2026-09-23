export interface PaginationResult<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export function getPaginationParams(query: Record<string, unknown>): { page: number; limit: number; offset: number } {
  const rawPage = typeof query.page === 'string' ? Number(query.page) : 1;
  const rawLimit = typeof query.limit === 'string' ? Number(query.limit) : 10;

  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(Math.floor(rawLimit), 10) : 10;

  return { page, limit, offset: (page - 1) * limit };
}

export function buildPaginationResult<T>(data: T[], total: number, page: number, limit: number): PaginationResult<T> {
  return {
    data,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasMore: page * limit < total,
  };
}