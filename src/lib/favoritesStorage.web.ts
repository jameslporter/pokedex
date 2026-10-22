import { parseFavorites, serializeFavorites, type Favorite } from './favoritesFormat';

// expo-file-system isn't available on web, so the browser keeps favorites in localStorage.
const KEY = 'pokedex.favorites';

export function loadFavorites(): Favorite[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    return parseFavorites(localStorage.getItem(KEY));
  } catch {
    return [];
  }
}

export function saveFavorites(favorites: Favorite[]) {
  try {
    localStorage.setItem(KEY, serializeFavorites(favorites));
  } catch {
    // Storage can be full or blocked (private mode); favorites still work for this session.
  }
}
