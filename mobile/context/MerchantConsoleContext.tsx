import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  consoleCall,
  isFailure,
  type ConsoleOverview,
  type ConsoleResult,
} from '../lib/merchantConsoleApi';

export type ToastTone = 'good' | 'bad' | 'info';
export type Toast = { id: number; message: string; tone: ToastTone };

type ConsoleContextValue = {
  overview: ConsoleOverview | null;
  loading: boolean;
  error: string;
  errorCode: string;
  refreshing: boolean;
  refresh: () => Promise<void>;
  run: <T>(action: string, payload?: Record<string, unknown>) => Promise<ConsoleResult<T>>;
  toast: Toast | null;
  notify: (message: string, tone?: ToastTone) => void;
};

const ConsoleContext = createContext<ConsoleContextValue | null>(null);

function isOverview(value: unknown): value is ConsoleOverview {
  const body = value as Partial<ConsoleOverview> | null;
  return Boolean(body && body.success === true && body.business && body.profile && body.stats);
}

export function MerchantConsoleProvider({ children }: { children: ReactNode }) {
  const [overview, setOverview] = useState<ConsoleOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((message: string, tone: ToastTone = 'good') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), message, tone });
    toastTimer.current = setTimeout(() => setToast(null), tone === 'bad' ? 4200 : 2600);
  }, []);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const apply = useCallback((result: ConsoleResult<ConsoleOverview>) => {
    if (isFailure(result)) {
      setError(result.error);
      setErrorCode(result.code || '');
      return;
    }
    setError('');
    setErrorCode('');
    setOverview(result);
  }, []);

  const load = useCallback(async () => apply(await consoleCall<ConsoleOverview>('overview')), [apply]);

  useEffect(() => {
    let alive = true;
    void consoleCall<ConsoleOverview>('overview').then((result) => {
      if (!alive) return;
      apply(result);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [apply]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const run = useCallback(
    async <T,>(action: string, payload: Record<string, unknown> = {}): Promise<ConsoleResult<T>> => {
      const result = await consoleCall<T>(action, payload);
      if (isOverview(result)) setOverview(result);
      return result;
    },
    [],
  );

  const value = useMemo<ConsoleContextValue>(
    () => ({ overview, loading, error, errorCode, refreshing, refresh, run, toast, notify }),
    [overview, loading, error, errorCode, refreshing, refresh, run, toast, notify],
  );

  return <ConsoleContext.Provider value={value}>{children}</ConsoleContext.Provider>;
}

export function useMerchantConsole() {
  const ctx = useContext(ConsoleContext);
  if (!ctx) throw new Error('useMerchantConsole must be used within MerchantConsoleProvider');
  return ctx;
}
