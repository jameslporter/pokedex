import { memo } from 'react';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';

import { toggleFavorite, useIsFavorite, type Favorite } from '@/lib/favorites';
import { formatName } from '@/lib/pokeapi';

type Props = { pokemon: Favorite; size?: number };

function FavoriteButton({ pokemon, size = 28 }: Props) {
  const starred = useIsFavorite(pokemon.id);
  const label = formatName(pokemon.name);

  return (
    <Pressable
      onPress={() => toggleFavorite(pokemon)}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityState={{ selected: starred }}
      accessibilityLabel={starred ? `Remove ${label} from favorites` : `Add ${label} to favorites`}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={[styles.star, { fontSize: size, lineHeight: size * 1.15 }, starred ? styles.on : styles.off]}>
        {starred ? '★' : '☆'}
      </Text>
    </Pressable>
  );
}

export default memo(FavoriteButton);

const styles = StyleSheet.create({
  button: {
    padding: 4,
    ...Platform.select({ web: { cursor: 'pointer' }, default: {} }),
  },
  pressed: { opacity: 0.6, transform: [{ scale: 0.9 }] },
  star: { textAlign: 'center' },
  on: { color: '#f5b400' },
  off: { color: '#c7c7cc' },
});
