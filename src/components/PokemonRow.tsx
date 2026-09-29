import { Link } from 'expo-router';
import { memo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatId, formatName, spriteUrl, type PokemonSummary } from '@/lib/pokeapi';

export const ROW_HEIGHT = 72;

function PokemonRow({ pokemon }: { pokemon: PokemonSummary }) {
  return (
    <Link href={{ pathname: '/pokemon/[id]', params: { id: String(pokemon.id) } }} asChild>
      <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        <View style={styles.spriteWrap}>
          <Image source={{ uri: spriteUrl(pokemon.id) }} style={styles.sprite} resizeMode="contain" />
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {formatName(pokemon.name)}
        </Text>
        <Text style={styles.id}>{formatId(pokemon.id)}</Text>
      </Pressable>
    </Link>
  );
}

export default memo(PokemonRow);

const styles = StyleSheet.create({
  row: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    backgroundColor: '#fff',
  },
  pressed: { backgroundColor: '#f2f2f7' },
  spriteWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f2f2f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sprite: { width: 56, height: 56 },
  name: { flex: 1, fontSize: 17, fontWeight: '600', color: '#1c1c1e' },
  id: { fontSize: 15, color: '#8e8e93', fontVariant: ['tabular-nums'] },
});
