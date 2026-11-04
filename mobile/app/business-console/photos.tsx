import { useState } from 'react';
import { Alert, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { fonts } from '../../constants/typography';
import { useConsoleColors } from '../../constants/consoleColors';
import { useMerchantConsole } from '../../context/MerchantConsoleContext';
import { isFailure, type ConsoleOverview } from '../../lib/merchantConsoleApi';
import { ConsoleGate } from '../../components/console/ConsoleGate';
import { Btn, ConsolePage, Empty, Sheet, createConsoleStyles } from '../../components/console/kit';
import { ProfileCropModal } from '../../components/console/ProfileCropModal';

const BATCH_LIMIT = 6;
const GAP = 8;

async function toDataUri(uri: string): Promise<string> {
  const rendered = await ImageManipulator.manipulate(uri).resize({ width: 1600 }).renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.8, base64: true });
  if (!saved.base64) throw new Error('empty image');
  return `data:image/jpeg;base64,${saved.base64}`;
}

function PhotosBody({ o }: { o: ConsoleOverview }) {
  const styles = useStyles();
  const c = useConsoleColors();
  const { width } = useWindowDimensions();
  const { run, notify } = useMerchantConsole();
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [cropUri, setCropUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const images = o.photos.images;
  const cover = o.photos.cover || images[0] || null;
  const tile = Math.floor((width - 32 - GAP * 2) / 3);

  const pick = async (crop = false) => {
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: !crop,
      allowsEditing: crop,
      aspect: crop ? [1, 1] : undefined,
      selectionLimit: crop ? 1 : BATCH_LIMIT,
      quality: 1,
    });
    if (picked.canceled || !picked.assets?.length) return;
    const assets = picked.assets.slice(0, BATCH_LIMIT);
    let added = 0;
    let lastError = '';
    setUploading({ done: 0, total: assets.length });
    for (const [index, asset] of assets.entries()) {
      try {
        const result = await run('uploadPhoto', { image: await toDataUri(asset.uri) });
        if (isFailure(result)) lastError = result.error;
        else added += 1;
      } catch {
        lastError = 'One photo could not be read. Try another.';
      }
      setUploading({ done: index + 1, total: assets.length });
    }
    setUploading(null);
    if (added) notify(`${added} photo${added === 1 ? '' : 's'} added`);
    if (lastError) notify(lastError, 'bad');
  };

  const apply = async (next: string[], nextCover: string | null, message: string) => {
    setBusy(true);
    const result = await run('setPhotos', { images: next, cover: nextCover });
    setBusy(false);
    if (isFailure(result)) {
      notify(result.error, 'bad');
      return false;
    }
    notify(message);
    return true;
  };

  const useProfilePicture = async (dataUri: string) => {
    setBusy(true);
    const uploaded = await run<ConsoleOverview>('uploadPhoto', { image: dataUri });
    if (isFailure(uploaded)) {
      setBusy(false);
      notify(uploaded.error, 'bad');
      return;
    }
    const nextImages = uploaded.photos?.images || [];
    const next = nextImages[nextImages.length - 1];
    if (!next) {
      setBusy(false);
      notify('Could not save the profile picture.', 'bad');
      return;
    }
    const result = await run('setPhotos', { images: nextImages, cover: next });
    setBusy(false);
    if (isFailure(result)) {
      notify(result.error, 'bad');
      return;
    }
    notify('Profile picture updated');
    setCropUri(null);
    setSelected(null);
  };

  const move = async (uri: string, step: -1 | 1) => {
    const from = images.indexOf(uri);
    const to = from + step;
    if (from < 0 || to < 0 || to >= images.length) return;
    const next = [...images];
    [next[from], next[to]] = [next[to], next[from]];
    await apply(next, cover, 'Order updated');
  };

  const remove = (uri: string) => {
    const last = images.length === 1;
    Alert.alert(
      'Delete this photo?',
      last ? 'This is your only photo. Without one, your listing can’t be shown to customers.' : 'It will be removed from your storefront.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const next = images.filter((item) => item !== uri);
            const nextCover = cover === uri ? next[0] || null : cover;
            if (await apply(next, nextCover, 'Photo deleted')) setSelected(null);
          },
        },
      ],
    );
  };

  const index = selected ? images.indexOf(selected) : -1;

  return (
    <ConsolePage
      title="Photos"
      docked
      subtitle={`${images.length} uploaded`}
      footer={
        <Btn
          icon="add"
          label={uploading ? `Uploading ${Math.min(uploading.done + 1, uploading.total)} of ${uploading.total}…` : 'Add photos'}
          busy={Boolean(uploading)}
          onPress={() => void pick(false)}
        />
      }
    >
      <View style={styles.note}>
        <Ionicons name="information-circle-outline" size={18} color={c.accent} />
        <Text style={styles.noteText}>
          Your profile picture is the cover customers see first. Tap a photo to crop a square, reorder or delete it.
        </Text>
      </View>
      {images.length ? (
        <View style={styles.grid}>
          {images.map((uri, position) => {
            const isCover = uri === cover;
            return (
              <Pressable
                key={uri}
                onPress={() => setSelected(uri)}
                style={({ pressed }) => [styles.tile, { width: tile, height: tile }, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`Photo ${position + 1}${isCover ? ', profile picture' : ''}`}
              >
                <Image source={{ uri }} style={styles.image} contentFit="cover" transition={150} alt={`Photo ${position + 1}`} />
                {isCover ? (
                  <View style={styles.coverTag}>
                    <Text style={styles.coverText}>Profile</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : (
        <Empty
          icon="camera-outline"
          title="No photos yet"
          body="Add at least one photo of your shop front, counter or best work. Listings without a photo stay hidden."
        />
      )}

      <Sheet visible={Boolean(selected)} title={`Photo ${index + 1} of ${images.length}`} onClose={() => setSelected(null)}>
        {selected ? (
          <>
            <Image source={{ uri: selected }} style={styles.preview} contentFit="cover" alt="Selected photo" />
            <View style={styles.sheetRow}>
              <Btn
                small
                tone="outline"
                icon="arrow-back"
                label="Move earlier"
                disabled={busy || index <= 0}
                onPress={() => void move(selected, -1)}
                style={styles.flex}
              />
              <Btn
                small
                tone="outline"
                icon="arrow-forward"
                label="Move later"
                disabled={busy || index >= images.length - 1}
                onPress={() => void move(selected, 1)}
                style={styles.flex}
              />
            </View>
            <Btn
              icon="crop-outline"
              label={selected === cover ? 'Crop profile picture' : 'Set as profile picture'}
              disabled={busy}
              busy={busy}
              onPress={() => {
                setCropUri(selected);
                setSelected(null);
              }}
            />
            <Btn tone="danger" icon="trash-outline" label="Delete photo" disabled={busy} onPress={() => remove(selected)} />
          </>
        ) : null}
      </Sheet>
      <ProfileCropModal uri={cropUri} busy={busy} onClose={() => setCropUri(null)} onConfirm={(dataUri) => void useProfilePicture(dataUri)} />
    </ConsolePage>
  );
}

export default function PhotosScreen() {
  return <ConsoleGate>{(overview) => <PhotosBody o={overview} />}</ConsoleGate>;
}

const useStyles = createConsoleStyles((c) => ({
  flex: { flex: 1 },
  note: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: c.primarySoft,
  },
  noteText: { flex: 1, fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: c.body },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  tile: { borderRadius: 10, overflow: 'hidden', backgroundColor: c.sunken },
  pressed: { opacity: 0.85 },
  image: { width: '100%', height: '100%' },
  coverTag: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: c.primary,
  },
  coverText: { fontFamily: fonts.semiBold, fontSize: 11, color: c.primaryInk },
  preview: { width: '100%', aspectRatio: 4 / 3, borderRadius: 12, backgroundColor: c.sunken },
  sheetRow: { flexDirection: 'row', gap: 10 },
}));
