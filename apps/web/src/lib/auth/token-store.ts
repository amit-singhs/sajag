const KEY = 'sajag.admin.token';
type Listener = (token: string | null) => void;

function read(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

let current: string | null = read();
const listeners = new Set<Listener>();

/** Admin session token kept in sessionStorage (cleared when the tab closes). Observable for React. */
export const adminTokenStore = {
  get: (): string | null => current,
  set(token: string): void {
    current = token;
    try {
      sessionStorage.setItem(KEY, token);
    } catch {
      /* storage unavailable — keep the in-memory token */
    }
    listeners.forEach((l) => l(current));
  },
  clear(): void {
    current = null;
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    listeners.forEach((l) => l(null));
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
