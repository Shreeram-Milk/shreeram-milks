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
export type AddressKind = "society" | "independent" | "unspecified";
export type DeliveryDetails = { building: string; towerWing: string; floor: string; unit: string; lane: string };

export interface DeliveryPlace {
  source?: "geoapify";
  id: string;
  name: string;
  locality: string;
  pinCode: string;
  kind: "society" | "locality";
  status: "pending" | "approved";
}

export interface DeliveryAddress {
  addressType: AddressType;
  city: string;
  fullName: string;
  id: string;
  isDefault: boolean;
  landmark: string;
  line1: string;
  line2: string;
  phone: string;
  pincode: string;
  /** Optional for saved addresses from older app versions. */
  addressKind?: AddressKind;
  deliveryPlaceId?: string | null;
  deliveryPlaceName?: string;
  locality?: string;
  deliveryDetails?: DeliveryDetails;
  deliveryDetailsConfirmed?: boolean;
}

export interface DoorstepInstructions {
  additionalInstructions: string;
  dropLocation: "front-door" | "side-gate" | "milk-box" | "security-desk";
  handoff: "hand-to-me" | "leave-at-door" | "milk-box" | "security";
  noCall: boolean;
  noDoorbell: boolean;
  notifyAfterDelivery: boolean;
}

