import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

import i18n from '../lib/i18n';
import type { AppLanguage, Product } from '../types/models';

export interface CartItem {
  product: Product;
  quantity: number;
  /** The delivery window picked on the product page; the server uses it when it is still offered. */
  slotId: string | null;
}

interface CheckoutSelection {
  addressId: string | null;
}

interface AppState {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  /** The language the app is fading over to, while the "Changing language…" cover is up; null otherwise. */
  languageSwitchTarget: AppLanguage | null;
  setLanguageSwitchTarget: (language: AppLanguage | null) => void;
  cart: CartItem[];
  addToCart: (product: Product, slotId?: string | null) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  /** The PIN code the customer is ordering to. Empty until they enter one on the Location screen. */
  deliveryPin: string;
  setDeliveryPin: (pin: string) => void;
  checkoutSelection: CheckoutSelection;
  setCheckoutAddress: (addressId: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  language: i18n.language === 'gu' ? 'gu' : 'en',
  setLanguage: (language) => {
    void i18n.changeLanguage(language);
    void AsyncStorage.setItem('appLanguage', language).catch(() => undefined);
    set({ language });
  },
  languageSwitchTarget: null,
  setLanguageSwitchTarget: (languageSwitchTarget) => set({ languageSwitchTarget }),
  cart: [],
  addToCart: (product, slotId = null) => set((state) => {
    const existing = state.cart.find((item) => item.product.id === product.id);
    // The newest window picked for a product replaces an older one; adding again without a pick keeps what was there.
    if (existing) return { cart: state.cart.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1, slotId: slotId ?? item.slotId } : item) };
    return { cart: [...state.cart, { product, quantity: 1, slotId }] };
  }),
  updateCartQuantity: (productId, quantity) => set((state) => ({ cart: quantity <= 0 ? state.cart.filter((item) => item.product.id !== productId) : state.cart.map((item) => item.product.id === productId ? { ...item, quantity } : item) })),
  removeFromCart: (productId) => set((state) => ({ cart: state.cart.filter((item) => item.product.id !== productId) })),
  clearCart: () => set({ cart: [] }),
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
}));

