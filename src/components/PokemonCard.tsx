import { Link } from 'expo-router';
import { memo } from 'react';
import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import FavoriteButton from '@/components/FavoriteButton';
import { formatId, formatName, spriteUrl, TYPE_COLORS, type PokemonSummary } from '@/lib/pokeapi';

export const CARD_HEIGHT = 120;
const IMAGE_SIZE = 104;
const STAR_SPACE = 56;

// Types are optional: they fill in once the full Pokémon index has loaded.
type Props = { pokemon: PokemonSummary; width: number; types?: string[] };

function PokemonCard({ pokemon, width, types = [] }: Props) {
  const color = TYPE_COLORS[types[0]];
  return (
    <View style={{ width, height: CARD_HEIGHT }}>
      <Link href={{ pathname: '/pokemon/[id]', params: { id: String(pokemon.id) } }} asChild>
        {/* Link drops function styles on web, so the pressed look is applied via children instead. */}
        <Pressable style={styles.link}>
          {({ pressed }) => (
            <View style={[styles.card, color && { backgroundColor: tint(color, 0.12) }, pressed && styles.pressed]}>
              <View style={[styles.imageWrap, color && { backgroundColor: tint(color, 0.28) }]}>
                <Image
                  source={spriteUrl(pokemon.id)}
                  style={styles.image}
                  contentFit="contain"
                  transition={150}
                  // Cards are recycled while scrolling; this stops the old sprite flashing.
                  recyclingKey={String(pokemon.id)}
                />
              </View>
              <View style={styles.text}>
                <Text style={styles.id}>{formatId(pokemon.id)}</Text>
                <Text style={styles.name} numberOfLines={2}>
                  {formatName(pokemon.name)}
                </Text>
                {types.length > 0 ? (
                  <View style={styles.types}>
                    {types.map((type) => (
                      <View key={type} style={[styles.type, { backgroundColor: TYPE_COLORS[type] ?? '#999' }]}>
                        <Text style={styles.typeText}>{formatName(type)}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            </View>
          )}
        </Pressable>
      </Link>
      {/* A sibling of the link, not a child, so tapping the star never opens the detail screen. */}
      <View style={styles.star}>
        <FavoriteButton pokemon={pokemon} />
      </View>
    </View>
  );
}

export default memo(PokemonCard);

// A light wash of the type color over white, as an opaque color so shadows still render on iOS.
function tint(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(255 + (c - 255) * amount);
  return `rgb(${mix(n >> 16)}, ${mix((n >> 8) & 255)}, ${mix(n & 255)})`;
}

const styles = StyleSheet.create({
  link: { flex: 1, ...Platform.select({ web: { cursor: 'pointer' }, default: {} }) },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 8,
    paddingRight: STAR_SPACE,
    borderRadius: 20,
    backgroundColor: '#fff',
    ...Platform.select({
      web: { boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)' },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      },
    }),
  },
  star: {
    position: 'absolute',
    right: 10,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    // The card has elevation on Android, which would otherwise draw over the star.
    elevation: 3,
  },
  pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
  imageWrap: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 16,
    backgroundColor: '#f2f2f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Sprites are 96px pixel art; render slightly larger to fill the tile.
  image: { width: IMAGE_SIZE, height: IMAGE_SIZE },
  text: { flex: 1, alignItems: 'flex-end', gap: 4 },
  types: { flexDirection: 'row', gap: 4, marginTop: 2 },
  type: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  typeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  id: { fontSize: 14, fontWeight: '600', color: '#8e8e93', fontVariant: ['tabular-nums'] },
  name: { fontSize: 20, fontWeight: '700', color: '#1c1c1e', textAlign: 'right' },
});
