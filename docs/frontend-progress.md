# Frontend Completion Progress — ShreeRam Milks

## Purpose

This file is the single progress tracker for completing and freezing the customer frontend.

Codex must read this file before frontend work and update it only after work is actually implemented and verified.

Do not mark an item complete merely because:
- a file exists
- a route renders
- text is visible
- mock data is present

Mark complete only after the relevant acceptance criteria in:

```text
docs/01-screen-completion.md
docs/02-ui-refinement.md
```
have been satisfied.

Phase 1 intentionally uses mock services and local client state. A mock record
or demo profile is not incomplete solely because it is not connected to a
backend. Phase A checks cover frontend behavior using that mock/local data.
Backend-dependent persistence, identity, payment processing, and live support
belong to later API/integration work. Keep demo state coherent across screens
and never present a mock action as a verified real-world transaction.

---

# Phase A — Screen Completion

## Core Remaining Screens

- [x] Delivery Addresses rebuilt as feature-specific UI
- [x] Add Address flow implemented
- [x] Edit Address flow implemented
- [x] Delete Address confirmation implemented
- [x] Delivery Calendar & Holds rebuilt
- [x] Calendar delivery-state legend implemented
- [x] Selected-day detail state implemented
- [x] Calendar pause/skip navigation connected
- [x] Doorstep Instructions rebuilt
- [x] Doorstep preference save feedback implemented
- [x] Help & Support rebuilt
- [x] Recent-order support entry implemented
- [x] Support issue categories implemented
- [x] FAQ experience implemented
- [x] Checkout Payment upgraded
- [x] Order Success upgraded
- [x] Edit Profile implemented
- [x] Language selector implemented and wired to i18n

## Product Decisions

- [x] Wallet / Passbook decision confirmed
- [x] Wallet implemented OR visible dead wallet affordance removed
- [x] Farm Visit decision confirmed
- [x] Farm Visit implemented OR visible dead affordance removed
- [x] Quality Reports decision confirmed
- [x] Reports implemented OR visible dead affordance removed

### Phase A — Verified Mock/Local Behavior Follow-ups

- [x] Checkout selection survives review → payment → success (selected address
      and slot are shown; checkout is blocked when no serviceable address exists)
- [x] Calendar uses real date arithmetic for the visible month and maps mock
      delivery records by full date, including month length and weekday offset
- [x] Calendar skip/pause actions update shared mock/local delivery state
- [x] Vacation date selection is based on current dates and a successful local
      pause updates the selected mock subscriptions
- [x] Help/support categories and FAQ entries show relevant content; unavailable
      live chat/call actions are clearly described as unavailable
- [x] Address validation rejects whitespace-only required fields; editing a
      pincode recalculates serviceability
- [x] Saved profile name is shared by Profile and Settings
- [x] Doorstep save confirmation clears when the draft is changed
- [x] Language preference persists locally across app restarts

> These are frontend/local-state completion items, not requests for backend
> wiring. A generated mock order ID is acceptable; it must be consistent across
> success and tracking and must not imply a real processed payment.

---

# Phase B — UI Refinement

## Typography

- [x] Add intentional compact overline token if needed
- [x] Add intentional badge-label token if needed
- [x] Remove arithmetic font scaling hacks
- [x] Fix Product Details `10% OFF` / `MOST POPULAR` label sizing
- [ ] Verify Gujarati typography and wrapping
- [x] Differentiate Gujarati profile/settings row titles from supporting copy by weight and text color

## Bottom Navigation

- [x] Reduce cart badge visual size
- [x] Reduce cart badge number size
- [x] Add sensible two-digit / `99+` behavior
- [ ] Verify badge position on Android/iOS
- [x] Refine active/inactive nav state
- [x] Add subtle nav interaction animation if appropriate
- [x] Apply deep warm navigation anchor token with white icon/label contrast

## Interaction Feedback

- [x] Button press behavior consistent
- [x] Product card press feedback
- [x] Add/Added feedback
- [x] Account/settings row feedback
- [x] Selection card feedback
- [x] Category/filter chip feedback
- [x] Delivery-slot feedback
- [x] Calendar/date feedback
- [x] Payment method feedback

## Touch Targets

- [x] Product Add control
- [x] Quantity +/- controls
- [x] Back buttons
- [x] Edit/delete icons
- [x] Category chips
- [x] Calendar navigation
- [x] Day selectors
- [x] FAQ rows
- [x] Language rows
- [x] Bottom nav tabs

## Color / Hierarchy

- [x] Audit overuse of solid primary fill in the refined Home, Subscriptions, Payment, Profile, and Settings surfaces
- [x] Use primary tint for secondary selected states where appropriate
- [x] Verify primary/pressed/navigation brand colors at the source-token level
- [ ] Resolve any unconfirmed warning/info colors before release
- [x] Implement warm background, white-card, muted-surface, and disabled-surface token hierarchy
- [x] Apply semantic success/warning/info/danger roles to shared badges and order statuses
- [ ] Verify surface/background hierarchy on-device
- [ ] Reduce unnecessary borders
- [x] Verify radius semantics

## Layout Consistency

- [x] Preserve screen structure while differentiating profile/settings title and supporting-copy hierarchy
- [ ] Header heights consistent
- [ ] Back button alignment consistent
- [ ] Screen horizontal padding consistent
- [ ] Section spacing rhythm consistent
- [ ] Sticky bottom actions consistent
- [x] Bottom-sheet styling consistent
- [ ] Small Android width QA
- [ ] Safe-area QA

## States

- [x] Loading states audited
- [x] Empty states audited
- [x] Error states audited
- [x] Disabled states audited
- [x] Save/submission states audited
- [x] Success feedback audited
- [x] Retry actions audited

## Motion / Smoothness

- [x] Motion token usage audited
- [x] Card press motion standardized
- [ ] Selection transition standardized
- [x] Bottom nav motion standardized
- [x] Bottom sheet motion standardized
- [x] No excessive/non-native screen animations
- [ ] Growing lists use FlatList/FlashList
- [ ] Avoid obvious render-time jank

## Haptics

- [x] Haptic use decision confirmed (no haptics in this preview build)
- [x] If used, only meaningful actions have haptics (not applicable; none used)
- [x] No haptic spam (none used)

> Phase B source audit is complete for the checked code-level items above.
> Device-only verification remains open for badge alignment, surface/border
> hierarchy, spacing/header consistency, sticky actions, safe areas, keyboard
> behavior, Gujarati wrapping, calendar motion, and small Android widths.
> Selection-state transitions are implemented but not standardized across all
> control types; visual consistency still needs a device pass. Warning/info
> supporting color values remain unconfirmed against the brand source.
> Android smoke QA on an OPPO CPH2805 (Android 16) found checkout footer CTA
> labels clipped on Address & Slot and Order Review. Compact translated labels
> and a slightly wider shared footer button were implemented and visually
> verified on-device. Other sticky actions and smaller-width devices remain
> unverified; iOS QA was not performed.

---

# Phase C — Architecture & Frontend Contract Audit

- [x] No screen imports `src/mock-data/*`
- [x] No component imports `src/mock-data/*`
- [x] No hook imports `src/mock-data/*`
- [x] Only services access mock data
- [x] No screen/component performs direct `fetch()`
- [x] Data-driven UI uses typed models
- [ ] Service contracts are future-API-friendly
- [x] No duplicate global/server state
- [x] TanStack Query remains server/external data layer
- [x] Zustand remains client-only shared state
- [x] No unnecessary dependencies introduced (Reanimated is an optional peer of Expo Router and keyboard-controller)
- [x] No `any`
- [x] No committed `console.log`
- [x] No fake production API/payment/auth success paths (auth/payment are explicitly labeled preview flows)

> Service methods are separated and typed, but product/order list signatures
> have no filtering or pagination parameters; review these contracts before
> real API wiring. No test script is configured. The address list still renders
> through a ScrollView and should be revisited if its record count can grow.

---

# Phase D — Navigation & Flow QA

> Source route audit completed: literal push/replace destinations resolve to
> routes, the expected flow edges are wired, and checkout has a loading/guard
> against repeat confirmation before it dismisses the payment route. These
> checks indicate code wiring only; no end-to-end device run was performed.
> Partial Android smoke QA was subsequently performed on an OPPO CPH2805
> (Android 16): onboarding skip → Home → Products → Product Details → Cart →
> Checkout Address → Review → explicitly labeled preview Payment → Order
> Success → Tracking; subscription list → vacation date selection (date range
> adjusted backward and forward across week rows, not confirmed) → Manage
> Subscription; Profile → Settings → Gujarati language selection and back.
> The device language was restored to English. These are selected-path smoke
> checks only; auth/OTP/location, successful vacation submission, all routes,
> repeated-submit/back stress, iOS, and full end-to-end QA remain unverified.

## Entry/Auth Mock Flow

- [x] Launch route correct (index redirects to onboarding)
- [x] Onboarding correct (sign-in CTA; explicit skip to home)
- [x] Sign in correct (validated phone proceeds to preview OTP)
- [x] OTP mock verification correct (explicit preview copy; routes to location)
- [x] Location/serviceability flow correct (service-area lookup and delivery setup route)
- [x] Delivery setup flow correct (steps route to home)
- [x] Home entry correct (code wiring only)

## Commerce

- [x] Home → Products (route wiring only)
- [x] Products → Product Details (route wiring only)
- [x] Product Details → Cart (route wiring only)
- [x] Search → Product Details (route wiring only)
- [x] Cart → Checkout Address (route wiring only)
- [x] Checkout Address → Review (route wiring only)
- [x] Review → Payment (route wiring only)
- [x] Payment → Success (guarded preview confirmation; route wiring only)
- [x] Success → Track Order (same preview order ID passed; route wiring only)
- [x] Success → Home (route wiring only)
- [x] Checkout cannot accidentally double-submit (confirming guard/loading state in source)
- [x] Back navigation cannot accidentally resubmit payment (payment stack dismissed/replaced after confirmation)

## Subscription

- [x] Product → Subscription setup (route wiring only)
- [x] Subscriptions list (route wiring only)
- [x] Manage subscription (route wiring only)
- [x] Vacation/pause flow (route wiring only)
- [x] Calendar links correctly to subscription actions (route wiring only)

## Profile

- [x] Profile → Orders (route wiring only)
- [x] Profile → Subscriptions (route wiring only)
- [x] Profile → Calendar (route wiring only)
- [x] Profile → Addresses (route wiring only)
- [x] Profile → Doorstep Instructions (route wiring only)
- [x] Profile → Settings (route wiring only)
- [x] Profile → Help (route wiring only)
- [x] Profile → Edit Profile if exposed (route wiring only)
- [ ] Profile → Wallet if retained

## Settings

- [x] Language action works (route/store/i18n wiring verified in source)
- [x] Support action works (profile support route; no separate settings support row)
- [x] Logout UI is intentional (not shown; there is no authenticated session in this preview)
- [x] All visible settings rows either work, are disabled, or are removed (source wiring reviewed)
- [ ] No dead tap targets found across the full app (primary route references reviewed; every screen still needs interaction QA)

---

# Phase E — Localization QA

> Static audit found exact English/Gujarati key parity (579 each) and no missing
> literal translation keys referenced by app/screens and shared components.
> Product names now use the existing Gujarati name field in cards, details,
> search, cart, and checkout review. Product descriptions/units and historical
> order-item snapshots remain English-only data; these are not considered fully
> localized until translated fields or locale-aware API content are available.
> Android spot-check of Profile, Settings, and Language selection showed the
> Gujarati text and navigation labels fitting on the tested 360dp-wide device.
> This is not full Gujarati visual QA: product cards, checkout controls,
> calendar, long addresses, small widths, and iOS still need review.

- [ ] All user-facing copy migrated to i18n
- [x] English keys complete (key parity and literal references checked)
- [x] Gujarati keys complete (key parity and literal references checked)
- [ ] No untranslated fallback strings in normal flows
- [ ] Gujarati buttons do not clip
- [ ] Gujarati navigation labels do not clip
- [ ] Gujarati cards do not overflow
- [ ] Long addresses wrap correctly
- [x] Error/success/empty copy localized (static key review)

---

# Phase F — Accessibility QA

> Source-level fixes in this pass add semantic roles/state to search/order
> filters, accessible disabled state to shared buttons, and a full touch target
> to profile-detail edit controls. Many controls expose labels/state in code;
> screen-reader order, actual announcements, contrast, and touch behavior still
> require TalkBack/VoiceOver and device verification.

- [x] Interactive controls have roles (source audit; native controls included)
- [x] Interactive controls have useful labels (visible text or explicit label in source)
- [x] Selected/toggled controls expose state (source audit)
- [x] Important status is not communicated only by color (status text/legend present in source)
- [ ] Minimum touch target respected
- [ ] Text contrast visually acceptable
- [ ] Screen-reader order is sensible for key flows
- [x] Inputs have useful labels/placeholders (including profile-detail editor)
- [x] Destructive actions are clearly announced (confirmation copy/actions in source; announcement still needs device QA)

---

# Phase G — Android / Play Store Readiness

This phase does **not** mean the app is ready to publish. It means frontend decisions will not block release later.

## App Identity

- [ ] Final app display name identified
- [ ] Android package name confirmed
- [x] App icon present
- [ ] Adaptive Android icon present
- [x] Splash experience present
- [x] No obvious development placeholder branding remains (preview wording is intentional for mock auth/payment)

## Permissions

- [ ] No unnecessary Android permissions requested
- [ ] Location permission, if later used, has contextual rationale
- [ ] Manual address/pincode path works without precise location
- [ ] Notification permission, if later used, is requested contextually
- [ ] App works when notification permission is denied
- [ ] Camera/photo permission is not requested at startup
- [ ] Modern picker strategy planned for profile photo if needed

## Privacy & Account Controls

- [ ] Privacy Policy route/link location planned
- [ ] Terms/Legal route/link location planned if applicable
- [ ] Support/contact is discoverable
- [ ] Logout is discoverable
- [ ] Account deletion UI location planned
- [ ] Account deletion does not falsely claim completion before backend exists
- [ ] Marketing vs transactional notification preference strategy identified
- [ ] No hidden sensitive-data collection UI

## Play Store Data Safety Dependencies

- [ ] Any analytics SDK planned for later is documented
- [ ] Any crash-reporting SDK planned for later is documented
- [ ] Any notification SDK planned for later is documented
- [ ] Any payment SDK planned for later is documented
- [ ] Any chat SDK planned for later is documented
- [ ] UI data collection matches what will eventually be declared in Data Safety

## Store Review UX

- [ ] App has a usable path even if optional permissions are denied
- [ ] No screen traps user behind optional permissions
- [x] No fake "payment complete" production claim (checkout explicitly labels preview payment)
- [x] No fake "account deleted" production claim (no deletion action exists)
- [x] Support/contact experience is understandable (preview limitations are explained in copy)
- [ ] Core features can be demonstrated during review
- [ ] Internal/demo debug copy can be removed/disabled for release builds

## Android Device Behavior

- [ ] Hardware back button QA
- [ ] Keyboard QA
- [ ] Safe-area/inset QA
- [ ] Small-screen QA
- [ ] App background/resume QA
- [ ] Network loss QA
- [ ] Slow image/loading QA

---

# Phase H — Pre-Admin Frontend Freeze QA

Before moving to admin-panel development:

- [ ] All Phase A items complete
- [ ] All Phase B items complete
- [ ] Architecture audit complete
- [ ] Navigation audit complete
- [ ] Localization audit complete
- [ ] Accessibility audit complete
- [ ] Android/Play Store frontend-readiness audit complete
- [ ] No intentional V1 customer screen remains missing
- [ ] No customer-visible placeholder screen remains
- [ ] No visible dead action remains
- [ ] No known high-severity UI defect remains

Verification:

```bash
npm run typecheck
npm run lint
npm run test   # when configured / applicable
```

- [x] Typecheck passes
- [x] Lint passes (no warnings or errors)
- [x] Relevant tests pass (not applicable: no test script or test files configured)
- [x] Any pre-existing unrelated failures documented (none; no test script exists)

> Freeze status remains open: Phase B device checks, Phase C service/list
> contract and list virtualization follow-up, Phase E English-only product
> descriptions/units/order snapshots, Phase F device accessibility checks, and
> Phase G release-readiness decisions remain unresolved. Phase A's existing
> completion marks were not re-exercised end-to-end during this pass.

---

# Frontend Freeze Definition

Only after all required items above are complete, mark:

```text
CUSTOMER FRONTEND PHASE 1: COMPLETE
```

At that point the next implementation sequence is:

```text
1. Admin Panel
2. Backend/API
3. Customer App API Wiring
4. Production Auth
5. Payments
6. Notifications / Messaging
7. Privacy & Account Deletion Backend
8. Play Store policy verification against current rules
9. Release build / internal testing
10. Production submission
```

Important:

Play Store policy details can change. Before actual submission, perform a fresh policy check against the current Google Play requirements rather than relying only on this development document.
