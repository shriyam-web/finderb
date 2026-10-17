import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getPreferredShell,
  subscribePreferredShell,
  type PreferredShell,
} from '../lib/preferredShell';

/** Consumer screens stay on user notifications after switching out of the business app. */
export function usePreferredShell(): PreferredShell {
  const { user } = useAuth();
  const [shell, setShell] = useState<PreferredShell>(user?.isBusinessAccount ? 'business' : 'user');

  useEffect(() => {
    let alive = true;
    void getPreferredShell(Boolean(user?.isBusinessAccount)).then((next) => {
      if (alive) setShell(next);
    });
    const unsubscribe = subscribePreferredShell((next) => {
      if (alive) setShell(next);
    });
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [user?.isBusinessAccount]);

  return shell;
}
