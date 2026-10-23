import { useCallback, useSyncExternalStore } from 'react';

import type { Favorite } from './favoritesFormat';
import { loadFavorites, saveFavorites } from './favoritesStorage';

export type { Favorite };

// A tiny app-wide store. Favorites are loaded from storage once, on first use,
// and written back on every change. Newest favorites come first.
const EMPTY: Favorite[] = [];
let favorites: Favorite[] = EMPTY;
let loaded = false;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function ensureLoaded(): Promise<void> {
  loading ??= loadFavorites().then((stored) => {
    favorites = stored;
    loaded = true;
    emit();
  });
  return loading;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  void ensureLoaded();
  return () => {
    listeners.delete(listener);
  };
}

export async function toggleFavorite(pokemon: Favorite) {
  // Wait for stored favorites so an early tap can't overwrite them.
  await ensureLoaded();
  favorites = favorites.some((f) => f.id === pokemon.id)
    ? favorites.filter((f) => f.id !== pokemon.id)
    : [{ id: pokemon.id, name: pokemon.name }, ...favorites];
  emit();
  await saveFavorites(favorites);
}

export function useFavorites(): Favorite[] {
  return useSyncExternalStore(subscribe, () => favorites, () => EMPTY);
}

export function useFavoritesLoaded(): boolean {
  return useSyncExternalStore(subscribe, () => loaded, () => false);
}

export function useIsFavorite(id: number): boolean {
  const getSnapshot = useCallback(() => favorites.some((f) => f.id === id), [id]);
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
