// A tiny stand-in for the backend, for trying the app in a web browser on this computer only.
// Sample data, no database, nothing leaves the machine. Any 6-digit sign-in code works.
//   node scripts/mock-api.mjs        then start the web app with EXPO_PUBLIC_API_URL=http://localhost:4020
import { createServer } from "node:http";

const PORT = 4020;
const picture = (seed) => `https://picsum.photos/seed/${seed}/1080/1080`;
const customer = { id: "c-1", email: "tester@example.test", phone: "9824612345", name: "Test Customer", language: "en", needsProfile: false };
const variant = (id, name, price) => ({ id, name, pricePaise: price, compareAtPricePaise: null, displayUnit: "L", displayQuantity: 1, status: "active" });
const products = [
  { id: "p-1", name: "Cow Milk", nameGu: "ગાયનું દૂધ", categoryId: "cat-1", categoryName: "Milk", badges: ["Fresh"], purchaseMethods: ["buy_once"], imageUrl: picture("milk"), variants: [variant("v-1", "500 ml", 3500)] },
  { id: "p-2", name: "A2 Ghee", nameGu: "A2 ઘી", categoryId: "cat-2", categoryName: "Ghee", badges: [], purchaseMethods: ["buy_once"], imageUrl: picture("ghee"), variants: [variant("v-2", "250 g", 45000), variant("v-3", "500 g", 85000)] },
  { id: "p-3", name: "Fresh Paneer", nameGu: "તાજું પનીર", categoryId: "cat-3", categoryName: "Paneer", badges: [], purchaseMethods: ["buy_once"], imageUrl: picture("paneer"), variants: [variant("v-4", "200 g", 9000)] },
  { id: "p-4", name: "Dahi", nameGu: "દહીં", categoryId: "cat-1", categoryName: "Milk", badges: [], purchaseMethods: ["buy_once"], imageUrl: picture("curd"), variants: [variant("v-5", "400 g", 6000)] },
];
const offerBase = { titleGu: "", descriptionGu: "", maxDiscountPaise: null, endsOn: "2026-12-31", appliesOneTime: true, appliesTrial: false, appliesSubscription: false, minPlanDays: null };
const offers = [
  { ...offerBase, id: "o-1", title: "20% off your first ghee", description: "Pure A2 ghee, made the slow way.", kind: "percent", percent: 20, flatPaise: null, minOrderPaise: 30000, code: "GHEE20", imageUrl: picture("offer-ghee"), showText: true, points: [{ en: "Valid on orders above ₹300", gu: "" }, { en: "Once per customer", gu: "" }] },
  { ...offerBase, id: "o-2", title: "₹50 off milk plans", description: "", kind: "flat", percent: null, flatPaise: 5000, minOrderPaise: 0, code: null, imageUrl: null, showText: true, points: [] },
];
let cards = [
  { id: "r-1", status: "new", orderNumber: "SRM-1042", createdAt: "2026-11-07T06:00:00Z", expiresAt: "2026-12-07T06:00:00Z", offer: { ...offers[0], code: null } },
  { id: "r-2", status: "scratched", orderNumber: "SRM-1031", createdAt: "2026-11-01T06:00:00Z", expiresAt: "2026-12-01T06:00:00Z", offer: { ...offers[0], id: "o-3", title: "₹40 off your next order", kind: "flat", percent: null, flatPaise: 4000, code: "LUCKY40" } },
];
const settings = { supportPhone: "", supportEmail: "", supportWhatsApp: "", callEnabled: false, whatsappEnabled: false, minimumAppVersion: "1.0.0", latestAppVersion: "9.9.9", rewardsEnabled: true, rewardsMinOrderPaise: 0, maintenanceMode: false, flags: { showTrials: true, showSubscriptions: true, showOffers: true, showQualityReports: true, showSeasonalBanner: true } };
const banners = [
  { id: "b-1", type: "promotion", titleEn: "Farm-fresh A2 milk, before 7 AM", titleGu: "", messageEn: "Straight from our farm to your door.", messageGu: "", labelEn: "NEW", labelGu: "", imageUrl: picture("farm"), showText: true, ctaType: "offer", ctaTarget: "o-1", sortOrder: 1 },
  { id: "b-2", type: "promotion", titleEn: "Ghee week: 20% off", titleGu: "", messageEn: "Use code GHEE20.", messageGu: "", labelEn: "OFFER", labelGu: "", imageUrl: picture("ghee-week"), showText: true, ctaType: "offers", ctaTarget: "", sortOrder: 2 },
  { id: "b-3", type: "warning", titleEn: "Rain may delay some deliveries today", titleGu: "", messageEn: "", messageGu: "", labelEn: "", labelGu: "", imageUrl: null, showText: true, ctaType: "none", ctaTarget: "", sortOrder: 3 },
];
const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
const order = {
  id: "ord-1", orderNumber: "SRM-1042", status: "out_for_delivery", deliveryMethod: "local_delivery", deliveryDate: tomorrow,
  slot: { id: "s-1", name: "Morning", startTime: "06:00", endTime: "08:00" }, recipientName: "Test Customer", addressLine1: "B-12, Sunrise Society", addressLine2: "Sector 21", landmark: "", city: "Gandhinagar", pinCode: "382010",
  courierName: "", trackingUrl: "", totalPaise: 96000, discountPaise: 9000, offerTitle: "20% off your first ghee", offerTitleGu: "", paymentMethod: "online", paymentStatus: "paid",
  placedAt: new Date(Date.now() - 3 * 36e5).toISOString(), subscriptionId: null, cancelReason: "", canCancel: false,
  items: [
    { id: "l-1", productId: "p-2", variantId: "v-2", productName: "A2 Ghee", productNameGu: "", variantName: "250 g", unitPricePaise: 45000, quantity: 2, lineTotalPaise: 90000 },
    { id: "l-2", productId: "p-1", variantId: "v-1", productName: "Cow Milk", productNameGu: "", variantName: "500 ml", unitPricePaise: 3500, quantity: 2, lineTotalPaise: 7000 },
    { id: "l-3", productId: "p-3", variantId: "v-4", productName: "Fresh Paneer", productNameGu: "", variantName: "200 g", unitPricePaise: 9000, quantity: 1, lineTotalPaise: 0, isGift: true },
  ],
  timeline: [{ status: "placed", at: new Date(Date.now() - 3 * 36e5).toISOString() }, { status: "out_for_delivery", at: new Date(Date.now() - 20 * 6e4).toISOString() }],
};
const address = { id: "a-1", label: "home", recipientName: "Test Customer", recipientPhone: "9824612345", line1: "B-12, Sunrise Society", line2: "Sector 21", landmark: "", city: "Gandhinagar", pinCode: "382010", isDefault: true };

const routes = [
  ["POST", /^\/customer\/auth\/request-code$/, () => ({ sent: true })],
  ["POST", /^\/customer\/auth\/verify$/, () => ({ token: "mock-token", customer, isNewCustomer: false })],
  ["GET", /^\/customer\/me$/, () => ({ customer })],
  ["GET", /^\/public\/app-settings$/, () => ({ settings })],
  ["GET", /^\/public\/banners$/, () => ({ banners })],
  ["GET", /^\/public\/categories$/, () => ({ categories: [{ id: "cat-1", name: "Milk" }, { id: "cat-2", name: "Ghee" }, { id: "cat-3", name: "Paneer" }] })],
  ["GET", /^\/public\/products\?/, () => ({ products, total: products.length })],
  ["GET", /^\/public\/products\/([\w-]+)$/, (match) => ({ product: { ...products.find((item) => item.id === match[1]), longDescriptionEn: "Fresh from our farm every morning.", galleryUrls: [], highlightsEn: [], trialPlans: [], subscriptionRules: [] } })],
  ["GET", /^\/public\/offers$/, () => ({ offers })],
  ["GET", /^\/public\/offers\/([\w-]+)$/, (match) => { const offer = offers.find((item) => item.id === match[1]); return offer ? { offer } : [404, { error: { code: "OFFER_NOT_FOUND" } }]; }],
  ["GET", /^\/customer\/rewards$/, () => ({ cards })],
  ["POST", /^\/customer\/rewards\/([\w-]+)\/scratch$/, (match) => {
    cards = cards.map((card) => (card.id === match[1] ? { ...card, status: card.status === "new" ? "scratched" : card.status, offer: { ...card.offer, code: card.offer.code ?? "GHEE20" } } : card));
    return { card: cards.find((card) => card.id === match[1]) };
  }],
  ["GET", /^\/customer\/addresses$/, () => ({ addresses: [address] })],
  ["GET", /^\/customer\/notifications\/unread-count$/, () => ({ unread: 2 })],
  ["GET", /^\/customer\/notifications/, () => ({ notifications: [], total: 0, unread: 0 })],
  ["GET", /^\/customer\/orders\/ord-1$/, () => ({ order })],
  ["GET", /^\/customer\/orders/, () => ({ orders: [order], total: 1 })],
  ["GET", /^\/customer\/subscriptions/, () => ({ subscriptions: [] })],
  ["GET", /^\/customer\/deliveries/, () => ({ days: [] })],
  ["GET", /^\/customer\/credit$/, () => ({ credit: null })],
  ["GET", /^\/public\/delivery\/check/, () => ({ available: true })],
  ["GET", /^\/public\/(help|policies|onboarding)$/, () => ({ topics: [], faqs: [], policies: [], slides: [] })],
];

createServer((request, response) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
  if (request.method === "OPTIONS") { response.writeHead(204).end(); return; }
  const route = routes.find(([method, pattern]) => method === request.method && pattern.test(request.url ?? ""));
  const result = route ? route[2]((request.url ?? "").match(route[1])) : [404, { error: { code: "NOT_FOUND" } }];
  const [status, body] = Array.isArray(result) ? result : [200, result];
  response.writeHead(status, { "Content-Type": "application/json" }).end(JSON.stringify(body));
}).listen(PORT, () => console.log(`Mock API on http://localhost:${PORT}`));
