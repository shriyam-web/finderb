import { Platform, Share } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { reviewCardFileName } from './reviewQrCardHtml';

export async function saveReviewQrPng(base64: string, businessName: string) {
  const fileName = reviewCardFileName(businessName);
  if (Platform.OS === 'android') {
    const permission = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permission.granted) {
      return { ok: false as const, cancelled: true as const };
    }
    const uri = await FileSystem.StorageAccessFramework.createFileAsync(
      permission.directoryUri,
      fileName.replace(/\.png$/i, ''),
      'image/png',
    );
    await FileSystem.writeAsStringAsync(uri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return { ok: true as const, method: 'saved' as const };
  }

  const path = `${FileSystem.cacheDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(path, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  await Share.share({
    url: path,
    title: `${businessName} on FinderB`,
  });
  return { ok: true as const, method: 'shared' as const };
}

export async function downloadQrSourceBase64(qrUrl: string) {
  const dest = `${FileSystem.cacheDirectory}finderb-qr-source.png`;
  const result = await FileSystem.downloadAsync(qrUrl, dest);
  if (result.status !== 200) {
    throw new Error('Could not download the QR code.');
  }
  return FileSystem.readAsStringAsync(dest, { encoding: FileSystem.EncodingType.Base64 });
}
