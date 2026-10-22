import { useCallback, useSyncExternalStore } from 'react';

import type { Favorite } from './favoritesFormat';
import { loadFavorites, saveFavorites } from './favoritesStorage';

export type { Favorite };

// A tiny app-wide store. Favorites are read from disk once, on first use,
// and written back on every change. Newest favorites come first.
let favorites: Favorite[] | null = null;
const listeners = new Set<() => void>();
const EMPTY: Favorite[] = [];

function getFavorites(): Favorite[] {
  if (favorites === null) favorites = loadFavorites();
  return favorites;
}

function setFavorites(next: Favorite[]) {
  favorites = next;
  saveFavorites(next);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isFavorite(id: number) {
  return getFavorites().some((f) => f.id === id);
}

export function toggleFavorite(pokemon: Favorite) {
  const current = getFavorites();
  setFavorites(
    current.some((f) => f.id === pokemon.id)
      ? current.filter((f) => f.id !== pokemon.id)
      : [{ id: pokemon.id, name: pokemon.name }, ...current]
  );
}

export function useFavorites(): Favorite[] {
  return useSyncExternalStore(subscribe, getFavorites, () => EMPTY);
}

export function useIsFavorite(id: number): boolean {
  const getSnapshot = useCallback(() => isFavorite(id), [id]);
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
