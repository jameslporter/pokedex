// Damage multipliers for attacking type → defending type (the chart used since Gen VI).
// Kept in the app rather than fetched, so matchups show instantly and offline.
const CHART: Record<string, { double?: string[]; half?: string[]; none?: string[] }> = {
  normal: { half: ['rock', 'steel'], none: ['ghost'] },
  fire: { double: ['grass', 'ice', 'bug', 'steel'], half: ['fire', 'water', 'rock', 'dragon'] },
  water: { double: ['fire', 'ground', 'rock'], half: ['water', 'grass', 'dragon'] },
  electric: { double: ['water', 'flying'], half: ['electric', 'grass', 'dragon'], none: ['ground'] },
  grass: {
    double: ['water', 'ground', 'rock'],
    half: ['fire', 'grass', 'poison', 'flying', 'bug', 'dragon', 'steel'],
  },
  ice: { double: ['grass', 'ground', 'flying', 'dragon'], half: ['fire', 'water', 'ice', 'steel'] },
  fighting: {
    double: ['normal', 'ice', 'rock', 'dark', 'steel'],
    half: ['poison', 'flying', 'psychic', 'bug', 'fairy'],
    none: ['ghost'],
  },
  poison: { double: ['grass', 'fairy'], half: ['poison', 'ground', 'rock', 'ghost'], none: ['steel'] },
  ground: { double: ['fire', 'electric', 'poison', 'rock', 'steel'], half: ['grass', 'bug'], none: ['flying'] },
  flying: { double: ['grass', 'fighting', 'bug'], half: ['electric', 'rock', 'steel'] },
  psychic: { double: ['fighting', 'poison'], half: ['psychic', 'steel'], none: ['dark'] },
  bug: {
    double: ['grass', 'psychic', 'dark'],
    half: ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel', 'fairy'],
  },
  rock: { double: ['fire', 'ice', 'flying', 'bug'], half: ['fighting', 'ground', 'steel'] },
  ghost: { double: ['psychic', 'ghost'], half: ['dark'], none: ['normal'] },
  dragon: { double: ['dragon'], half: ['steel'], none: ['fairy'] },
  dark: { double: ['psychic', 'ghost'], half: ['fighting', 'dark', 'fairy'] },
  steel: { double: ['ice', 'rock', 'fairy'], half: ['fire', 'water', 'electric', 'steel'] },
  fairy: { double: ['fighting', 'dragon', 'dark'], half: ['fire', 'poison', 'steel'] },
};

export const ATTACK_TYPES = Object.keys(CHART);

function multiplier(attack: string, defend: string): number {
  const row = CHART[attack];
  if (row.none?.includes(defend)) return 0;
  if (row.double?.includes(defend)) return 2;
  if (row.half?.includes(defend)) return 0.5;
  return 1;
}

export type Matchup = { type: string; multiplier: number };

// How much damage each attacking type does to a Pokémon with these types,
// leaving out the neutral (1×) ones. Strongest first within each group.
export function defensiveMatchups(types: string[]) {
  const all: Matchup[] = ATTACK_TYPES.map((attack) => ({
    type: attack,
    multiplier: types.reduce((m, defend) => m * multiplier(attack, defend), 1),
  }));
  const byStrength = (a: Matchup, b: Matchup) => b.multiplier - a.multiplier;
  return {
    weak: all.filter((m) => m.multiplier > 1).sort(byStrength),
    resist: all.filter((m) => m.multiplier > 0 && m.multiplier < 1).sort(byStrength),
    immune: all.filter((m) => m.multiplier === 0),
  };
}

export function formatMultiplier(m: number): string {
  if (m === 0.5) return '½×';
  if (m === 0.25) return '¼×';
  return `${m}×`;
}
