import { Link } from 'expo-router';
import { memo } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import FavoriteButton from '@/components/FavoriteButton';
import { formatId, formatName, spriteUrl, type PokemonSummary } from '@/lib/pokeapi';

export const CARD_HEIGHT = 120;
const IMAGE_SIZE = 104;
const STAR_SPACE = 56;

type Props = { pokemon: PokemonSummary; width: number };

function PokemonCard({ pokemon, width }: Props) {
  return (
    <View style={{ width, height: CARD_HEIGHT }}>
      <Link href={{ pathname: '/pokemon/[id]', params: { id: String(pokemon.id) } }} asChild>
        {/* Link drops function styles on web, so the pressed look is applied via children instead. */}
        <Pressable style={styles.link}>
          {({ pressed }) => (
            <View style={[styles.card, pressed && styles.pressed]}>
              <View style={styles.imageWrap}>
                <Image source={{ uri: spriteUrl(pokemon.id) }} style={styles.image} resizeMode="contain" />
              </View>
              <View style={styles.text}>
                <Text style={styles.id}>{formatId(pokemon.id)}</Text>
                <Text style={styles.name} numberOfLines={2}>
                  {formatName(pokemon.name)}
                </Text>
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
  id: { fontSize: 14, fontWeight: '600', color: '#8e8e93', fontVariant: ['tabular-nums'] },
  name: { fontSize: 20, fontWeight: '700', color: '#1c1c1e', textAlign: 'right' },
});
