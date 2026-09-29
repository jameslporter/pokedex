const API = 'https://pokeapi.co/api/v2';
const SPRITES = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

export type PokemonSummary = {
  id: number;
  name: string;
};

type NamedResource = { name: string; url: string };

export type Pokemon = {
  id: number;
  name: string;
  height: number; // decimetres
  weight: number; // hectograms
  base_experience: number | null;
  types: { slot: number; type: NamedResource }[];
  abilities: { ability: NamedResource; is_hidden: boolean }[];
  stats: { base_stat: number; stat: NamedResource }[];
  moves: { move: NamedResource }[];
  species: NamedResource;
};

export type PokemonSpecies = {
  genera: { genus: string; language: NamedResource }[];
  flavor_text_entries: { flavor_text: string; language: NamedResource }[];
  is_legendary: boolean;
  is_mythical: boolean;
  capture_rate: number;
  base_happiness: number | null;
  habitat: NamedResource | null;
  generation: NamedResource;
};

export type PokemonDetails = { pokemon: Pokemon; species: PokemonSpecies };

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

function idFromUrl(url: string): number {
  return Number(url.split('/').filter(Boolean).pop());
}

export async function fetchAllPokemon(): Promise<PokemonSummary[]> {
  const data = await getJson<{ results: NamedResource[] }>(`${API}/pokemon?limit=100000`);
  return data.results.map((r) => ({ id: idFromUrl(r.url), name: r.name }));
}

export async function fetchPokemonDetails(id: string | number): Promise<PokemonDetails> {
  const pokemon = await getJson<Pokemon>(`${API}/pokemon/${id}`);
  const species = await getJson<PokemonSpecies>(pokemon.species.url);
  return { pokemon, species };
}

export const spriteUrl = (id: number) => `${SPRITES}/${id}.png`;
export const artworkUrl = (id: number) => `${SPRITES}/other/official-artwork/${id}.png`;

export function formatName(name: string): string {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export const formatId = (id: number) => `#${String(id).padStart(4, '0')}`;

export const TYPE_COLORS: Record<string, string> = {
  normal: '#A8A77A',
  fire: '#EE8130',
  water: '#6390F0',
  electric: '#F7D02C',
  grass: '#7AC74C',
  ice: '#96D9D6',
  fighting: '#C22E28',
  poison: '#A33EA1',
  ground: '#E2BF65',
  flying: '#A98FF3',
  psychic: '#F95587',
  bug: '#A6B91A',
  rock: '#B6A136',
  ghost: '#735797',
  dragon: '#6F35FC',
  dark: '#705746',
  steel: '#B7B7CE',
  fairy: '#D685AD',
};
