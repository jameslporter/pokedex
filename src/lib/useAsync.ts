import { useCallback, useEffect, useState } from 'react';

import { readCache, writeCache } from './persistentCache';

type State<T> =
  | { status: 'loading'; data?: undefined; error?: undefined }
  | { status: 'success'; data: T; error?: undefined }
  | { status: 'error'; data?: undefined; error: Error };

type Options = {
  // Also save the result on the device. A saved copy is shown straight away on
  // later launches (and offline); once it is older than `maxAgeMs` it is refreshed
  // in the background.
  persist?: { maxAgeMs: number; pinned?: boolean };
};

export const DAY = 24 * 60 * 60 * 1000;

// In-memory cache so revisiting a screen (or going back to the list) is instant.
const cache = new Map<string, unknown>();

export function useAsync<T>(key: string, load: () => Promise<T>, options: Options = {}) {
  // State is tagged with its key, so switching keys shows the new key's data
  // (or a loading state) straight away instead of the previous key's result.
  const [result, setResult] = useState<{ key: string; state: State<T> } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const persist = options.persist;

  const state: State<T> =
    result?.key === key
      ? result.state
      : cache.has(key)
        ? { status: 'success', data: cache.get(key) as T }
        : { status: 'loading' };

  useEffect(() => {
    if (cache.has(key)) return;
    let cancelled = false;
    const show = (next: State<T>) => {
      if (!cancelled) setResult({ key, state: next });
    };

    const fetchFresh = () =>
      load().then((data) => {
        cache.set(key, data);
        if (persist) void writeCache(key, data, persist.pinned);
        show({ status: 'success', data });
      });

    (async () => {
      const saved = persist ? await readCache<T>(key) : null;
      if (saved) {
        cache.set(key, saved.data);
        show({ status: 'success', data: saved.data });
        // Offline or a failed refresh is fine: the saved copy stays on screen.
        if (Date.now() - saved.savedAt > persist!.maxAgeMs) fetchFresh().catch(() => {});
        return;
      }
      await fetchFresh();
    })().catch((error: Error) => show({ status: 'error', error }));

    return () => {
      cancelled = true;
    };
    // `load` and `options` are expected to be derived from `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  const retry = useCallback(() => {
    setResult({ key, state: { status: 'loading' } });
    setAttempt((n) => n + 1);
  }, [key]);

  return { ...state, retry };
}
