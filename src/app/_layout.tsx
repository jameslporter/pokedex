import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import FavoritesHeaderLink from '@/components/FavoritesHeaderLink';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTintColor: '#e3350d',
          headerTitleStyle: { color: '#1c1c1e' },
          contentStyle: { backgroundColor: '#fff' },
        }}
      >
        <Stack.Screen
          name="index"
          options={{ title: 'Pokédex', headerRight: () => <FavoritesHeaderLink /> }}
        />
        <Stack.Screen name="favorites" options={{ title: 'Favorites' }} />
        <Stack.Screen name="pokemon/[id]" options={{ title: '' }} />
        <Stack.Screen name="move/[name]" options={{ title: '' }} />
      </Stack>
    </>
  );
}
