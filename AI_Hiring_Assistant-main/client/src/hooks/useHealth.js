import { useEffect, useState } from 'react';
import { api } from '../api/client';

// Cached at module level: the server's AI/storage mode does not change while the
// tab is open, and several screens need to know it.
let pending = null;

export function useHealth() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    pending ??= api.health().catch(() => null);
    let active = true;
    pending.then((value) => active && setHealth(value));
    return () => {
      active = false;
    };
  }, []);

  return health;
}
