import { AppState, Platform } from 'react-native';
import * as Location from 'expo-location';

/**
 * Android shows one permission dialog at a time. A request made while another dialog is
 * open can be dropped by the system, and its promise then never settles. Every dialog in
 * the app goes through this queue so requests never overlap.
 */
let queue: Promise<unknown> = Promise.resolve();

export function queuePermissionRequest<T>(request: () => Promise<T>): Promise<T> {
  const run = queue.then(request, request);
  queue = run.catch(() => undefined);
  return run;
}

let markSettled: () => void = () => undefined;
const locationSettled = new Promise<void>((resolve) => {
  markSettled = resolve;
});

/** Called once the first location permission answer is known (or none was needed). */
export function markLocationPermissionSettled() {
  markSettled();
}

/** Location is asked first on a fresh install; other dialogs wait for it, up to `maxWaitMs`. */
export function afterLocationPermission(maxWaitMs = 25000): Promise<void> {
  return Promise.race([
    locationSettled,
    new Promise<void>((resolve) => setTimeout(resolve, maxWaitMs)),
  ]);
}

const POLL_MS = 1000;
const AFTER_RETURN_MS = 700;

async function readGranted(): Promise<boolean | null> {
  try {
    return (await Location.getForegroundPermissionsAsync()).granted;
  } catch {
    return null;
  }
}

/**
 * Asks for foreground location and always settles. Besides the request's own result, it
 * watches the real permission state (polling, and once the app is back from the dialog),
 * so a dropped request still resolves as soon as the user has answered.
 */
export function requestLocationPermission(): Promise<boolean> {
  return queuePermissionRequest(async () => {
    const already = await readGranted();
    if (already) return true;

    return new Promise<boolean>((resolve) => {
      let done = false;
      let leftApp = false;
      const finish = (granted: boolean) => {
        if (done) return;
        done = true;
        clearInterval(poll);
        sub.remove();
        resolve(granted);
      };

      const poll = setInterval(() => {
        void readGranted().then((granted) => {
          if (granted) finish(true);
        });
      }, POLL_MS);

      const sub = AppState.addEventListener('change', (state) => {
        if (state !== 'active') {
          leftApp = true;
          return;
        }
        if (!leftApp || Platform.OS === 'web') return;
        // The dialog has closed; give the request a moment to report, then trust the system.
        setTimeout(() => {
          void readGranted().then((granted) => {
            if (granted !== null) finish(granted);
          });
        }, AFTER_RETURN_MS);
      });

      Location.requestForegroundPermissionsAsync()
        .then((res) => finish(res.granted))
        .catch(() => {
          void readGranted().then((granted) => finish(Boolean(granted)));
        });
    });
  });
}
