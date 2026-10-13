# Hard-coded Content Audit — Customer App

Every piece of text or value in the customer app falls into one of three kinds. This file records which is which, so
backend wiring moves the right things and leaves the rest alone.

- **A. UI translation.** Fixed interface text. Stays in `src/locales/en.json` and `gu.json`.
- **B. Business-editable content.** Wording or values the business changes. Comes from the admin CMS.
- **C. Runtime transactional data.** Belongs to one customer or one moment. Comes from the business API.

Key parity: `en.json` and `gu.json` both have 582 keys, none missing on either side.

## B. Business-editable content (to come from the CMS)

| Where it lives now | What it is | CMS source in the admin | Typed boundary now |
| --- | --- | --- | --- |
| `home.offer`, `home.bannerTitle`, `home.bannerDetail` | Home banner | Content → Banners | `bannerService` / `useBanners` |
| `support.faq*` (4 questions and answers) | Help Center articles | Content → Help Center | `faqService` / `useFaqs` |
| `support.deliveryMissing` … `support.other` (8 labels) | Support categories | Fixed list shared with tickets | `getSupportCategories` / `useSupportCategories` |
| `support.callDetail` ("5:00 AM – 8:00 PM") | Support hours | App Settings | `appSettingsService` / `useAppConfig` |
| `support.chatDetail`, `support.callUnavailable` | Which support channels exist | App Settings (call / chat / WhatsApp switches) | `useAppConfig` |
| `onboarding.title`, `onboarding.description` | First-run slide | Content → Onboarding | `onboardingContentService` / `useOnboardingSlides` |
| `productDetails.nutritionContent`, `productDescription` | Product nutrition and description | Products → Content | Product API (products already behind `productService`) |
| `settings.reports`, `settings.reportsSubtitle` | Lab reports | Content → Quality & Reports | `qualityReportService` / `useQualityReports` |
| Policies (no screen yet) | Privacy, terms, refund, cancellation, subscription, delivery | Content → Legal & Policies | `policyService` / `usePolicies` |
| `deliverySlot.silentTime`, `handoverTime`, `productDetails.earlySlot`, `regularSlot`, `checkout.address.earlySlot`, `standardSlot`, `subscriptionManage.*Slot` | Delivery windows | Master Data → Delivery Slots | Needs a slot service in the API; the same times are repeated in 8 keys and in `useAppStore.ts` |
| `cart.discount` ("Dawn discount"), `productDetails.discount` ("10% OFF") | Offers | Content → Offers | API pricing; the discount must never be calculated on the device |
| "Before 7 AM" repeated inside `home.bannerTitle`, `onboarding.description`, `productDetails.productDescription`, `productDetails.beforeSeven` | Delivery promise | App Settings | `useAppConfig` (`deliveryPromiseEn/Gu`) |
| Maintenance and update screens (none yet) | Maintenance message, minimum version | App Settings | `useAppConfig` and `isVersionBelow` |

## C. Runtime transactional data (to come from the business API)

| Where it lives now | What it is |
| --- | --- |
| `useAppStore.ts` addresses (`Priya Sharma`, `9820144521`, Satara addresses) | Customer addresses |
| `useAppStore.ts` `profile` | Customer profile |
| `app/home.tsx` `name: "Priya"` | Signed-in customer's name |
| `home.nextDelivery`, `nextDeliveryTime`, `nextDeliveryProduct` | Next delivery |
| `profile.walletBalance` ("₹420"), `profile.member`, `settings.memberDetail` | Balance, membership, subscription id |
| `subscriptions.tabs.active` ("Active (3)") | Subscription counts |
| `useAppStore.ts` `confirmPreviewOrder` (`SR-${Date.now()}`, totals) | Order id and total; the server creates and prices orders |
| `useAppStore.ts` `deliveryOverrides`, `vacationPause` | Skips, pauses and holds |
| `app/delivery-address-form.tsx` `city: "Satara"`, `app/location.tsx` landmark | Address defaults |
| `tracking.*` ("Out for dawn transit", partner details) | Order and delivery status |
| `success.deliverySlot` | The slot of the order just placed |

Server data in the Zustand store (addresses, profile, orders, delivery states) breaks the app's own rule that server data
belongs in TanStack Query. Move each of these to a query hook as its endpoint is wired.

## Leftovers to clean up

- **Unused translation keys (27).** Safe to delete: `common.foundationReady`, `cart.count`, `cart.ready`,
  `cart.deliveryNote`, `deliverySetup.title`, `productCard.addedAction`, `profile.customerName`, `profile.logout`,
  `profile.logoutSubtitle`, `settings.logout`, `checkout.review.emptyTitle`, `checkout.review.emptyDetail`,
  `payment.secure`, `success.delivery`, `success.deliverySlot`, `commonActions.save`, `commonActions.done`.
- **Keys for features that have no screen.** `profile.wallet`, `profile.walletBalance`, `profile.addMoney`,
  `settings.passbook*`, `settings.farmVisit*`, `settings.book`, `settings.reports*`. Wallet and farm visit are on hold
  pending a product decision; delete the keys or build the screens once that is decided.
- **Version strings.** `profile.version` ("v3.4.2") and `settings.version` ("v2.4.1") are fixed text and disagree with
  `app.json` (1.0.0). Read the version from `expo-constants`.
- **Preview wording** such as `payment.reassurance` ("This preview confirms your order without collecting a payment")
  must go before release. It is correct only while the payment service is not connected.

## A. UI translation (stays as it is)

Navigation labels, buttons (Back, Save, Cancel, Continue), field labels, validation and error text, empty-state and
loading text, and accessibility labels. Do not move these into the CMS.
