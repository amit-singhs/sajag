import type { ApiErrorBody } from '@sajag/shared';
import { adminTokenStore } from '../auth/token-store';

const BASE_URL = `${(import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')}/api`;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH';

export interface RequestOptions {
  method?: Method;
  body?: unknown;
  /** Explicit bearer token (data-rights flows). Admin routes pick up the admin session automatically. */
  token?: string | null;
  signal?: AbortSignal;
}

function isErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === 'object' && value !== null && 'error' in value;
}

async function send(path: string, { method = 'GET', body, token, signal }: RequestOptions): Promise<Response> {
  const bearer = token ?? (path.startsWith('/admin') ? adminTokenStore.get() : null);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (bearer) headers.Authorization = `Bearer ${bearer}`;

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      signal: signal ?? null,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new ApiError(0, 'network_error', 'सर्वर से संपर्क नहीं हो सका। इंटरनेट कनेक्शन जाँचें।');
  }

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    if (response.status === 401 && path.startsWith('/admin') && path !== '/admin/auth/login') adminTokenStore.clear();
    if (isErrorBody(payload)) throw new ApiError(response.status, payload.error.code, payload.error.message, payload.error.details);
    throw new ApiError(response.status, 'http_error', `Request failed (${response.status})`, payload);
  }
  return response;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await send(path, options);
  return (await response.json()) as T;
}

export async function requestBlob(path: string, options: RequestOptions = {}): Promise<Blob> {
  return (await send(path, options)).blob();
}

/** Human-readable message for any thrown value. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'कुछ गलत हो गया। कृपया फिर से कोशिश करें।';
}
