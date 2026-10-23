import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, StyleSheet, Text, useWindowDimensions, View, type ListRenderItem } from 'react-native';

import PokemonCard from '@/components/PokemonCard';
import { ErrorView, Loading } from '@/components/Status';
import { fetchMove, formatName, TYPE_COLORS, type Move, type PokemonSummary } from '@/lib/pokeapi';
import { useAsync } from '@/lib/useAsync';

const GAP = 12;
const PADDING = 16;
const MIN_CARD_WIDTH = 300;
const MAX_COLUMNS = 4;
const MAX_CONTENT_WIDTH = 1280;

const keyExtractor = (item: PokemonSummary) => String(item.id);

export default function MoveScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const { status, data, error, retry } = useAsync(`move-${name}`, () => fetchMove(name));
  const { width: windowWidth } = useWindowDimensions();

  // Same responsive grid as the home list: one column on phones, more on wider screens.
  const contentWidth = Math.min(windowWidth, MAX_CONTENT_WIDTH) - PADDING * 2;
  const numColumns = Math.max(
    1,
    Math.min(MAX_COLUMNS, Math.floor((contentWidth + GAP) / (MIN_CARD_WIDTH + GAP)))
  );
  const cardWidth = Math.floor((contentWidth - GAP * (numColumns - 1)) / numColumns);

  const renderItem = useCallback<ListRenderItem<PokemonSummary>>(
    ({ item }) => <PokemonCard pokemon={item} width={cardWidth} />,
    [cardWidth]
  );

  if (status === 'loading') return <Loading />;
  if (status === 'error') return <ErrorView message={error.message} onRetry={retry} />;

  const { move, learnedBy } = data;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: formatName(move.name) }} />
      <FlatList
        // FlatList can't change numColumns in place; remount when the breakpoint changes.
        key={numColumns}
        data={learnedBy}
        numColumns={numColumns}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={<MoveHeader move={move} count={learnedBy.length} />}
        ListEmptyComponent={<Text style={styles.empty}>No Pokémon learn this move.</Text>}
        columnWrapperStyle={numColumns > 1 ? styles.columns : undefined}
        contentContainerStyle={[styles.listContent, { width: contentWidth }]}
        style={styles.list}
        initialNumToRender={12}
        maxToRenderPerBatch={16}
        windowSize={11}
      />
    </View>
  );
}

function MoveHeader({ move, count }: { move: Move; count: number }) {
  const color = TYPE_COLORS[move.type.name] ?? '#A8A77A';
  const effect = effectText(move);
  const description = flavorText(move);

  return (
    <View style={styles.header}>
      <View style={[styles.hero, { backgroundColor: color + '33' }]}>
        <Text style={styles.name}>{formatName(move.name)}</Text>
        <View style={styles.chips}>
          <View style={[styles.chip, { backgroundColor: color }]}>
            <Text style={styles.chipText}>{formatName(move.type.name)}</Text>
          </View>
          {move.damage_class ? (
            <View style={[styles.chip, styles.classChip]}>
              <Text style={styles.chipText}>{formatName(move.damage_class.name)}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.stats}>
          <Stat label="Power" value={move.power ?? '—'} />
          <Stat label="Accuracy" value={move.accuracy != null ? `${move.accuracy}%` : '—'} />
          <Stat label="PP" value={move.pp ?? '—'} />
        </View>
      </View>

      {effect ? <Text style={styles.effect}>{effect}</Text> : null}
      {description && description !== effect ? <Text style={styles.description}>{description}</Text> : null}

      <View style={styles.meta}>
        {move.priority !== 0 ? (
          <InfoRow label="Priority" value={move.priority > 0 ? `+${move.priority}` : move.priority} />
        ) : null}
        <InfoRow label="Target" value={formatName(move.target.name)} />
        <InfoRow
          label="Introduced"
          value={`Generation ${move.generation.name.replace('generation-', '').toUpperCase()}`}
          last
        />
      </View>

      <Text style={styles.sectionTitle}>Learned by {count} Pokémon</Text>
    </View>
  );
}

function effectText(move: Move) {
  const entry = move.effect_entries.find((e) => e.language.name === 'en');
  if (!entry) return undefined;
  // PokeAPI leaves a placeholder for the chance, e.g. "Has a $effect_chance% chance to burn".
  return entry.short_effect
    .replace(/\$effect_chance/g, String(move.effect_chance ?? ''))
    .replace(/\s+/g, ' ')
    .trim();
}

function flavorText(move: Move) {
  // Entries run oldest to newest game; the latest wording is usually the clearest.
  const entries = move.flavor_text_entries.filter((e) => e.language.name === 'en');
  return entries[entries.length - 1]?.flavor_text.replace(/\s+/g, ' ').trim();
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string | number; last?: boolean }) {
  return (
    <View style={[styles.infoRow, last && styles.lastRow]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7' },
  list: { flex: 1 },
  listContent: { alignSelf: 'center', paddingTop: 16, paddingBottom: 32, gap: GAP },
  columns: { gap: GAP },
  empty: { fontSize: 16, color: '#636366', textAlign: 'center', paddingVertical: 24 },
  header: { gap: 12 },
  hero: { alignItems: 'center', borderRadius: 20, paddingVertical: 20, paddingHorizontal: 16 },
  name: { fontSize: 28, fontWeight: '700', color: '#1c1c1e', textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, justifyContent: 'center' },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  classChip: { backgroundColor: '#1c1c1e' },
  chipText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  stats: { flexDirection: 'row', width: '100%', maxWidth: 420, justifyContent: 'space-around', marginTop: 18 },
  stat: { alignItems: 'center', minWidth: 72 },
  statValue: { fontSize: 22, fontWeight: '700', color: '#1c1c1e', fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 13, color: '#636366', marginTop: 2 },
  effect: { fontSize: 17, lineHeight: 24, fontWeight: '600', color: '#1c1c1e', paddingHorizontal: 4 },
  description: { fontSize: 16, lineHeight: 23, color: '#3a3a3c', paddingHorizontal: 4 },
  meta: { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#d1d1d6',
  },
  lastRow: { borderBottomWidth: 0 },
  infoLabel: { fontSize: 16, color: '#3a3a3c' },
  infoValue: { fontSize: 16, color: '#1c1c1e', fontWeight: '600' },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1c1c1e', marginTop: 12 },
});
