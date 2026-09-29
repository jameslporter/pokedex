import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View, type ListRenderItem } from 'react-native';

import PokemonRow, { ROW_HEIGHT } from '@/components/PokemonRow';
import { ErrorView, Loading } from '@/components/Status';
import { fetchAllPokemon, type PokemonSummary } from '@/lib/pokeapi';
import { useAsync } from '@/lib/useAsync';

const SEPARATOR = StyleSheet.hairlineWidth;

export default function PokemonList() {
  const { status, data, error, retry } = useAsync('all-pokemon', fetchAllPokemon);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^#0*/, '');
    if (!data || !q) return data ?? [];
    return data.filter((p) => p.name.includes(q) || String(p.id) === q);
  }, [data, query]);

  const renderItem = useCallback<ListRenderItem<PokemonSummary>>(
    ({ item }) => <PokemonRow pokemon={item} />,
    []
  );

  if (status === 'loading') return <Loading />;
  if (status === 'error') return <ErrorView message={error.message} onRetry={retry} />;

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name or number"
          placeholderTextColor="#8e8e93"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          style={styles.search}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        ItemSeparatorComponent={Separator}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        initialNumToRender={15}
        maxToRenderPerBatch={20}
        windowSize={11}
        removeClippedSubviews
      />
    </View>
  );
}

const keyExtractor = (item: PokemonSummary) => String(item.id);

// Fixed row heights let the list skip measuring each row, which keeps fast scrolling smooth.
const getItemLayout = (_: unknown, index: number) => ({
  length: ROW_HEIGHT,
  offset: (ROW_HEIGHT + SEPARATOR) * index,
  index,
});

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchWrap: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#d1d1d6',
  },
  search: {
    backgroundColor: '#f2f2f7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1c1c1e',
  },
  separator: { height: SEPARATOR, marginLeft: 84, backgroundColor: '#d1d1d6' },
});
