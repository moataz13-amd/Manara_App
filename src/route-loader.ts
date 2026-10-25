// Share speculative and navigation requests; failed preloads remain retryable.
export function preloadable<T>(loader: () => Promise<T>) {
  let pending: Promise<T> | undefined;
  return () => pending ??= loader().catch((error) => {
    pending = undefined;
    throw error;
  });
}

export function isStaleChunkError(error: unknown) {
  return error instanceof Error && /Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk|ChunkLoadError|error loading dynamically imported module/i.test(error.message);
}
export async function loadRoute<T>(loader: () => Promise<T>): Promise<T> {
  const key = `manara-route-retry:${window.location.pathname}`;
  try {
    const result = await loader();
    try { sessionStorage.removeItem(key); } catch {}
    return result;
  } catch (error) {
    if (!isStaleChunkError(error) || !navigator.onLine) throw error;
    try {
      if (sessionStorage.getItem(key)) throw error;
      sessionStorage.setItem(key, "1");
    } catch { throw error; }
    // A deployed build can remove a lazy chunk referenced by an older open tab.
    window.location.reload();
    return new Promise<T>(() => {});
  }
}
