import { useEffect, useState } from 'react';

let splashOn = true;
const listeners = new Set<(on: boolean) => void>();

/** The opening splash plays once per app launch, not again when Home is focused. */
export function finishConsoleSplash() {
  if (!splashOn) return;
  splashOn = false;
  listeners.forEach((listener) => listener(false));
}

export function useConsoleSplash() {
  const [on, setOn] = useState(splashOn);

  useEffect(() => {
    listeners.add(setOn);
    setOn(splashOn);
    return () => {
      listeners.delete(setOn);
    };
  }, []);

  return on;
}
