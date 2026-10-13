export type AppLanguage = "en" | "gu";

export interface Product {
  category: string;
  id: string;
  name: string;
  nameGujarati: string;
  description: string;
  price: number;
  unit: string;
  imageUrl: string | null;
  isAvailable: boolean;
}

export interface ServiceArea {
  pincode: string;
  locality: string;
  isServiceable: boolean;
}

export interface DemoUser {
  id: string;
  phone: string;
  name: string;
}

export type AddressType = "home" | "work" | "other";

export interface DeliveryAddress {
  addressType: AddressType;
  city: string;
  fullName: string;
  id: string;
  isDefault: boolean;
  isServiceable: boolean;
  landmark: string;
  line1: string;
  line2: string;
  phone: string;
  pincode: string;
}

export interface DoorstepInstructions {
  additionalInstructions: string;
  dropLocation: "front-door" | "side-gate" | "milk-box" | "security-desk";
  handoff: "hand-to-me" | "leave-at-door" | "milk-box" | "security";
  noCall: boolean;
  noDoorbell: boolean;
  notifyAfterDelivery: boolean;
}

export type DeliveryState = "scheduled" | "delivered" | "paused" | "skipped";

export interface DeliveryCalendarEntry {
  addressLabel: string;
  date: string;
  id: string;
  productName: string;
  quantity: string;
  state: DeliveryState;
  timeSlot: string;
}

export type OrderStatus = "confirmed" | "out-for-delivery" | "delivered";

export interface OrderItem {
  imageUrl: string | null;
  name: string;
  quantity: number;
  total: number;
  unit: string;
}

export interface Order {
  address: string;
  deliveryWindow: string;
  id: string;
  items: OrderItem[];
  placedAt: string;
  status: OrderStatus;
  total: number;
}
