import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV({ id: 'bukupay-storage' });

export const storageKeys = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  ACTIVE_STORE: 'activeStoreId',
};
