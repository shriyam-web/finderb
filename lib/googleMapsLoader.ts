'use client';

const SCRIPT_ID = 'finderb-google-maps-js';
const CALLBACK_NAME = '__finderbGoogleMapsReady';

let loading: Promise<typeof google.maps> | null = null;

export function loadGoogleMaps(): Promise<typeof google.maps> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps can only load in the browser.'));
  }
  if (window.google?.maps?.Map) return Promise.resolve(window.google.maps);
  if (loading) return loading;

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  if (!key) return Promise.reject(new Error('Google Maps is not configured.'));

  loading = new Promise<typeof google.maps>((resolve, reject) => {
    const callbacks = window as unknown as Record<string, unknown>;
    callbacks[CALLBACK_NAME] = () => {
      delete callbacks[CALLBACK_NAME];
      resolve(window.google.maps);
    };

    document.getElementById(SCRIPT_ID)?.remove();
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.async = true;
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}` +
      `&v=weekly&region=IN&language=en&loading=async&callback=${CALLBACK_NAME}`;
    script.onerror = () => {
      loading = null;
      script.remove();
      reject(new Error('Google Maps could not load. Check your connection and try again.'));
    };
    document.head.appendChild(script);
  });

  return loading;
}
