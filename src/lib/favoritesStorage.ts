import { File, Paths } from 'expo-file-system';

import { parseFavorites, serializeFavorites, type Favorite } from './favoritesFormat';

// The documents directory is included in device backups by default:
// iCloud Backup on iOS, and Android Auto Backup (Google Drive) as long as
// `android.allowBackup` stays true in app.json. Favorites restore with the app.
const file = new File(Paths.document, 'favorites.json');

export function loadFavorites(): Favorite[] {
  try {
    return file.exists ? parseFavorites(file.textSync()) : [];
  } catch (e) {
    console.warn('Could not read favorites', e);
    return [];
  }
}

export function saveFavorites(favorites: Favorite[]) {
  try {
    file.write(serializeFavorites(favorites));
  } catch (e) {
    console.warn('Could not save favorites', e);
  }
}
