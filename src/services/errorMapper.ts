import i18n from '../lib/i18n';
import type { ApiError } from './apiClient';
export function getErrorMessage(error: ApiError) { return i18n.t(`errors.${error.code}`, { defaultValue: i18n.t('errors.UNKNOWN_ERROR') }); }

/** The message for any failure caught from a request: a known code gets its own wording, anything else the generic one. */
export function describeError(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String((error as { code: unknown }).code) : 'UNKNOWN_ERROR';
  return getErrorMessage({ code });
}
