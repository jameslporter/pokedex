import { useCallback, useEffect, useState } from 'react';

type State<T> =
  | { status: 'loading'; data?: undefined; error?: undefined }
  | { status: 'success'; data: T; error?: undefined }
  | { status: 'error'; data?: undefined; error: Error };

// In-memory cache so revisiting a screen (or going back to the list) is instant.
const cache = new Map<string, unknown>();

export function useAsync<T>(key: string, load: () => Promise<T>) {
  const [state, setState] = useState<State<T>>(() =>
    cache.has(key) ? { status: 'success', data: cache.get(key) as T } : { status: 'loading' }
  );
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (cache.has(key)) {
      setState({ status: 'success', data: cache.get(key) as T });
      return;
    }
    let cancelled = false;
    setState({ status: 'loading' });
    load().then(
      (data) => {
        cache.set(key, data);
        if (!cancelled) setState({ status: 'success', data });
      },
      (error: Error) => {
        if (!cancelled) setState({ status: 'error', error });
      }
    );
    return () => {
      cancelled = true;
    };
    // `load` is expected to be derived from `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, retry };
}
