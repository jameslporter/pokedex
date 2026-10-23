import AsyncStorage from '@react-native-async-storage/async-storage';

// Saves API responses on the device so screens open instantly on the next launch
// and still work offline. On web this is localStorage, which only holds a few MB,
// so only the most recently used entries are kept.
const PREFIX = 'pokedex.cache.v1.';
const RECENT_KEY = 'pokedex.cache.v1:recent';
const MAX_ENTRIES = 200;

type Entry<T> = { savedAt: number; data: T };

export async function readCache<T>(key: string): Promise<Entry<T> | null> {
  try {
    const text = await AsyncStorage.getItem(PREFIX + key);
    if (!text) return null;
    const entry = JSON.parse(text) as Partial<Entry<T>>;
    if (typeof entry?.savedAt !== 'number' || entry.data === undefined) return null;
    return entry as Entry<T>;
  } catch {
    return null;
  }
}

// Writes are queued so two screens saving at once can't lose each other's entry in the recent list.
let queue: Promise<void> = Promise.resolve();

// `pinned` entries (like the full Pokémon list) are never dropped to make room.
export function writeCache<T>(key: string, data: T, pinned = false): Promise<void> {
  queue = queue.then(() => write(key, data, pinned)).catch((e) => console.warn('Could not save to cache', e));
  return queue;
}

async function write<T>(key: string, data: T, pinned: boolean) {
  const entry: Entry<T> = { savedAt: Date.now(), data };
  if (pinned) return AsyncStorage.setItem(PREFIX + key, JSON.stringify(entry));
  const recent = await readRecent();
  const next = [key, ...recent.filter((k) => k !== key)];
  const evicted = next.splice(MAX_ENTRIES);
  if (evicted.length) await AsyncStorage.multiRemove(evicted.map((k) => PREFIX + k));
  await AsyncStorage.multiSet([
    [PREFIX + key, JSON.stringify(entry)],
    [RECENT_KEY, JSON.stringify(next)],
  ]);
}

async function readRecent(): Promise<string[]> {
  try {
    const list = JSON.parse((await AsyncStorage.getItem(RECENT_KEY)) ?? '[]');
    return Array.isArray(list) ? list.filter((k): k is string => typeof k === 'string') : [];
  } catch {
    return [];
  }
}
