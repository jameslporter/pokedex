import { Link } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Animated,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import FavoriteButton from '@/components/FavoriteButton';
import { Loading } from '@/components/Status';
import { useFavorites, useFavoritesLoaded, type Favorite } from '@/lib/favorites';
import { artworkUrl, fetchPokemonDetails, formatId, formatName, TYPE_COLORS } from '@/lib/pokeapi';
import { useAsync } from '@/lib/useAsync';

const GAP = 16;
const MAX_CARD_WIDTH = 380;
const FALLBACK_COLOR = '#A8A77A';

const keyExtractor = (item: Favorite) => String(item.id);

export default function FavoritesScreen() {
  const favorites = useFavorites();
  const loaded = useFavoritesLoaded();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [scrollX] = useState(() => new Animated.Value(0));
  const [activeIndex, setActiveIndex] = useState(0);

  // Cards take most of the screen, leaving a peek of the neighbours on each side.
  const cardWidth = Math.min(Math.round(windowWidth * 0.78), MAX_CARD_WIDTH);
  const cardHeight = Math.min(Math.round(cardWidth * 1.35), windowHeight - 220);
  const interval = cardWidth + GAP;
  const artSize = Math.min(cardWidth - 64, cardHeight - 200);
  const sidePadding = (windowWidth - cardWidth) / 2;

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
    useNativeDriver: Platform.OS !== 'web',
    listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / interval));
    },
  });

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({ length: interval, offset: interval * index, index }),
    [interval]
  );

  const renderItem = useCallback<ListRenderItem<Favorite>>(
    ({ item, index }) => {
      // Neighbouring cards shrink and fade so the centred one stands out.
      const inputRange = [(index - 1) * interval, index * interval, (index + 1) * interval];
      const scale = scrollX.interpolate({ inputRange, outputRange: [0.88, 1, 0.88], extrapolate: 'clamp' });
      const opacity = scrollX.interpolate({ inputRange, outputRange: [0.6, 1, 0.6], extrapolate: 'clamp' });
      return (
        <Animated.View style={{ width: cardWidth, height: cardHeight, opacity, transform: [{ scale }] }}>
          <FavoriteCard pokemon={item} artSize={artSize} />
        </Animated.View>
      );
    },
    [cardWidth, cardHeight, artSize, interval, scrollX]
  );

  if (!loaded) return <Loading />;

  if (favorites.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyStar}>☆</Text>
        <Text style={styles.emptyTitle}>No favorites yet</Text>
        <Text style={styles.emptyBody}>Tap the star on any Pokémon to add it here.</Text>
        <Link href="/" dismissTo asChild>
          <Pressable style={styles.emptyButton}>
            <Text style={styles.emptyButtonText}>Browse Pokémon</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  const current = Math.min(activeIndex, favorites.length - 1);

  return (
    <View style={styles.container}>
      <Text style={styles.count}>
        {current + 1} of {favorites.length}
      </Text>
      <Animated.FlatList
        data={favorites}
        horizontal
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        showsHorizontalScrollIndicator={Platform.OS === 'web'}
        snapToInterval={interval}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: sidePadding, gap: GAP, alignItems: 'center' }}
        style={styles.carousel}
      />
      <Dots count={favorites.length} active={current} />
    </View>
  );
}

function FavoriteCard({ pokemon, artSize }: { pokemon: Favorite; artSize: number }) {
  // Shares the detail screen's cache, so opening a favourite afterwards is instant.
  const { data } = useAsync(`pokemon-${pokemon.id}`, () => fetchPokemonDetails(pokemon.id));
  const types = data?.pokemon.types.map((t) => t.type.name) ?? [];
  const color = TYPE_COLORS[types[0]] ?? FALLBACK_COLOR;

  return (
    <View style={[styles.card, { backgroundColor: color }]}>
      <Link href={{ pathname: '/pokemon/[id]', params: { id: String(pokemon.id) } }} asChild>
        {/* Link drops function styles on web, so the pressed look is applied via children instead. */}
        <Pressable style={styles.cardLink}>
          {({ pressed }) => (
            <View style={[styles.cardInner, pressed && styles.pressed]}>
              <View style={styles.artworkWrap}>
                <Image
                  source={{ uri: artworkUrl(pokemon.id) }}
                  style={{ width: artSize, height: artSize }}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardNumber}>{formatId(pokemon.id)}</Text>
                <Text style={styles.cardName} numberOfLines={1} adjustsFontSizeToFit>
                  {formatName(pokemon.name)}
                </Text>
                <View style={styles.chips}>
                  {types.map((type) => (
                    <View key={type} style={styles.chip}>
                      <Text style={styles.chipText}>{formatName(type)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
        </Pressable>
      </Link>
      <View style={styles.cardStar}>
        <FavoriteButton pokemon={pokemon} size={32} />
      </View>
    </View>
  );
}

const MAX_DOTS = 12;

function Dots({ count, active }: { count: number; active: number }) {
  // Long lists get a sliding window of dots rather than an endless row.
  const start = Math.max(0, Math.min(active - Math.floor(MAX_DOTS / 2), count - MAX_DOTS));
  const end = Math.min(count, start + MAX_DOTS);
  return (
    <View style={styles.dots}>
      {Array.from({ length: end - start }, (_, i) => start + i).map((i) => (
        <View key={i} style={[styles.dot, i === active && styles.dotActive]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7', justifyContent: 'center' },
  count: { textAlign: 'center', fontSize: 15, fontWeight: '600', color: '#8e8e93', marginTop: 16 },
  carousel: { flexGrow: 0 },
  card: {
    flex: 1,
    borderRadius: 28,
    ...Platform.select({
      web: { boxShadow: '0 8px 24px rgba(0,0,0,0.18)' },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
      },
    }),
  },
  cardLink: { flex: 1, ...Platform.select({ web: { cursor: 'pointer' }, default: {} }) },
  cardInner: { flex: 1 },
  pressed: { opacity: 0.85 },
  artworkWrap: {
    flex: 1,
    margin: 16,
    marginBottom: 0,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { padding: 20, gap: 4 },
  cardNumber: { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.85)', fontVariant: ['tabular-nums'] },
  cardName: { fontSize: 32, fontWeight: '800', color: '#fff' },
  chips: { flexDirection: 'row', gap: 8, marginTop: 6, minHeight: 30 },
  chip: { backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  chipText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  cardStar: {
    position: 'absolute',
    top: 24,
    right: 24,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 999,
    elevation: 9,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#d1d1d6' },
  dotActive: { width: 22, backgroundColor: '#e3350d' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8, backgroundColor: '#f2f2f7' },
  emptyStar: { fontSize: 64, color: '#c7c7cc' },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: '#1c1c1e' },
  emptyBody: { fontSize: 16, color: '#636366', textAlign: 'center' },
  emptyButton: { marginTop: 16, backgroundColor: '#e3350d', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  emptyButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
