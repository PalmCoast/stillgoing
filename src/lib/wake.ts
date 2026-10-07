type Sentinel = { release: () => Promise<void> };

function wakeApi(): { request: (type: 'screen') => Promise<Sentinel> } | null {
  const nav = navigator as Navigator & {
    wakeLock?: { request: (type: 'screen') => Promise<Sentinel> };
  };
  return nav.wakeLock ?? null;
}

export async function requestWakeLock(): Promise<(() => void) | null> {
  const api = wakeApi();
  if (!api) return null;
  try {
    const lock = await api.request('screen');
    return () => {
      void lock.release();
    };
  } catch {
    return null;
  }
}
