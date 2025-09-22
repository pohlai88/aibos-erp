// API Contracts and Schemas
// This package will contain all OpenAPI and GraphQL schemas
// Generated TypeScript types and clients will be exported from here

export interface ApiResponse<T = unknown> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Placeholder for future contract definitions
export const CONTRACTS_VERSION = '0.1.0';
