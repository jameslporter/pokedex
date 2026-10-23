import { Link, Stack, useLocalSearchParams } from 'expo-router';
import type { ReactNode } from 'react';
import { Image } from 'expo-image';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import EvolutionChain from '@/components/EvolutionChain';
import FavoriteButton from '@/components/FavoriteButton';
import { ErrorView, Loading } from '@/components/Status';
import TypeMatchups from '@/components/TypeMatchups';
import {
  artworkUrl,
  formatId,
  formatName,
  TYPE_COLORS,
  type Pokemon,
  type PokemonSpecies,
} from '@/lib/pokeapi';
import { usePokemonDetails } from '@/lib/usePokemonDetails';

const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Atk',
  'special-defense': 'Sp. Def',
  speed: 'Speed',
};
const MAX_STAT = 255;

export default function PokemonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { status, data, error, retry } = usePokemonDetails(id);

  if (status === 'loading') return <Loading />;
  if (status === 'error') return <ErrorView message={error.message} onRetry={retry} />;

  const { pokemon, species } = data;
  const primaryColor = TYPE_COLORS[pokemon.types[0]?.type.name] ?? '#A8A77A';

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen
        options={{
          title: formatName(pokemon.name),
          headerRight: () => <FavoriteButton pokemon={{ id: pokemon.id, name: pokemon.name }} size={26} />,
        }}
      />

      <View style={[styles.hero, { backgroundColor: primaryColor + '33' }]}>
        <Image source={artworkUrl(pokemon.id)} style={styles.artwork} contentFit="contain" transition={200} />
        <Text style={styles.number}>{formatId(pokemon.id)}</Text>
        <Text style={styles.name}>{formatName(pokemon.name)}</Text>
        {genus(species) ? <Text style={styles.genus}>{genus(species)}</Text> : null}
        <View style={styles.chips}>
          {pokemon.types.map(({ type }) => (
            <View key={type.name} style={[styles.typeChip, { backgroundColor: TYPE_COLORS[type.name] ?? '#999' }]}>
              <Text style={styles.typeText}>{formatName(type.name)}</Text>
            </View>
          ))}
          {species.is_legendary ? <Badge label="Legendary" /> : null}
          {species.is_mythical ? <Badge label="Mythical" /> : null}
        </View>
      </View>

      {flavorText(species) ? (
        <Section title="About">
          <Text style={styles.body}>{flavorText(species)}</Text>
        </Section>
      ) : null}

      {species.evolution_chain ? (
        <Section title="Evolution">
          <EvolutionChain
            chainUrl={species.evolution_chain.url}
            currentSpecies={pokemon.species.name}
            color={primaryColor}
          />
        </Section>
      ) : null}

      <Section title="Type matchups">
        <TypeMatchups types={pokemon.types.map((t) => t.type.name)} />
      </Section>

      <Section title="Profile">
        <InfoRow label="Height" value={`${(pokemon.height / 10).toFixed(1)} m`} />
        <InfoRow label="Weight" value={`${(pokemon.weight / 10).toFixed(1)} kg`} />
        <InfoRow label="Base experience" value={pokemon.base_experience ?? '—'} />
        <InfoRow label="Capture rate" value={species.capture_rate} />
        <InfoRow label="Base happiness" value={species.base_happiness ?? '—'} />
        <InfoRow label="Habitat" value={species.habitat ? formatName(species.habitat.name) : '—'} />
        <InfoRow label="Generation" value={species.generation.name.replace('generation-', '').toUpperCase()} />
      </Section>

      <Section title="Abilities">
        {pokemon.abilities.map(({ ability, is_hidden }) => (
          <InfoRow key={ability.name} label={formatName(ability.name)} value={is_hidden ? 'Hidden' : ''} />
        ))}
      </Section>

      <Section title="Base stats">
        <Stats pokemon={pokemon} color={primaryColor} />
      </Section>

      <Section title={`Moves (${pokemon.moves.length})`}>
        <View style={[styles.chips, styles.moves]}>
          {pokemon.moves
            .map((m) => m.move.name)
            .sort()
            .map((name) => (
              <Link key={name} href={{ pathname: '/move/[name]', params: { name } }} asChild>
                <Pressable style={styles.moveLink}>
                  {({ pressed }) => (
                    <View style={[styles.moveChip, pressed && styles.pressed]}>
                      <Text style={styles.moveText}>{formatName(name)}</Text>
                    </View>
                  )}
                </Pressable>
              </Link>
            ))}
        </View>
      </Section>
    </ScrollView>
  );
}

function genus(species: PokemonSpecies) {
  return species.genera.find((g) => g.language.name === 'en')?.genus;
}

function flavorText(species: PokemonSpecies) {
  const entry = species.flavor_text_entries.find((e) => e.language.name === 'en');
  // PokeAPI text contains hard line breaks and form-feed characters from the games.
  return entry?.flavor_text.replace(/[\n\f\r]+/g, ' ');
}

function Stats({ pokemon, color }: { pokemon: Pokemon; color: string }) {
  const total = pokemon.stats.reduce((sum, s) => sum + s.base_stat, 0);
  return (
    <View style={styles.stats}>
      {pokemon.stats.map(({ stat, base_stat }) => (
        <View key={stat.name} style={styles.statRow}>
          <Text style={styles.statLabel}>{STAT_LABELS[stat.name] ?? formatName(stat.name)}</Text>
          <Text style={styles.statValue}>{base_stat}</Text>
          <View style={styles.statTrack}>
            <View
              style={[styles.statFill, { width: `${(base_stat / MAX_STAT) * 100}%`, backgroundColor: color }]}
            />
          </View>
        </View>
      ))}
      <View style={styles.statRow}>
        <Text style={[styles.statLabel, styles.bold]}>Total</Text>
        <Text style={[styles.statValue, styles.bold]}>{total}</Text>
        <View style={styles.statTrackSpacer} />
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <View style={[styles.typeChip, styles.badge]}>
      <Text style={styles.typeText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 48, width: '100%', maxWidth: 720, alignSelf: 'center' },
  hero: { alignItems: 'center', paddingTop: 16, paddingBottom: 24, paddingHorizontal: 16 },
  artwork: { width: 240, height: 240 },
  number: { fontSize: 15, color: '#636366', fontVariant: ['tabular-nums'], marginTop: 8 },
  name: { fontSize: 30, fontWeight: '700', color: '#1c1c1e' },
  genus: { fontSize: 15, color: '#636366', marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, justifyContent: 'center' },
  typeChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  typeText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  badge: { backgroundColor: '#1c1c1e' },
  section: { paddingHorizontal: 16, paddingTop: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1c1c1e', marginBottom: 8 },
  body: { fontSize: 16, lineHeight: 23, color: '#3a3a3c' },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#d1d1d6',
  },
  infoLabel: { fontSize: 16, color: '#3a3a3c' },
  infoValue: { fontSize: 16, color: '#1c1c1e', fontWeight: '600' },
  stats: { gap: 10 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statLabel: { width: 64, fontSize: 14, color: '#636366' },
  statValue: { width: 36, fontSize: 14, fontWeight: '600', color: '#1c1c1e', textAlign: 'right' },
  statTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: '#e5e5ea', overflow: 'hidden' },
  statTrackSpacer: { flex: 1 },
  statFill: { height: '100%', borderRadius: 4 },
  bold: { fontWeight: '700', color: '#1c1c1e' },
  moves: { justifyContent: 'flex-start', marginTop: 0 },
  moveLink: Platform.select({ web: { cursor: 'pointer' }, default: {} }),
  pressed: { opacity: 0.6 },
  moveChip: { backgroundColor: '#f2f2f7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  moveText: { fontSize: 13, color: '#3a3a3c' },
});
