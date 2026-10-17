import { appConfig } from '../config/appConfig';

export interface ApiError {
  code: string;
  message?: string;
}

/** A failed request, carrying the backend's stable error code so screens can show a translated message. */
export class ApiRequestError extends Error implements ApiError {
  /** Extra facts the backend sent with the error, for example the earliest date allowed. */
  constructor(readonly code: string, readonly status: number, message?: string, readonly details: Record<string, unknown> = {}) {
    super(message ?? code);
  }
}

const REQUEST_TIMEOUT_MS = 10_000;

/** True when the app is set up to talk to the backend. Without an address it uses its bundled sample data. */
export const hasApi = (): boolean => appConfig.apiUrl.length > 0;

type AuthHooks = { getToken: () => string | null; onUnauthorized: () => void };
let authHooks: AuthHooks = { getToken: () => null, onUnauthorized: () => undefined };

/** The session store plugs in here, so this file never imports app state: it asks for the token and reports a refused one. */
export function configureAuth(hooks: AuthHooks): void {
  authHooks = hooks;
}

type RequestOptions = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: unknown;
  /** Send the signed-in customer's token. Public content (products, banners) never sends it. */
  auth?: boolean;
};

/**
 * The one HTTP boundary. Screens never call this directly: they use a domain service, which uses a query hook.
 * Gives up after 10 seconds, and turns every failure into an `ApiRequestError` with a stable code.
 * A refused token (`UNAUTHENTICATED`) signs the customer out everywhere in the app.
 */
async function request<Response>({ method, path, body, auth = false }: RequestOptions): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const token = auth ? authHooks.getToken() : null;
  try {
    const result = await fetch(`${appConfig.apiUrl.replace(/\/$/, '')}${path}`, {
      method,
      signal: controller.signal,
      headers: { Accept: 'application/json', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    // A 204 answer has no body, so a missing body is not an error.
    const parsed = (await result.json().catch(() => null)) as { error?: { code?: unknown; details?: unknown } } | null;
    if (!result.ok) {
      const code = typeof parsed?.error?.code === 'string' ? parsed.error.code : 'UNKNOWN_ERROR';
      if (auth && code === 'UNAUTHENTICATED') authHooks.onUnauthorized();
      const details = typeof parsed?.error?.details === 'object' && parsed.error.details !== null ? (parsed.error.details as Record<string, unknown>) : {};
      throw new ApiRequestError(code, result.status, undefined, details);
    }
    return parsed as Response;
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    throw new ApiRequestError('NETWORK_ERROR', 0);
  } finally {
    clearTimeout(timer);
  }
}

export const apiGet = <Response>(path: string, options: { auth?: boolean } = {}): Promise<Response> => request<Response>({ method: 'GET', path, auth: options.auth });

export const apiSend = <Response>(method: 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown, options: { auth?: boolean } = {}): Promise<Response> => request<Response>({ method, path, body, auth: options.auth });
