import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { generationLabel, TYPE_NAMES } from '@/lib/pokedexIndex';
import { formatName, TYPE_COLORS } from '@/lib/pokeapi';

type Props = {
  width: number;
  types: string[];
  onToggleType: (type: string) => void;
  generations: number[];
  generation: number | null;
  onSelectGeneration: (generation: number | null) => void;
  resultCount: number;
  onClear: () => void;
};

export default function ListFilters({
  width,
  types,
  onToggleType,
  generations,
  generation,
  onSelectGeneration,
  resultCount,
  onClear,
}: Props) {
  const active = types.length > 0 || generation !== null;

  return (
    <View style={[styles.container, { width }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {TYPE_NAMES.map((type) => {
          const selected = types.includes(type);
          const color = TYPE_COLORS[type];
          return (
            <Chip
              key={type}
              label={formatName(type)}
              selected={selected}
              onPress={() => onToggleType(type)}
              // Unselected chips use a light wash so pale types (Electric, Ice) stay readable.
              style={selected ? { backgroundColor: color, borderColor: color } : { backgroundColor: color + '22', borderColor: color }}
              textColor={selected ? '#fff' : '#1c1c1e'}
              accessibilityLabel={`${formatName(type)} type`}
            />
          );
        })}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <Text style={styles.rowLabel}>Gen</Text>
        {generations.map((n) => {
          const selected = generation === n;
          return (
            <Chip
              key={n}
              label={generationLabel(n)}
              selected={selected}
              onPress={() => onSelectGeneration(selected ? null : n)}
              style={selected ? styles.genSelected : styles.gen}
              textColor={selected ? '#fff' : '#3a3a3c'}
              accessibilityLabel={`Generation ${n}`}
            />
          );
        })}
      </ScrollView>
      {active ? (
        <View style={styles.summary}>
          <Text style={styles.count}>
            {resultCount} Pokémon
          </Text>
          <Pressable onPress={onClear} hitSlop={8} accessibilityRole="button" style={styles.clear}>
            <Text style={styles.clearText}>Clear filters</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
  style,
  textColor,
  accessibilityLabel,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  style: object;
  textColor: string;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.chip, style, pressed && styles.pressed]}
    >
      <Text style={[styles.chipText, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8, paddingBottom: 4 },
  row: { gap: 6, alignItems: 'center', paddingVertical: 2 },
  rowLabel: { fontSize: 13, fontWeight: '700', color: '#8e8e93', marginRight: 2 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.5,
    backgroundColor: '#fff',
    ...Platform.select({ web: { cursor: 'pointer' }, default: {} }),
  },
  chipText: { fontSize: 13, fontWeight: '700' },
  gen: { borderColor: '#d1d1d6', minWidth: 40, alignItems: 'center' },
  genSelected: { backgroundColor: '#1c1c1e', borderColor: '#1c1c1e', minWidth: 40, alignItems: 'center' },
  pressed: { opacity: 0.6 },
  summary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  count: { fontSize: 14, color: '#636366', fontWeight: '600' },
  clear: Platform.select({ web: { cursor: 'pointer' }, default: {} }),
  clearText: { fontSize: 14, color: '#e3350d', fontWeight: '600' },
});
