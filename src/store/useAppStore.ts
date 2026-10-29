import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import i18n from '../lib/i18n';
import type { AppLanguage, Product } from '../types/models';

export interface CartItem {
  product: Product;
  quantity: number;
  /** The delivery window picked on the product page; the server uses it when it is still offered. */
  slotId: string | null;
}

/** The most of one item the server accepts in a single order. The cart never goes past it. */
export const MAX_CART_QUANTITY = 100;
const capped = (quantity: number) => Math.min(quantity, MAX_CART_QUANTITY);

interface CheckoutSelection {
  addressId: string | null;
}

interface AppState {
  language: AppLanguage;
  /** Has this phone ever picked a language (now or on an earlier visit)? A fresh install has not, so it asks first. */
  languageChosen: boolean;
  setLanguage: (language: AppLanguage) => void;
  /** The language the app is fading over to, while the "Changing language…" cover is up; null otherwise. */
  languageSwitchTarget: AppLanguage | null;
  setLanguageSwitchTarget: (language: AppLanguage | null) => void;
  cart: CartItem[];
  addToCart: (product: Product, slotId?: string | null) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  /** Forgets everything about the current checkout: the cart and the chosen address. Used when the customer signs out. */
  resetCheckout: () => void;
  /** The PIN code the customer is ordering to. Empty until they enter one on the Location screen. */
  deliveryPin: string;
  setDeliveryPin: (pin: string) => void;
  checkoutSelection: CheckoutSelection;
  setCheckoutAddress: (addressId: string) => void;
}

export const useAppStore = create<AppState>()(persist((set) => ({
  language: i18n.language === 'gu' ? 'gu' : 'en',
  setLanguage: (language) => {
    void i18n.changeLanguage(language);
    void AsyncStorage.setItem('appLanguage', language).catch(() => undefined);
    set({ language, languageChosen: true });
  },
  languageChosen: false,
  languageSwitchTarget: null,
  setLanguageSwitchTarget: (languageSwitchTarget) => set({ languageSwitchTarget }),
  cart: [],
  addToCart: (product, slotId = null) => set((state) => {
    const existing = state.cart.find((item) => item.product.id === product.id);
    // The newest window picked for a product replaces an older one; adding again without a pick keeps what was there.
    if (existing) return { cart: state.cart.map((item) => item.product.id === product.id ? { ...item, quantity: capped(item.quantity + 1), slotId: slotId ?? item.slotId } : item) };
    return { cart: [...state.cart, { product, quantity: 1, slotId }] };
  }),
  updateCartQuantity: (productId, quantity) => set((state) => ({ cart: quantity <= 0 ? state.cart.filter((item) => item.product.id !== productId) : state.cart.map((item) => item.product.id === productId ? { ...item, quantity: capped(quantity) } : item) })),
  removeFromCart: (productId) => set((state) => ({ cart: state.cart.filter((item) => item.product.id !== productId) })),
  clearCart: () => set({ cart: [] }),
  resetCheckout: () => set({ cart: [], checkoutSelection: { addressId: null } }),
  deliveryPin: '',
  setDeliveryPin: (deliveryPin) => {
    // Remembered on the phone so the customer is not asked for their PIN code on every visit.
    void AsyncStorage.setItem('deliveryPin', deliveryPin).catch(() => undefined);
    set({ deliveryPin });
  },
  checkoutSelection: { addressId: null },
  setCheckoutAddress: (addressId) => set((state) => ({
    checkoutSelection: { ...state.checkoutSelection, addressId },
  })),
}), {
  name: 'shreeram-cart',
  storage: createJSONStorage(() => AsyncStorage),
  // Only the cart is kept between visits. The language, PIN code and chosen address have their own places or start fresh.
  partialize: (state) => ({ cart: state.cart }),
}));
