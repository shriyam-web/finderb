import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, Text, useWindowDimensions, View, Image as RNImage } from 'react-native';
import { Image } from 'expo-image';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '../../constants/typography';
import { useConsoleColors } from '../../constants/consoleColors';
import { createConsoleStyles } from './kit';

const OUTPUT = 720;

type Mode = 'crop' | 'fit';
type Size = { width: number; height: number };
type Offset = { x: number; y: number };

function turnedSize(size: Size, rotation: number): Size {
  return rotation % 180 === 0 ? size : { width: size.height, height: size.width };
}

function baseScale(mode: Mode, view: number, size: Size) {
  const cover = Math.max(view / size.width, view / size.height);
  const contain = Math.min(view / size.width, view / size.height);
  return mode === 'crop' ? cover : contain;
}

function clampOffset(offset: Offset, view: number, visual: Size, scale: number): Offset {
  const maxX = Math.max(0, (visual.width * scale - view) / 2);
  const maxY = Math.max(0, (visual.height * scale - view) / 2);
  return {
    x: Math.min(maxX, Math.max(-maxX, offset.x)),
    y: Math.min(maxY, Math.max(-maxY, offset.y)),
  };
}

export async function exportProfileSquare({
  uri,
  size,
  rotation,
  zoom,
  mode,
  offset,
  view,
}: {
  uri: string;
  size: Size;
  rotation: number;
  zoom: number;
  mode: Mode;
  offset: Offset;
  view: number;
}) {
  const turns = ((rotation % 360) + 360) % 360;
  const visual = turnedSize(size, turns);
  const scale = baseScale(mode, view, visual) * zoom;
  const left = view / 2 + offset.x - (visual.width * scale) / 2;
  const top = view / 2 + offset.y - (visual.height * scale) / 2;
  const originX = -left / scale;
  const originY = -top / scale;
  const side = view / scale;
  const inside =
    originX >= -1 && originY >= -1 && originX + side <= visual.width + 1 && originY + side <= visual.height + 1;

  const ctx = ImageManipulator.manipulate(uri);
  if (turns) ctx.rotate(turns);
  if (inside || Platform.OS !== 'web') {
    const x = Math.max(0, Math.min(visual.width - 1, Math.round(originX)));
    const y = Math.max(0, Math.min(visual.height - 1, Math.round(originY)));
    const cropSide = Math.max(1, Math.min(Math.round(side), visual.width - x, visual.height - y));
    ctx.crop({ originX: x, originY: y, width: cropSide, height: cropSide });
  } else {
    ctx.extent({
      originX: Math.round(originX),
      originY: Math.round(originY),
      width: Math.max(1, Math.round(side)),
      height: Math.max(1, Math.round(side)),
      backgroundColor: '#F4F4F5',
    });
  }
  ctx.resize({ width: OUTPUT, height: OUTPUT });
  const rendered = await ctx.renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.85, base64: true });
  if (!saved.base64) throw new Error('empty image');
  return `data:image/jpeg;base64,${saved.base64}`;
}

export function ProfileCropModal({
  uri,
  busy,
  onClose,
  onConfirm,
}: {
  uri: string | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: (dataUri: string) => void;
}) {
  const styles = useStyles();
  const c = useConsoleColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const view = Math.min(320, Math.max(220, width - 48));
  const [size, setSize] = useState<Size | null>(null);
  const [failed, setFailed] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [mode, setMode] = useState<Mode>('crop');
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const drag = useRef<{ x: number; y: number; from: Offset } | null>(null);

  useEffect(() => {
    setSize(null);
    setFailed(false);
    setRotation(0);
    setZoom(1);
    setMode('crop');
    setOffset({ x: 0, y: 0 });
    if (!uri) return;
    let alive = true;
    RNImage.getSize(
      uri,
      (width, height) => {
        if (alive) setSize({ width, height });
      },
      () => {
        if (alive) setFailed(true);
      },
    );
    return () => {
      alive = false;
    };
  }, [uri]);

  const visual = size ? turnedSize(size, rotation) : null;
  const scale = visual ? baseScale(mode, view, visual) * zoom : 1;

  const setZoomClamped = (next: number) => {
    const value = Math.min(3, Math.max(1, next));
    setZoom(value);
    if (visual) setOffset((current) => clampOffset(current, view, visual, baseScale(mode, view, visual) * value));
  };

  const boxW = (size?.width ?? view) * scale;
  const boxH = (size?.height ?? view) * scale;

  const usePhoto = async () => {
    if (!uri || !size || saving || busy) return;
    setSaving(true);
    setFailed(false);
    try {
      const dataUri = await exportProfileSquare({ uri, size, rotation, zoom, mode, offset, view });
      onConfirm(dataUri);
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={Boolean(uri)} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={8} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Close">
            <Ionicons name="close" size={22} color={c.ink} />
          </Pressable>
          <Text style={styles.title}>Crop profile picture</Text>
          <Pressable
            onPress={() => void usePhoto()}
            disabled={!size || saving || busy}
            style={[styles.useBtn, (!size || saving || busy) && styles.disabled]}
            accessibilityRole="button"
            accessibilityLabel="Use this photo"
          >
            {saving || busy ? <ActivityIndicator size="small" color={c.primaryInk} /> : <Text style={styles.useText}>Use</Text>}
          </Pressable>
        </View>

        <Text style={styles.hint}>Drag the photo. Crop fills the square. Fit keeps the whole photo inside it.</Text>

        <View
          style={[styles.frame, { width: view, height: view }]}
          onStartShouldSetResponder={() => !saving && !busy}
          onMoveShouldSetResponder={() => !saving && !busy}
          onResponderGrant={(event) => {
            drag.current = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY, from: offset };
          }}
          onResponderMove={(event) => {
            const state = drag.current;
            if (!state || !visual) return;
            setOffset(
              clampOffset(
                {
                  x: state.from.x + event.nativeEvent.pageX - state.x,
                  y: state.from.y + event.nativeEvent.pageY - state.y,
                },
                view,
                visual,
                scale,
              ),
            );
          }}
          onResponderRelease={() => {
            drag.current = null;
          }}
        >
          {uri && size ? (
            <Image
              pointerEvents="none"
              source={{ uri }}
              style={{
                position: 'absolute',
                width: boxW,
                height: boxH,
                left: view / 2 + offset.x - boxW / 2,
                top: view / 2 + offset.y - boxH / 2,
                transform: [{ rotate: `${rotation}deg` }],
              }}
              contentFit="fill"
              alt="Photo to crop"
            />
          ) : (
            <ActivityIndicator color={c.primary} />
          )}
          <View pointerEvents="none" style={styles.grid}>
            <View style={[styles.gridV, { left: '33.33%' }]} />
            <View style={[styles.gridV, { left: '66.66%' }]} />
            <View style={[styles.gridH, { top: '33.33%' }]} />
            <View style={[styles.gridH, { top: '66.66%' }]} />
          </View>
        </View>

        <View style={styles.tools}>
          <Pressable
            onPress={() => {
              setRotation((current) => (current + 90) % 360);
              setOffset({ x: 0, y: 0 });
            }}
            style={styles.tool}
            accessibilityRole="button"
            accessibilityLabel="Rotate"
          >
            <Ionicons name="refresh" size={16} color={c.ink} />
            <Text style={styles.toolText}>Rotate</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setMode('crop');
              setZoom(1);
              setOffset({ x: 0, y: 0 });
            }}
            style={[styles.tool, mode === 'crop' && styles.toolOn]}
            accessibilityRole="button"
            accessibilityLabel="Crop"
          >
            <Ionicons name="crop" size={16} color={mode === 'crop' ? c.primary : c.ink} />
            <Text style={[styles.toolText, mode === 'crop' && styles.toolTextOn]}>Crop</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setMode('fit');
              setZoom(1);
              setOffset({ x: 0, y: 0 });
            }}
            style={[styles.tool, mode === 'fit' && styles.toolOn]}
            accessibilityRole="button"
            accessibilityLabel="Fit"
          >
            <Ionicons name="scan-outline" size={16} color={mode === 'fit' ? c.primary : c.ink} />
            <Text style={[styles.toolText, mode === 'fit' && styles.toolTextOn]}>Fit</Text>
          </Pressable>
        </View>

        <View style={styles.zoom}>
          <Pressable onPress={() => setZoomClamped(zoom - 0.2)} style={styles.zoomBtn} accessibilityRole="button" accessibilityLabel="Zoom out">
            <Ionicons name="remove" size={18} color={c.ink} />
          </Pressable>
          <Text style={styles.zoomLabel}>{Math.round(zoom * 100)}%</Text>
          <Pressable onPress={() => setZoomClamped(zoom + 0.2)} style={styles.zoomBtn} accessibilityRole="button" accessibilityLabel="Zoom in">
            <Ionicons name="add" size={18} color={c.ink} />
          </Pressable>
        </View>

        {failed ? <Text style={styles.error}>This photo could not be cropped. Try another one.</Text> : null}
      </View>
    </Modal>
  );
}

const useStyles = createConsoleStyles((c) => ({
  screen: { flex: 1, backgroundColor: c.page, alignItems: 'center', paddingHorizontal: 20 },
  header: { alignSelf: 'stretch', height: 52, flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontFamily: fonts.semiBold, fontSize: 16, color: c.ink },
  useBtn: {
    minWidth: 64,
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primary,
  },
  useText: { fontFamily: fonts.semiBold, fontSize: 14, color: c.primaryInk },
  disabled: { opacity: 0.45 },
  hint: { alignSelf: 'stretch', marginBottom: 14, fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: c.muted },
  frame: {
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: c.line,
  },
  grid: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  gridV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.55)' },
  gridH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.55)' },
  tools: { flexDirection: 'row', gap: 8, marginTop: 16 },
  tool: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.card,
  },
  toolOn: { backgroundColor: c.primarySoft, borderColor: c.primary },
  toolText: { fontFamily: fonts.semiBold, fontSize: 13, color: c.ink },
  toolTextOn: { color: c.primary },
  zoom: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  zoomBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.card,
  },
  zoomLabel: { minWidth: 48, textAlign: 'center', fontFamily: fonts.semiBold, fontSize: 13, color: c.ink },
  error: { marginTop: 12, fontFamily: fonts.regular, fontSize: 13, color: c.danger, textAlign: 'center' },
}));
