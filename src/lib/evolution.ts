import { formatName, getJson, idFromUrl } from './pokeapi';

type NamedResource = { name: string; url: string };

// One way a Pokémon can evolve. PokéAPI lists several when the method differs
// between games (for example a special location in one game, a stone in another).
type EvolutionDetail = {
  trigger: NamedResource;
  item?: NamedResource | null;
  held_item?: NamedResource | null;
  known_move?: NamedResource | null;
  known_move_type?: NamedResource | null;
  location?: NamedResource | null;
  party_species?: NamedResource | null;
  party_type?: NamedResource | null;
  trade_species?: NamedResource | null;
  gender?: number | null;
  min_level?: number | null;
  min_happiness?: number | null;
  min_affection?: number | null;
  min_beauty?: number | null;
  relative_physical_stats?: number | null;
  time_of_day?: string;
  needs_overworld_rain?: boolean;
  turn_upside_down?: boolean;
};

type ChainLink = {
  species: NamedResource;
  evolution_details: EvolutionDetail[];
  evolves_to: ChainLink[];
};

export type EvolutionStage = {
  id: number; // species id, which is also the id of the default form
  name: string;
  // How the previous stage evolves into this one, e.g. "Lv. 16" or "Water Stone".
  method: string | null;
  evolvesTo: EvolutionStage[];
};

export async function fetchEvolutionChain(url: string): Promise<EvolutionStage> {
  const data = await getJson<{ chain: ChainLink }>(url);
  return toStage(data.chain);
}

function toStage(link: ChainLink): EvolutionStage {
  return {
    id: idFromUrl(link.species.url),
    name: link.species.name,
    method: describeMethods(link.evolution_details),
    evolvesTo: link.evolves_to.map(toStage),
  };
}

const MAX_METHODS = 2;

function describeMethods(details: EvolutionDetail[]): string | null {
  const unique = [...new Set(details.map(describeMethod))];
  if (unique.length === 0) return null;
  const shown = unique.slice(0, MAX_METHODS).join(' or ');
  return unique.length > MAX_METHODS ? `${shown}, …` : shown;
}

function describeMethod(d: EvolutionDetail): string {
  const extras: string[] = [];
  if (d.min_happiness) extras.push('high friendship');
  if (d.min_affection) extras.push('high affection');
  if (d.min_beauty) extras.push('high beauty');
  if (d.held_item) extras.push(`holding ${formatName(d.held_item.name)}`);
  if (d.known_move) extras.push(`knowing ${formatName(d.known_move.name)}`);
  if (d.known_move_type) extras.push(`knowing a ${formatName(d.known_move_type.name)} move`);
  if (d.party_species) extras.push(`with ${formatName(d.party_species.name)} in party`);
  if (d.party_type) extras.push(`with a ${formatName(d.party_type.name)} type in party`);
  if (d.trade_species) extras.push(`for ${formatName(d.trade_species.name)}`);
  if (d.location) extras.push(`at ${formatName(d.location.name)}`);
  if (d.time_of_day === 'day') extras.push('daytime');
  if (d.time_of_day === 'night') extras.push('at night');
  if (d.time_of_day === 'dusk') extras.push('at dusk');
  if (d.needs_overworld_rain) extras.push('in rain');
  if (d.turn_upside_down) extras.push('upside down');
  if (d.gender === 1) extras.push('female');
  if (d.gender === 2) extras.push('male');
  if (d.relative_physical_stats === 1) extras.push('Atk > Def');
  if (d.relative_physical_stats === -1) extras.push('Atk < Def');
  if (d.relative_physical_stats === 0) extras.push('Atk = Def');

  let base: string;
  switch (d.trigger.name) {
    case 'level-up':
      base = d.min_level ? `Lv. ${d.min_level}` : extras.length ? '' : 'Level up';
      break;
    case 'use-item':
      base = d.item ? formatName(d.item.name) : 'Use item';
      break;
    case 'trade':
      base = 'Trade';
      break;
    default:
      base = formatName(d.trigger.name);
  }

  const text = [base, ...extras].filter(Boolean).join(', ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}
