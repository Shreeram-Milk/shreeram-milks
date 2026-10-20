import type { ImageSource } from 'expo-image';

/**
 * A picture from our storage, saved on the phone under its file address without the signature part (`?X-Amz-...`).
 * The server re-signs links every half hour; keyed by the whole link, the phone would download the same picture again each time.
 * Every uploaded picture has its own file name, so a replaced picture still shows at once.
 */
export function remoteImage(url: string | null | undefined): ImageSource | undefined {
  if (!url) return undefined;
  return { uri: url, cacheKey: url.split('?')[0] };
}
