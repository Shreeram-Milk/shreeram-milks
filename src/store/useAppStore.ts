import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

import i18n from '../lib/i18n';
import type { AppLanguage, DeliveryCalendarEntry, Order, Product } from '../types/models';

export interface CartItem {
  product: Product;
  quantity: number;
}

export type CheckoutDeliverySlot = 'early' | 'standard';

interface CheckoutSelection {
  addressId: string | null;
  deliverySlot: CheckoutDeliverySlot;
}

interface AppState {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  cart: CartItem[];
  addToCart: (product: Product) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  /** The PIN code the customer is ordering to. Empty until they enter one on the Location screen. */
  deliveryPin: string;
  setDeliveryPin: (pin: string) => void;
  checkoutSelection: CheckoutSelection;
  previewOrder: Order | null;
  /** Builds the preview order for the sample checkout; `address` is the customer's chosen address, already formatted. */
  confirmPreviewOrder: (address: string) => Order | null;
  setCheckoutAddress: (addressId: string) => void;
  setCheckoutDeliverySlot: (deliverySlot: CheckoutDeliverySlot) => void;
  deliveryOverrides: Record<string, DeliveryCalendarEntry['state']>;
  setDeliveryState: (id: string, state: DeliveryCalendarEntry['state']) => void;
  vacationPause: { subscriptionIds: string[]; from: string; resumeOn: string } | null;
  setVacationPause: (pause: { subscriptionIds: string[]; from: string; resumeOn: string }) => void;
}

export const useAppStore = create<AppState>((set) => ({
  language: i18n.language === 'gu' ? 'gu' : 'en',
  setLanguage: (language) => {
    void i18n.changeLanguage(language);
    void AsyncStorage.setItem('appLanguage', language).catch(() => undefined);
    set({ language });
  },
  cart: [],
  addToCart: (product) => set((state) => {
    const existing = state.cart.find((item) => item.product.id === product.id);
    if (existing) return { cart: state.cart.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) };
    return { cart: [...state.cart, { product, quantity: 1 }] };
  }),
  updateCartQuantity: (productId, quantity) => set((state) => ({ cart: quantity <= 0 ? state.cart.filter((item) => item.product.id !== productId) : state.cart.map((item) => item.product.id === productId ? { ...item, quantity } : item) })),
  removeFromCart: (productId) => set((state) => ({ cart: state.cart.filter((item) => item.product.id !== productId) })),
  clearCart: () => set({ cart: [] }),
  deliveryPin: '',
  setDeliveryPin: (deliveryPin) => set({ deliveryPin }),
  checkoutSelection: { addressId: null, deliverySlot: 'early' },
  previewOrder: null,
  confirmPreviewOrder: (address) => {
    const state = useAppStore.getState();
    if (!address || state.cart.length === 0) return null;
    const order: Order = {
      id: `SR-${Date.now()}`,
      address,
      deliveryWindow: state.checkoutSelection.deliverySlot === 'early' ? '5:30 AM – 7:00 AM' : '7:00 AM – 8:30 AM',
      items: state.cart.map(({ product, quantity }) => ({ imageUrl: product.imageUrl, name: product.name, quantity, total: product.price * quantity, unit: product.unit })),
      placedAt: new Date().toISOString(),
      status: 'confirmed',
      total: state.cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    };
    set({ previewOrder: order });
    return order;
  },
  setCheckoutAddress: (addressId) => set((state) => ({
    checkoutSelection: { ...state.checkoutSelection, addressId },
  })),
  setCheckoutDeliverySlot: (deliverySlot) => set((state) => ({
    checkoutSelection: { ...state.checkoutSelection, deliverySlot },
  })),
  deliveryOverrides: {},
  setDeliveryState: (id, deliveryState) => set((state) => ({ deliveryOverrides: { ...state.deliveryOverrides, [id]: deliveryState } })),
  vacationPause: null,
  setVacationPause: (vacationPause) => set({ vacationPause }),
}));
