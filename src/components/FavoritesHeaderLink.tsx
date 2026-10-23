import { Link } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useFavorites } from '@/lib/favorites';

// Header button on the list screen that opens the favorites carousel.
export default function FavoritesHeaderLink() {
  const count = useFavorites().length;
  return (
    <Link href="/favorites" asChild>
      <Pressable
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Favorites, ${count} saved`}
        style={styles.link}
      >
        {({ pressed }) => (
          <View style={[styles.button, pressed && styles.pressed]}>
            <Text style={styles.star}>★</Text>
            {count > 0 ? <Text style={styles.count}>{count}</Text> : null}
          </View>
        )}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  link: Platform.select({ web: { cursor: 'pointer', marginRight: 12 }, default: {} }),
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#fff4cc',
  },
  pressed: { opacity: 0.6 },
  star: { fontSize: 18, color: '#f5b400' },
  count: { fontSize: 15, fontWeight: '700', color: '#1c1c1e', fontVariant: ['tabular-nums'] },
});
