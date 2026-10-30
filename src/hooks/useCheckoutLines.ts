import { useMemo } from 'react';

import { useAppStore, type CartItem } from '../store/useAppStore';

/** What the checkout is for: the one product bought with "Buy now", otherwise the whole cart. */
export function useCheckoutLines(): CartItem[] {
  const buyNow = useAppStore((state) => state.buyNow);
  const cart = useAppStore((state) => state.cart);
  return useMemo(() => (buyNow ? [buyNow] : cart), [buyNow, cart]);
}
