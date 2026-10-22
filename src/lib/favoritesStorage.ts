import AsyncStorage from '@react-native-async-storage/async-storage';

import { parseFavorites, serializeFavorites, type Favorite } from './favoritesFormat';

// AsyncStorage data is included in device backups: Android Auto Backup
// (as long as `android.allowBackup` stays true) and iCloud Backup on iOS.
// iOS needs `RCTAsyncStorageExcludeFromBackup: false` in app.json, because
// AsyncStorage opts out of iCloud backup by default. On web it uses localStorage.
const KEY = 'pokedex.favorites';

export async function loadFavorites(): Promise<Favorite[]> {
  try {
    return parseFavorites(await AsyncStorage.getItem(KEY));
  } catch (e) {
    console.warn('Could not read favorites', e);
    return [];
  }
}

export async function saveFavorites(favorites: Favorite[]) {
  try {
    await AsyncStorage.setItem(KEY, serializeFavorites(favorites));
  } catch (e) {
    console.warn('Could not save favorites', e);
  }
}
