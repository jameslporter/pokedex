import { useMemo } from 'react';

import {
  API,
  fetchAllPokemon,
  getJson,
  idFromUrl,
  TYPE_COLORS,
  type NamedResource,
  type PokemonSummary,
} from './pokeapi';
import { DAY, useAsync } from './useAsync';

// Every Pokémon with its types and generation, so the list can be colored and
// filtered without loading each Pokémon. PokéAPI has no single endpoint for this,
// so it is put together from the type and generation lists (about 30 requests)
// and saved on the device.
export type IndexedPokemon = PokemonSummary & {
  types: string[];
  // Alternate forms (megas, regional forms, …) have no generation of their own.
  generation: number | null;
};

export type PokedexIndex = { pokemon: IndexedPokemon[]; generations: number[] };

type TypeResponse = { pokemon: { slot: number; pokemon: NamedResource }[] };
type GenerationResponse = { id: number; pokemon_species: NamedResource[] };

export const TYPE_NAMES = Object.keys(TYPE_COLORS);

async function fetchPokedexIndex(): Promise<PokedexIndex> {
  const [all, typeLists, generationList] = await Promise.all([
    fetchAllPokemon(),
    Promise.all(TYPE_NAMES.map((t) => getJson<TypeResponse>(`${API}/type/${t}`))),
    getJson<{ results: NamedResource[] }>(`${API}/generation?limit=100`),
  ]);
  const generationData = await Promise.all(
    generationList.results.map((g) => getJson<GenerationResponse>(g.url))
  );

  const types = new Map<number, { slot: number; name: string }[]>();
  typeLists.forEach((list, i) => {
    for (const { slot, pokemon } of list.pokemon) {
      const id = idFromUrl(pokemon.url);
      types.set(id, [...(types.get(id) ?? []), { slot, name: TYPE_NAMES[i] }]);
    }
  });

  // A species id is also the id of its default form.
  const generationOf = new Map<number, number>();
  for (const gen of generationData) {
    for (const species of gen.pokemon_species) generationOf.set(idFromUrl(species.url), gen.id);
  }

  return {
    pokemon: all.map((p) => ({
      ...p,
      types: (types.get(p.id) ?? []).sort((a, b) => a.slot - b.slot).map((t) => t.name),
      generation: generationOf.get(p.id) ?? null,
    })),
    generations: generationData.map((g) => g.id).sort((a, b) => a - b),
  };
}

export function usePokedexIndex() {
  return useAsync('pokedex-index', fetchPokedexIndex, { persist: { maxAgeMs: 7 * DAY, pinned: true } });
}

// Types by Pokémon id, for screens that only have names and ids. Empty until the index loads.
export function useTypesById(): Map<number, string[]> {
  const { data } = usePokedexIndex();
  return useMemo(() => new Map(data?.pokemon.map((p) => [p.id, p.types])), [data]);
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
export const generationLabel = (n: number) => ROMAN[n - 1] ?? String(n);
