// Shared Utilities and Helpers
// This package will contain all shared utility functions, helpers, and common logic

export const formatDate = (date: Date): string => {
  return date.toISOString();
};

export const generateId = (): string => {
  return Math.random().toString(36).slice(2, 11);
};

// Placeholder for future utility functions
export const UTILS_VERSION = '0.1.0';
