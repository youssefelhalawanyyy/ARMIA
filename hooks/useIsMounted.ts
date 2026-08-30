'use client';

import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/**
 * Safe client-side mount hook that avoids hydration mismatch and cascading renders.
 * Returns false on SSR, and true immediately upon client hydration.
 */
export function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
