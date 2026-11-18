type Listener = () => void;

const listeners = new Set<Listener>();
let pending = false;

/** Ask home rows that are not loaded yet to check if they are near the screen. */
export function publishHomeScroll() {
  if (pending) return;
  pending = true;
  setTimeout(() => {
    pending = false;
    listeners.forEach((listener) => listener());
  }, 80);
}

export function subscribeHomeScroll(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
