// One wall clock keeps every prayer card and reminder in sync.
let timestamp = Date.now();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;
function update() {
  timestamp = Date.now();
  listeners.forEach((listener) => listener());
}
export function prayerClockSnapshot() { return timestamp; }
export function subscribePrayerClock(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    update();
    timer = setInterval(update, 1000);
    window.addEventListener("focus", update);
    window.addEventListener("pageshow", update);
    document.addEventListener("visibilitychange", update);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(timer);
      window.removeEventListener("focus", update);
      window.removeEventListener("pageshow", update);
      document.removeEventListener("visibilitychange", update);
    }
  };
}
