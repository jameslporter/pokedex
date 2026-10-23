import { Link } from 'expo-router';
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { fetchEvolutionChain, type EvolutionStage } from '@/lib/evolution';
import { formatName, spriteUrl } from '@/lib/pokeapi';
import { useAsync } from '@/lib/useAsync';

type Props = {
  chainUrl: string;
  // Species of the Pokémon being viewed. Its stage is highlighted instead of linked.
  currentSpecies: string;
  color: string;
};

export default function EvolutionChain({ chainUrl, currentSpecies, color }: Props) {
  const { status, data, retry } = useAsync(`evolution-${chainUrl}`, () => fetchEvolutionChain(chainUrl));

  if (status === 'loading') return <ActivityIndicator style={styles.loading} />;
  if (status === 'error') {
    return (
      <Pressable onPress={retry} accessibilityRole="button">
        <Text style={styles.note}>Couldn’t load evolutions. Tap to try again.</Text>
      </Pressable>
    );
  }
  if (data.evolvesTo.length === 0) {
    return <Text style={styles.note}>{formatName(data.name)} does not evolve.</Text>;
  }

  if (isFan(data)) return <Fan stage={data} currentSpecies={currentSpecies} color={color} />;

  return (
    // Long or branching chains can be wider than a phone, so they scroll sideways.
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
      <Branch stage={data} currentSpecies={currentSpecies} color={color} />
    </ScrollView>
  );
}

// Pokémon like Eevee branch into many single-stage evolutions. A column of rows
// would be very tall, so those show the base form above a wrapping grid instead.
const FAN_MIN_BRANCHES = 4;

function isFan(stage: EvolutionStage) {
  return stage.evolvesTo.length >= FAN_MIN_BRANCHES && stage.evolvesTo.every((s) => s.evolvesTo.length === 0);
}

function Fan({ stage, currentSpecies, color }: { stage: EvolutionStage; currentSpecies: string; color: string }) {
  return (
    <View style={styles.fan}>
      <Stage stage={stage} current={stage.name === currentSpecies} color={color} />
      <Text style={styles.arrowGlyph}>↓</Text>
      <View style={styles.fanGrid}>
        {stage.evolvesTo.map((next) => (
          <View key={next.id} style={styles.fanItem}>
            <Stage stage={next} current={next.name === currentSpecies} color={color} />
            {next.method ? <Text style={styles.method}>{next.method}</Text> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

function Branch({ stage, currentSpecies, color }: { stage: EvolutionStage; currentSpecies: string; color: string }) {
  return (
    <View style={styles.row}>
      <Stage stage={stage} current={stage.name === currentSpecies} color={color} />
      {stage.evolvesTo.length > 0 ? (
        <View style={styles.branches}>
          {stage.evolvesTo.map((next) => (
            <View key={next.id} style={styles.row}>
              <Arrow method={next.method} />
              <Branch stage={next} currentSpecies={currentSpecies} color={color} />
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function Arrow({ method }: { method: string | null }) {
  return (
    <View style={styles.arrow}>
      <Text style={styles.arrowGlyph}>→</Text>
      {method ? (
        <Text style={styles.method} numberOfLines={3}>
          {method}
        </Text>
      ) : null}
    </View>
  );
}

function Stage({ stage, current, color }: { stage: EvolutionStage; current: boolean; color: string }) {
  const content = (pressed = false) => (
    <View
      style={[styles.stage, current && { backgroundColor: color + '33', borderColor: color }, pressed && styles.pressed]}
    >
      <Image source={{ uri: spriteUrl(stage.id) }} style={styles.sprite} resizeMode="contain" />
      <Text style={[styles.name, current && styles.currentName]} numberOfLines={2}>
        {formatName(stage.name)}
      </Text>
    </View>
  );

  if (current) {
    return (
      <View accessible accessibilityLabel={`${formatName(stage.name)}, current Pokémon`}>
        {content()}
      </View>
    );
  }

  return (
    <Link href={{ pathname: '/pokemon/[id]', params: { id: String(stage.id) } }} push asChild>
      {/* Link drops function styles on web, so the pressed look is applied via children instead. */}
      <Pressable style={styles.link} accessibilityLabel={`View ${formatName(stage.name)}`}>
        {({ pressed }) => content(pressed)}
      </Pressable>
    </Link>
  );
}

const STAGE_WIDTH = 78;

const styles = StyleSheet.create({
  loading: { paddingVertical: 24 },
  note: { fontSize: 16, color: '#636366', paddingVertical: 8 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center' },
  branches: { gap: 8 },
  fan: { alignItems: 'center', gap: 4 },
  fanGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  fanItem: { width: STAGE_WIDTH, alignItems: 'center', gap: 4 },
  arrow: { width: 56, alignItems: 'center', paddingHorizontal: 4 },
  arrowGlyph: { fontSize: 20, color: '#8e8e93' },
  method: { fontSize: 11, lineHeight: 14, color: '#636366', textAlign: 'center' },
  link: Platform.select({ web: { cursor: 'pointer' }, default: {} }),
  stage: {
    width: STAGE_WIDTH,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: '#f2f2f7',
  },
  pressed: { opacity: 0.6 },
  sprite: { width: 56, height: 56 },
  name: { fontSize: 12, fontWeight: '600', color: '#3a3a3c', textAlign: 'center' },
  currentName: { color: '#1c1c1e', fontWeight: '800' },
});
