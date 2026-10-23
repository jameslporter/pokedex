import { StyleSheet, Text, View } from 'react-native';

import { formatName, TYPE_COLORS } from '@/lib/pokeapi';
import { defensiveMatchups, formatMultiplier, type Matchup } from '@/lib/typeChart';

// How hard each attacking type hits this Pokémon, based on its own types.
export default function TypeMatchups({ types }: { types: string[] }) {
  const { weak, resist, immune } = defensiveMatchups(types);

  return (
    <View style={styles.container}>
      <Group title="Weak to" matchups={weak} empty="No weaknesses" />
      <Group title="Resists" matchups={resist} empty="No resistances" />
      {immune.length > 0 ? <Group title="Immune to" matchups={immune} /> : null}
    </View>
  );
}

function Group({ title, matchups, empty }: { title: string; matchups: Matchup[]; empty?: string }) {
  return (
    <View style={styles.group}>
      <Text style={styles.title}>{title}</Text>
      {matchups.length === 0 ? (
        <Text style={styles.empty}>{empty}</Text>
      ) : (
        <View style={styles.chips}>
          {matchups.map(({ type, multiplier }) => (
            <View
              key={type}
              style={[styles.chip, { backgroundColor: TYPE_COLORS[type] ?? '#999' }]}
              accessible
              accessibilityLabel={`${formatName(type)}, ${formatMultiplier(multiplier)} damage`}
            >
              <Text style={styles.chipText}>{formatName(type)}</Text>
              <View style={styles.multiplier}>
                <Text style={styles.multiplierText}>{formatMultiplier(multiplier)}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  group: { gap: 6 },
  title: { fontSize: 14, fontWeight: '700', color: '#636366', textTransform: 'uppercase', letterSpacing: 0.5 },
  empty: { fontSize: 15, color: '#8e8e93' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 10,
    paddingRight: 4,
    paddingVertical: 4,
    borderRadius: 999,
  },
  chipText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  multiplier: { backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 },
  multiplierText: { color: '#fff', fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] },
});
