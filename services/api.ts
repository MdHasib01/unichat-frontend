import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@/types';

/**
 * In the browser we always call the same origin (`/api/...`), which Next
 * rewrites to the Express backend. That keeps the auth cookies first-party and
 * removes CORS from the equation in production.
 */
const baseURL =
  typeof window === 'undefined'
    ? `${process.env.BACKEND_INTERNAL_URL || 'http://localhost:4000'}/api`
    : '/api';

export const api: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly errors: Array<{ field?: string; message: string }> = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Maps validation errors onto react-hook-form field names. */
  get fieldErrors(): Record<string, string> {
    const map: Record<string, string> = {};
    for (const error of this.errors) {
      if (error.field) map[error.field] = error.message;
    }
    return map;
  }
}

let refreshPromise: Promise<void> | null = null;

async function refreshSession(): Promise<void> {
  // A single in-flight refresh is shared by every queued request.
  refreshPromise ??= api
    .post('/auth/refresh')
    .then(() => undefined)
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string; code?: string; errors?: Array<{ field?: string; message: string }> }>) => {
    const original = error.config as (AxiosRequestConfig & { _retried?: boolean }) | undefined;
    const status = error.response?.status ?? 0;
    const data = error.response?.data;

    const isAuthRoute = original?.url?.includes('/auth/login') || original?.url?.includes('/auth/refresh');

    // An expired access token is recoverable: refresh once, then replay.
    if (status === 401 && original && !original._retried && !isAuthRoute) {
      original._retried = true;
      try {
        await refreshSession();
        return api.request(original);
      } catch {
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
        }
      }
    }

    throw new ApiError(
      data?.message || error.message || 'Something went wrong',
      status,
      data?.code || 'NETWORK_ERROR',
      data?.errors ?? [],
    );
  },
);

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  const { data } = await api.get<ApiResponse<T>>(url, config);
  return data;
}

export async function apiPost<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  const { data } = await api.post<ApiResponse<T>>(url, body, config);
  return data;
}

export async function apiPatch<T>(url: string, body?: unknown): Promise<ApiResponse<T>> {
  const { data } = await api.patch<ApiResponse<T>>(url, body);
  return data;
}

export async function apiDelete<T>(url: string): Promise<ApiResponse<T> | null> {
  const { data, status } = await api.delete<ApiResponse<T>>(url);
  return status === 204 ? null : data;
}

/** Unwraps `{ success, data }` for callers that only need the payload. */
export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const response = await apiGet<T>(url, { params: cleanParams(params) });
  return response.data;
}

export async function getWithMeta<T>(
  url: string,
  params?: Record<string, unknown>,
): Promise<ApiResponse<T>> {
  return apiGet<T>(url, { params: cleanParams(params) });
}

export async function post<T>(url: string, body?: unknown): Promise<T> {
  return (await apiPost<T>(url, body)).data;
}

export async function patch<T>(url: string, body?: unknown): Promise<T> {
  return (await apiPatch<T>(url, body)).data;
}

export async function del(url: string): Promise<void> {
  await apiDelete(url);
}

/** Drops empty values so `?status=` never reaches the API. */
function cleanParams(params?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!params) return undefined;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '' || value === 'all') continue;
    out[key] = value;
  }
  return out;
}
