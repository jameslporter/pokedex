import type { PokemonSummary } from './pokeapi';

export type Favorite = PokemonSummary;

type StoredFavorites = { version: 1; favorites: Favorite[] };

export function serializeFavorites(favorites: Favorite[]): string {
  const data: StoredFavorites = { version: 1, favorites };
  return JSON.stringify(data);
}

// Tolerates missing or corrupt data so a bad file never crashes the app.
export function parseFavorites(text: string | null | undefined): Favorite[] {
  if (!text) return [];
  try {
    const data = JSON.parse(text) as Partial<StoredFavorites>;
    if (!Array.isArray(data.favorites)) return [];
    return data.favorites.filter(
      (f): f is Favorite => typeof f?.id === 'number' && typeof f?.name === 'string'
    );
  } catch {
    return [];
  }
}
