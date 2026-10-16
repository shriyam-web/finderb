import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Clipboard from 'expo-clipboard';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../constants/typography';
import { bizColors, useBizColors } from '../constants/businessColors';
import { createThemedStyles } from '../hooks/useThemedStyles';
import {
  geocodeCityCenter,
  resolveMapsLink,
  searchMapPlaces,
  type MapPin,
  type MapSearchPlace,
} from '../lib/mapPlace';
import { lookupCityCoords } from '../lib/cityCoords';
import { requestLocationPermission } from '../lib/permissionGate';
import { useAppLocation } from '../context/LocationContext';

type Props = {
  city: string;
  state: string;
  pin: MapPin | null;
  note: string;
  noteOk: boolean | null;
  checking: boolean;
  onPin: (pin: MapPin | null) => void;
  fill?: boolean;
};

const MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || '';
const QUICK_PIN_MAX_AGE_MS = 5 * 60 * 1000;

function mapDocument(center: MapPin, apiKey: string, fill: boolean) {
  const key = encodeURIComponent(apiKey);
  const height = fill ? '100%' : '230px';
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  html, body, #map { margin: 0; width: 100%; height: ${height}; background: #e8eef6; }
  .hint {
    position: absolute; left: 12px; right: 12px; bottom: 12px; z-index: 5;
    background: rgba(15, 23, 42, 0.82); color: white; border-radius: 999px;
    text-align: center; font: 500 12px/1 sans-serif; padding: 8px 12px;
    pointer-events: none;
  }
</style>
</head>
<body>
<div id="map"></div>
<div class="hint" id="hint">Tap the map to drop your business pin</div>
<script>
  const start = { lat: ${center.lat}, lng: ${center.lng} };
  let map = null;
  let marker = null;
  let pendingPin = null;
  function send(payload) {
    const raw = JSON.stringify(payload);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(raw);
    else window.parent.postMessage(raw, '*');
  }
  function hideHint() {
    const hint = document.getElementById('hint');
    if (hint) hint.style.display = 'none';
  }
  function showHint(text) {
    const hint = document.getElementById('hint');
    if (!hint) return;
    hint.textContent = text;
    hint.style.display = 'block';
  }
  function place(lat, lng) {
    const position = { lat: lat, lng: lng };
    if (!marker) {
      marker = new google.maps.Marker({ position: position, map: map, draggable: true });
      marker.addListener('dragend', function () {
        const point = marker.getPosition();
        if (!point) return;
        send({ type: 'pin', lat: point.lat(), lng: point.lng() });
      });
    } else {
      marker.setPosition(position);
    }
    map.panTo(position);
    hideHint();
  }
  window.gm_authFailure = function () {
    showHint('Google Maps could not start. Check the map key for this app.');
  };
  window.initShopMap = function () {
    map = new google.maps.Map(document.getElementById('map'), {
      center: start,
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      clickableIcons: false,
    });
    window.gmap = map;
    map.addListener('click', function (event) {
      if (!event.latLng) return;
      place(event.latLng.lat(), event.latLng.lng());
      send({ type: 'pin', lat: event.latLng.lat(), lng: event.latLng.lng() });
    });
    google.maps.event.addListenerOnce(map, 'idle', function () {
      google.maps.event.trigger(map, 'resize');
      map.setCenter(start);
      if (pendingPin) {
        place(pendingPin.lat, pendingPin.lng);
        map.setZoom(pendingPin.zoom || 16);
        pendingPin = null;
      }
    });
  };
  window.onHost = function (raw) {
    const data = JSON.parse(raw);
    if (data.type === 'center') {
      start.lat = data.lat;
      start.lng = data.lng;
      if (map) {
        map.setCenter(start);
        map.setZoom(13);
      }
    }
    if (data.type === 'pin') {
      if (!map) {
        pendingPin = data;
      } else {
        place(data.lat, data.lng);
        if (data.zoom) map.setZoom(data.zoom);
      }
    }
    if (data.type === 'clear' && marker) {
      marker.setMap(null);
      marker = null;
      showHint('Tap the map to drop your business pin');
    }
  };
  window.addEventListener('message', function (event) {
    if (typeof event.data === 'string' && event.data.indexOf('"type"') !== -1) window.onHost(event.data);
  });
</script>
<script async defer src="https://maps.googleapis.com/maps/api/js?key=${key}&callback=initShopMap"></script>
</body>
</html>`;
}

export function ShopMapPicker({ city, state, pin, note, noteOk, checking, onPin, fill = false }: Props) {
  const styles = useStyles();
  const biz = useBizColors();
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const webRef = useRef<WebView>(null);
  const appLocation = useAppLocation();
  const onPinRef = useRef(onPin);
  onPinRef.current = onPin;
  const manualPinAtRef = useRef(0);
  const [center, setCenter] = useState<MapPin | null>(null);
  const [locating, setLocating] = useState(false);
  const [localNote, setLocalNote] = useState('');
  const [docCenter, setDocCenter] = useState<MapPin | null>(null);
  const [findMode, setFindMode] = useState<'search' | 'link'>('search');
  const [findText, setFindText] = useState('');
  const [finding, setFinding] = useState(false);
  const [findError, setFindError] = useState('');
  const [findResults, setFindResults] = useState<MapSearchPlace[]>([]);
  const mapHtml = useMemo(
    () => (docCenter && MAPS_KEY ? mapDocument(docCenter, MAPS_KEY, fill) : ''),
    [docCenter, fill],
  );

  useEffect(() => {
    let cancel = false;
    const known = lookupCityCoords(city);
    if (known) {
      setCenter({ lat: known.lat, lng: known.lng });
      return;
    }
    setCenter(null);
    void geocodeCityCenter(city, state)
      .then((next) => {
        if (!cancel) setCenter(next);
      })
      .catch(() => {
        if (!cancel) setCenter({ lat: 20.5937, lng: 78.9629 });
      });
    return () => {
      cancel = true;
    };
  }, [city, state]);

  useEffect(() => {
    if (!center) return;
    if (docCenter) {
      tellMap({ type: 'center', lat: center.lat, lng: center.lng });
      return;
    }
    // Mount the heavy map a frame later so the city tap paints first.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => setDocCenter(center));
    });
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center]);

  useEffect(() => {
    if (!pin && docCenter) tellMap({ type: 'clear' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onMessage = (event: MessageEvent) => {
      if (frameRef.current && event.source !== frameRef.current.contentWindow) return;
      const next = readPin(event.data);
      if (!next) return;
      manualPinAtRef.current = Date.now();
      onPinRef.current(next);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const tellMap = (payload: object) => {
    const raw = JSON.stringify(payload);
    if (Platform.OS === 'web') {
      frameRef.current?.contentWindow?.postMessage(raw, '*');
      return;
    }
    webRef.current?.injectJavaScript(`window.onHost(${JSON.stringify(raw)}); true;`);
  };

  const pinCurrentLocation = async () => {
    setLocalNote('');
    setLocating(true);
    const requestedAt = Date.now();
    let placed = false;
    const drop = (lat: number, lng: number) => {
      // A pin the user dropped by hand after this tap wins over a late GPS fix.
      if (manualPinAtRef.current > requestedAt) return;
      placed = true;
      tellMap({ type: 'pin', lat, lng });
      onPin({ lat, lng });
      setLocating(false);
    };
    try {
      const current = await Location.getForegroundPermissionsAsync();
      const granted = current.granted || (await requestLocationPermission());
      if (!granted) {
        setLocalNote('Allow location access, or tap the map to drop a pin.');
        return;
      }

      if (appLocation.source === 'gps' && appLocation.coords) {
        drop(appLocation.coords.lat, appLocation.coords.lng);
      } else {
        const lastKnown = await Location.getLastKnownPositionAsync({
          maxAge: QUICK_PIN_MAX_AGE_MS,
        }).catch(() => null);
        if (lastKnown) drop(lastKnown.coords.latitude, lastKnown.coords.longitude);
      }

      const precise = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      drop(precise.coords.latitude, precise.coords.longitude);
    } catch {
      if (!placed) setLocalNote('Could not read your current location. Tap the map instead.');
    } finally {
      setLocating(false);
    }
  };

  const clearPin = () => {
    tellMap({ type: 'clear' });
    setLocalNote('');
    onPin(null);
  };

  const pinFromLookup = (next: MapPin) => {
    manualPinAtRef.current = Date.now();
    tellMap({ type: 'pin', lat: next.lat, lng: next.lng, zoom: 17 });
    onPin(next);
  };

  const switchFindMode = (mode: 'search' | 'link') => {
    setFindMode(mode);
    setFindText('');
    setFindError('');
    setFindResults([]);
  };

  const runFind = async () => {
    const text = findText.trim();
    if (finding || text.length < 2) return;
    Keyboard.dismiss();
    setFindError('');
    setLocalNote('');
    setFindResults([]);
    setFinding(true);
    try {
      if (findMode === 'link') {
        pinFromLookup(await resolveMapsLink(text));
        setFindText('');
      } else {
        const places = await searchMapPlaces(text, city, state);
        if (!places.length) setFindError('No match on Google Maps. Try the name with your area.');
        setFindResults(places);
      }
    } catch (error) {
      setFindError(error instanceof Error ? error.message : 'Google Maps lookup failed. Try again.');
    } finally {
      setFinding(false);
    }
  };

  const pasteLink = async () => {
    const text = (await Clipboard.getStringAsync().catch(() => '')).trim();
    if (!text) {
      setFindError('Copy your business link from Google Maps (Share > Copy link) first.');
      return;
    }
    setFindError('');
    setFindText(text);
  };

  const choosePlace = (place: MapSearchPlace) => {
    setFindResults([]);
    setFindText(place.name);
    pinFromLookup({ lat: place.lat, lng: place.lng });
  };

  const status = localNote || note;
  const statusOk = !localNote && noteOk === true;

  return (
    <View style={fill ? styles.cardFill : styles.card}>
      {fill ? null : (
        <View style={styles.head}>
          <Text style={styles.title}>Business on the map</Text>
          <Text style={styles.optional}>Optional</Text>
        </View>
      )}
      <View style={styles.find}>
        <View style={styles.findTabs}>
          {(
            [
              { mode: 'search', icon: 'search', label: 'Search Google Maps' },
              { mode: 'link', icon: 'link', label: 'Paste Maps link' },
            ] as const
          ).map((tab) => {
            const active = findMode === tab.mode;
            return (
              <Pressable
                key={tab.mode}
                style={[styles.findTab, active && styles.findTabOn]}
                onPress={() => switchFindMode(tab.mode)}
              >
                <Ionicons name={tab.icon} size={14} color={active ? biz.blueDeep : biz.slate} />
                <Text style={[styles.findTabText, active && styles.findTabTextOn]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.findRow}>
          <TextInput
            value={findText}
            onChangeText={(text) => {
              setFindText(text);
              setFindError('');
            }}
            onSubmitEditing={() => void runFind()}
            placeholder={
              findMode === 'search' ? `Your business name in ${city}` : 'https://maps.app.goo.gl/...'
            }
            placeholderTextColor={biz.slateSoft}
            autoCapitalize={findMode === 'link' ? 'none' : 'words'}
            autoCorrect={false}
            keyboardType={findMode === 'link' ? 'url' : 'default'}
            returnKeyType={findMode === 'search' ? 'search' : 'go'}
            style={styles.findInput}
          />
          {findMode === 'link' && !findText ? (
            <Pressable style={styles.findGhost} onPress={() => void pasteLink()}>
              <Ionicons name="clipboard-outline" size={16} color={biz.blueDeep} />
              <Text style={styles.findGhostText}>Paste</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.findGo, (finding || findText.trim().length < 2) && styles.findGoOff]}
              onPress={() => void runFind()}
              disabled={finding || findText.trim().length < 2}
            >
              {finding ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.findGoText}>{findMode === 'search' ? 'Search' : 'Use link'}</Text>
              )}
            </Pressable>
          )}
        </View>
        {findError ? <Text style={styles.findError}>{findError}</Text> : null}
        {findResults.length ? (
          <ScrollView style={styles.findList} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {findResults.map((place) => (
              <Pressable
                key={`${place.lat},${place.lng},${place.name}`}
                style={styles.findItem}
                onPress={() => choosePlace(place)}
              >
                <Ionicons name="location" size={16} color={biz.blue} />
                <View style={styles.findItemCopy}>
                  <Text style={styles.findItemName} numberOfLines={1}>
                    {place.name}
                  </Text>
                  {place.address ? (
                    <Text style={styles.findItemAddress} numberOfLines={1}>
                      {place.address}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
      </View>
      <View style={fill ? styles.mapWrapFill : styles.mapWrap}>
        {mapHtml ? (
          Platform.OS === 'web' ? (
            createElement('iframe', {
              ref: frameRef,
              title: 'Business map',
              srcDoc: mapHtml,
              style: { width: '100%', height: '100%', border: 'none' },
            })
          ) : (
            <WebView
              ref={webRef}
              originWhitelist={['*']}
              source={{ html: mapHtml, baseUrl: 'https://finderb.com' }}
              onMessage={(event) => {
                const next = readPin(event.nativeEvent.data);
                if (!next) return;
                manualPinAtRef.current = Date.now();
                onPin(next);
              }}
              style={[styles.map, Platform.OS === 'android' && styles.mapAndroid]}
            />
          )
        ) : center && !MAPS_KEY ? (
          <View style={styles.loading}>
            <Text style={styles.hint}>Add the Google Maps key to the app to show this map.</Text>
          </View>
        ) : (
          <View style={styles.loading}>
            <ActivityIndicator color={biz.blue} />
          </View>
        )}
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.pill} onPress={() => void pinCurrentLocation()} disabled={locating}>
          {locating ? (
            <ActivityIndicator color={biz.blue} />
          ) : (
            <>
              <Ionicons name="navigate" size={16} color={biz.blue} />
              <Text style={styles.pillText}>Current location</Text>
            </>
          )}
        </Pressable>
        <Pressable style={[styles.pill, !pin && styles.pillOff]} onPress={clearPin} disabled={!pin}>
          <Ionicons name="close" size={16} color={pin ? biz.slateInk : biz.slateSoft} />
          <Text style={[styles.pillQuiet, !pin && styles.pillQuietOff]}>Clear pin</Text>
        </Pressable>
      </View>
      {checking ? <Text style={styles.checking}>Checking this pin is inside {city}…</Text> : null}
      {status ? (
        <Text style={[styles.status, statusOk ? styles.statusOk : styles.statusBad]}>{status}</Text>
      ) : (
        <Text style={styles.hint}>
          Search your business, paste its Google Maps link, use your current spot, or tap and drag a pin. It
          has to sit inside {city}.
        </Text>
      )}
    </View>
  );
}

function readPin(data: unknown): MapPin | null {
  if (typeof data !== 'string') return null;
  try {
    const parsed = JSON.parse(data) as { type?: string; lat?: number; lng?: number };
    if (parsed.type !== 'pin') return null;
    if (!Number.isFinite(parsed.lat) || !Number.isFinite(parsed.lng)) return null;
    if (parsed.lat! < -90 || parsed.lat! > 90 || parsed.lng! < -180 || parsed.lng! > 180) return null;
    return { lat: parsed.lat!, lng: parsed.lng! };
  } catch {
    return null;
  }
}

const useStyles = createThemedStyles((colors) => {
  const b = bizColors(colors);
  return {
  card: {
    marginTop: 4,
    marginBottom: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: b.line,
    backgroundColor: b.card,
    overflow: 'hidden',
  },
  cardFill: {
    flex: 1,
    backgroundColor: b.card,
    overflow: 'hidden',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
  },
  title: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.heading,
  },
  optional: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: b.slate,
    backgroundColor: b.cardMuted,
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  find: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: b.line,
  },
  findTabs: {
    flexDirection: 'row',
    gap: 6,
    padding: 3,
    borderRadius: 12,
    backgroundColor: b.cardMuted,
  },
  findTab: {
    flex: 1,
    minHeight: 34,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  findTabOn: { backgroundColor: b.card },
  findTabText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: b.slate,
  },
  findTabTextOn: { color: b.blueDeep },
  findRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  findInput: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: b.line,
    backgroundColor: b.cardSoft,
    paddingHorizontal: 12,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.heading,
  },
  findGo: {
    minHeight: 44,
    minWidth: 84,
    borderRadius: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: b.blueFill,
  },
  findGoOff: { opacity: 0.5 },
  findGoText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#fff',
  },
  findGhost: {
    minHeight: 44,
    minWidth: 84,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: b.blueLine,
    backgroundColor: b.blueSoft,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  findGhostText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: b.blueDeep,
  },
  findError: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    color: b.danger,
  },
  findList: {
    maxHeight: 220,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: b.line,
    backgroundColor: b.card,
  },
  findItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: b.line,
  },
  findItemCopy: { flex: 1, minWidth: 0 },
  findItemName: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.heading,
  },
  findItemAddress: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: b.slate,
    marginTop: 2,
  },
  mapWrap: {
    height: 230,
    backgroundColor: b.cardMuted,
  },
  mapWrapFill: {
    flex: 1,
    backgroundColor: b.cardMuted,
  },
  map: { flex: 1, backgroundColor: b.cardMuted },
  // Android WebView inside animated containers can crash the renderer at full opacity.
  mapAndroid: { opacity: 0.99 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  pill: {
    flex: 1,
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: b.blueLine,
    backgroundColor: b.blueSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pillOff: {
    borderColor: b.line,
    backgroundColor: b.cardSoft,
  },
  pillText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: b.blueDeep,
  },
  pillQuiet: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: b.slateInk,
  },
  pillQuietOff: { color: b.slateSoft },
  checking: {
    paddingHorizontal: 14,
    paddingTop: 10,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: b.blueDeep,
  },
  status: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 12,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  statusOk: { color: b.success },
  statusBad: { color: b.danger },
  hint: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 12,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    color: b.slate,
  },
};
});
