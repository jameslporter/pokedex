import { fetchPokemonDetails } from './pokeapi';
import { DAY, useAsync } from './useAsync';

// Shared by the detail screen and favorites, so both use (and save) the same copy.
export function usePokemonDetails(id: string | number) {
  return useAsync(`pokemon-${id}`, () => fetchPokemonDetails(id), { persist: { maxAgeMs: 30 * DAY } });
}
