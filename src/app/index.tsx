import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
  type ListRenderItem,
} from 'react-native';

import PokemonCard, { CARD_HEIGHT } from '@/components/PokemonCard';
import { ErrorView, Loading } from '@/components/Status';
import { fetchAllPokemon, type PokemonSummary } from '@/lib/pokeapi';
import { useAsync } from '@/lib/useAsync';

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

const keyExtractor = (item: PokemonSummary) => String(item.id);

export default function PokemonList() {
  const { status, data, error, retry } = useAsync('all-pokemon', fetchAllPokemon);
  const [query, setQuery] = useState('');
  const { width: windowWidth } = useWindowDimensions();

  // One column on phones, more as the screen widens (tablets, desktop web).
  const contentWidth = Math.min(windowWidth, MAX_CONTENT_WIDTH) - PADDING * 2;
  const numColumns = Math.max(
    1,
    Math.min(MAX_COLUMNS, Math.floor((contentWidth + GAP) / (MIN_CARD_WIDTH + GAP)))
  );
  const cardWidth = Math.floor((contentWidth - GAP * (numColumns - 1)) / numColumns);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^#0*/, '');
    if (!data || !q) return data ?? [];
    return data.filter((p) => p.name.includes(q) || String(p.id) === q);
  }, [data, query]);

  const renderItem = useCallback<ListRenderItem<PokemonSummary>>(
    ({ item }) => <PokemonCard pokemon={item} width={cardWidth} />,
    [cardWidth]
  );

  if (status === 'loading') return <Loading />;
  if (status === 'error') return <ErrorView message={error.message} onRetry={retry} />;

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name or number"
          placeholderTextColor="#8e8e93"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          style={[styles.search, { width: contentWidth }]}
        />
      </View>
      <FlatList
        // FlatList can't change numColumns in place; remount when the breakpoint changes.
        key={numColumns}
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7' },
  searchBar: {
    alignItems: 'center',
    paddingVertical: 8,
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
});
