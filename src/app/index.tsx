import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import ListFilters from '@/components/ListFilters';
import PokemonCard, { CARD_HEIGHT } from '@/components/PokemonCard';
import { ErrorView, Loading } from '@/components/Status';
import { usePokedexIndex, type IndexedPokemon } from '@/lib/pokedexIndex';

const GAP = 12;
const PADDING = 16;
const MIN_CARD_WIDTH = 300;
const MAX_COLUMNS = 4;
const MAX_CONTENT_WIDTH = 1280;

// Rows are a fixed height, so the list never has to measure them — keeps fast scrolling smooth.
// With numColumns, FlatList virtualizes by row, so `index` here is the row index.
const getItemLayout = (_: unknown, index: number) => ({
  length: CARD_HEIGHT + GAP,
  offset: (CARD_HEIGHT + GAP) * index,
  index,
});

const keyExtractor = (item: IndexedPokemon) => String(item.id);

// Kept outside the component so the list comes back where it was even if the screen remounts.
const savedList = { query: '', offset: 0, types: [] as string[], generation: null as number | null };

// Two types narrow to dual-type Pokémon; picking a third replaces the oldest pick.
const MAX_TYPES = 2;

export default function PokemonList() {
  const { status, data, error, retry } = usePokedexIndex();
  const [query, setQuery] = useState(savedList.query);
  const [types, setTypes] = useState(savedList.types);
  const [generation, setGeneration] = useState(savedList.generation);
  const { width: windowWidth } = useWindowDimensions();
  const listRef = useRef<FlatList<IndexedPokemon>>(null);

  const onChangeQuery = useCallback((text: string) => {
    setQuery(text);
    savedList.query = text;
  }, []);

  const onToggleType = useCallback((type: string) => {
    setTypes((current) => {
      const next = current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type].slice(-MAX_TYPES);
      savedList.types = next;
      return next;
    });
  }, []);

  const onSelectGeneration = useCallback((n: number | null) => {
    setGeneration(n);
    savedList.generation = n;
  }, []);

  const onClearFilters = useCallback(() => {
    setTypes([]);
    setGeneration(null);
    savedList.types = [];
    savedList.generation = null;
  }, []);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    savedList.offset = e.nativeEvent.contentOffset.y;
  }, []);

  // On web, going back from a detail screen either remounts this screen (browser back / swipe)
  // or un-hides it from `display: none` (header back), and both lose the scroll position.
  // Put it back each time the list regains focus.
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'web' || savedList.offset === 0) return;
      const frame = requestAnimationFrame(() => {
        listRef.current?.scrollToOffset({ offset: savedList.offset, animated: false });
      });
      return () => cancelAnimationFrame(frame);
    }, [])
  );

  // One column on phones, more as the screen widens (tablets, desktop web).
  const contentWidth = Math.min(windowWidth, MAX_CONTENT_WIDTH) - PADDING * 2;
  const numColumns = Math.max(
    1,
    Math.min(MAX_COLUMNS, Math.floor((contentWidth + GAP) / (MIN_CARD_WIDTH + GAP)))
  );
  const cardWidth = Math.floor((contentWidth - GAP * (numColumns - 1)) / numColumns);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^#0*/, '');
    if (!data) return [];
    return data.pokemon.filter(
      (p) =>
        (!q || p.name.includes(q) || String(p.id) === q) &&
        (generation === null || p.generation === generation) &&
        types.every((t) => p.types.includes(t))
    );
  }, [data, query, types, generation]);

  const renderItem = useCallback<ListRenderItem<IndexedPokemon>>(
    ({ item }) => <PokemonCard pokemon={item} types={item.types} width={cardWidth} />,
    [cardWidth]
  );

  if (status === 'loading') return <Loading />;
  if (status === 'error') return <ErrorView message={error.message} onRetry={retry} />;

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          value={query}
          onChangeText={onChangeQuery}
          placeholder="Search by name or number"
          placeholderTextColor="#8e8e93"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          style={[styles.search, { width: contentWidth }]}
        />
        <ListFilters
          width={contentWidth}
          types={types}
          onToggleType={onToggleType}
          generations={data.generations}
          generation={generation}
          onSelectGeneration={onSelectGeneration}
          resultCount={filtered.length}
          onClear={onClearFilters}
        />
      </View>
      <FlatList
        // FlatList can't change numColumns in place; remount when the breakpoint changes.
        key={numColumns}
        ref={listRef}
        onScroll={onScroll}
        scrollEventThrottle={32}
        data={filtered}
        numColumns={numColumns}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        columnWrapperStyle={numColumns > 1 ? styles.columns : undefined}
        contentContainerStyle={[styles.listContent, { width: contentWidth }]}
        style={styles.list}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        initialNumToRender={12}
        maxToRenderPerBatch={16}
        windowSize={11}
        removeClippedSubviews
        ListEmptyComponent={<Text style={styles.empty}>No Pokémon match these filters.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7' },
  searchBar: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
    backgroundColor: '#f2f2f7',
  },
  search: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1c1c1e',
  },
  list: { flex: 1 },
  listContent: {
    alignSelf: 'center',
    paddingTop: 8,
    paddingBottom: 32,
    gap: GAP,
  },
  columns: { gap: GAP },
  empty: { textAlign: 'center', color: '#636366', fontSize: 16, paddingVertical: 32 },
});
