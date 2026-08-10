import axios from 'axios';

/**
 * Base URL for every backend call. Defaults to the Vite dev proxy (`/api`),
 * which forwards to the Spring backend on http://localhost:8080.
 * Override with VITE_API_BASE_URL for other environments.
 */
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export function extractApiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string; error?: string } | undefined;
    return data?.message ?? data?.error ?? err.message ?? fallback;
  }
  return err instanceof Error ? err.message : fallback;
}
