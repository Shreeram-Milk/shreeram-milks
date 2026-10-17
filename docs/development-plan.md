# ShreeRam Milks — Frontend Development Plan

Read this in full before wiring any screen to data, adding a dependency, or
touching state management. This defines HOW the app is built, not how it
looks (see `design-system.md` for that).

---

## 1. Stack

- **Framework**: Expo (React Native), TypeScript throughout — no `.js` files.
- **Navigation**: `expo-router` (file-based routing).
- **Server state / data-fetching**: TanStack Query (React Query).
- **Client-only state**: Zustand — NOT Redux.
- **i18n**: `react-i18next` + `expo-localization`.
- **Forms**: `react-hook-form`.

### Why Zustand over Redux
At this app's scope (auth session, cart contents, active language, a couple
of UI flags), Redux's boilerplate (actions, reducers, dispatch, slices) buys
nothing — it's more code to write, more code Codex has to keep consistent,
and more JS shipped to the phone. Zustand does the same job in a fraction of
the code and the fraction of the bundle size. Reach for Redux only if this
app later grows genuinely complex shared state across many unrelated
screens — it won't, at this scope.

**Rule of thumb for where state lives:**
- Comes from the API (products, orders, subscriptions, service areas) →
  TanStack Query. Never duplicate this into Zustand.
- Exists only on-device and isn't server data (cart-in-progress, active
  language, "has seen onboarding") → Zustand.

---

## 2. API / Data Layer

### 2.1 One API client, nowhere else

All HTTP calls go through a single typed client:
`frontend/src/services/apiClient.ts` — a thin wrapper around `fetch` or
`axios` with:
- `baseURL` read from `Constants.expoConfig.extra.apiUrl` (set per EAS build
  profile — see earlier proposal notes on `eas.json`)
- a request interceptor that attaches the auth token
- a response interceptor that maps backend error codes to the app's
  i18n error dictionary (see §4)

**No screen or component ever calls `fetch()` directly.** Every network call
goes through a function exported from `frontend/src/services/*.ts`
(`productService.ts`, `subscriptionService.ts`, `orderService.ts`, etc.),
and every one of those functions is wrapped in a TanStack Query hook
(`useProducts()`, `useSubscriptions()`, ...) rather than called ad hoc from
inside a component.

### 2.2 REST, not GraphQL

Backend is a REST API (Express). Don't introduce GraphQL, tRPC, or any other
API style — REST is the right level of complexity for this app's size and
matches the Express backend already being built.

### 2.3 Query conventions

- Every `useQuery` gets a sensible `staleTime` (products/service-areas
  rarely change — 5+ minutes; order status — 30 seconds or use polling only
  on the order-tracking screen specifically).
- Mutations (`useMutation`) always invalidate the specific query keys they
  affect, not the entire cache.
- Paginate list endpoints from day one (even with 5-6 products today) —
  `useInfiniteQuery` on the product list, so this doesn't need revisiting
  later.

---

## 3. Performance Rules

- **Lists**: `FlashList` (preferred) or `FlatList` — never `.map()` inside a
  `ScrollView` for anything that could grow (products, order history,
  delivery calendar).
- **Memoization**: `React.memo` on any list-item component (ProductCard,
  SubscriptionCard); `useCallback` for any function passed as a prop into a
  memoized child; `useMemo` for derived data computed from query results.
- **Images**: use `expo-image`, not the core `Image` component — it caches
  automatically and handles placeholder/blur-up. Product photos get
  compressed to WebP before upload (this also keeps the S3 bill down — see
  the AWS cost notes elsewhere in the project).
- **Navigation**: lazy-load heavy screens (checkout, admin-heavy screens)
  rather than bundling everything into the initial JS load.
- **Avoid inline functions in list renders** — `renderItem={(item) =>
  <Card onPress={() => ...} />}` recreates a function every render; extract
  it.

---

## 4. Error & Message Handling

Backend never sends user-facing text — it sends stable error codes
(`PINCODE_NOT_SERVICEABLE`, `SLOT_CUTOFF_PASSED`, `PAYMENT_FAILED`,
`NETWORK_ERROR`, etc.). The frontend maps codes to translated strings via
`frontend/src/locales/en.json` / `gu.json` under an `errors` key. See the
error-handling conversation in the project notes for the full rationale —
this keeps error display working even when the network itself is the
problem, and keeps Gujarati wording centralized instead of duplicated
per-screen.

---

## 5. Rate Limiting

This is primarily a **backend** concern, not frontend:
- Backend (Express): use `express-rate-limit` on public endpoints, especially
  OTP-send and login, to prevent abuse. This belongs in `backend/AGENTS.md`
  (not yet created — flag if you want this written up too).
- Frontend: debounce/throttle any input that triggers a request on every
  keystroke (pincode lookup, product search) — 300–500ms debounce, don't
  fire a request per character typed.

---

## 6. Verification (run before considering a task done)

```bash
npm run typecheck   # tsc --noEmit
npm run lint         # eslint
npm run test         # if tests exist for the touched area
```

Do not mark a task complete if any of these fail. If a command doesn't exist
yet in `package.json`, that's a signal to add it, not skip the check.
# ShreeRam Milks — API Safety, Authorization & Cost-Conscious Backend Brief

Give this file to Codex before real backend endpoint work starts (or as an
immediate follow-up if endpoints already exist — in that case, treat this as
a required audit pass over what's already written). It merges into
`development-plan.md` — once applied, add a short reference to this file from
`development-plan.md` §2 so future sessions know it exists.

This app handles subscriptions, payments, and personal delivery addresses for
real customers — "it works" is not the bar. "It works and a customer can't
touch another customer's data, and it doesn't quietly need a bigger AWS
instance in month two" is the bar.

---

## 1. Input validation — every endpoint, no exceptions

Every request body, query param, and route param gets validated with a
schema (use `zod`) before any handler logic runs. No endpoint trusts the
shape of what it received.

```ts
const createSubscriptionSchema = z.object({
  productId: z.string().uuid(),
  pincode: z.string().regex(/^\d{6}$/),
  slot: z.enum(['morning', 'evening']),
  quantityLiters: z.number().positive().max(10),
});
```

Reject with a `400` and a stable error code (`VALIDATION_ERROR`) on failure —
never let an unvalidated field reach a Prisma call or a response.

---

## 2. Authorization — not just authentication

This is the single most important thing in this file. **Being logged in is
not the same as being allowed to touch a specific record.** Every endpoint
that reads or modifies a specific resource (a subscription, an order, an
address) must check that the resource belongs to the requesting user —
not just that *a* valid user is making the request.

```ts
// WRONG — checks the user is logged in, not that it's THEIR subscription
app.post('/subscriptions/:id/cancel', requireAuth, async (req, res) => {
  await prisma.subscription.update({ where: { id: req.params.id }, data: { status: 'cancelled' } });
});

// RIGHT — scopes the query to the authenticated user
app.post('/subscriptions/:id/cancel', requireAuth, async (req, res) => {
  const sub = await prisma.subscription.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!sub) return res.status(404).json({ errorCode: 'NOT_FOUND' });
  await prisma.subscription.update({ where: { id: sub.id }, data: { status: 'cancelled' } });
});
```

Apply this pattern to every mutation and every "get my X" read endpoint:
subscriptions, orders, addresses, wallet balance, saved payment methods.
This is the standard IDOR (Insecure Direct Object Reference) vulnerability
class — it's easy to miss and easy to prevent if it's a checklist item from
day one rather than a bug found later.

Admin-panel endpoints need the inverse check: confirm the requester actually
has an admin role, not just any valid user token.

---

## 3. Secrets & auth tokens

- All secrets (DB connection string, JWT signing key, Razorpay keys) live in
  `.env`, never hardcoded, never committed — confirm `.env` is in
  `.gitignore` in both `backend/` and `frontend/`.
- JWTs: short-lived access token (e.g. 15 min) + longer-lived refresh token,
  not one long-lived token stored client-side indefinitely.
- Never log tokens, OTPs, or payment details — including in `console.log`
  during development. A debug log left in accidentally is how secrets leak
  into log files that then sit on the EC2 instance or get shipped to a
  logging service.

---

## 4. Rate limiting — tiered, not one blanket rule

`express-rate-limit`, applied per route group, not globally at one setting:

```ts
const otpLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 5 });   // strict — OTP/login
const generalLimiter = rateLimit({ windowMs: 60 * 1000, max: 60 });    // normal API traffic
```

OTP-send and login endpoints get the strict limiter — these are the ones
abused for spam/brute-force. General product/order endpoints get the looser
one. Don't rate-limit so tightly that a normal user hits it during regular
use.

---

## 5. CORS — locked to known origins

```ts
app.use(cors({ origin: ['https://admin.shreerammilks.com'], credentials: true }));
```

Never `origin: '*'` on an API handling payments and personal data. The
mobile app doesn't need CORS (native requests aren't browser-origin-
restricted) — this specifically protects the admin panel's API calls and
blocks arbitrary websites from calling your API using a logged-in
admin's browser session.

---

## 6. System design — stateless, so scaling later is a config change, not a rewrite

- The Express process must be **stateless** — no in-memory session storage,
  no in-memory cache of user data between requests. All state lives in
  Postgres (or Redis later, if ever needed). This is what makes it possible
  to later run 2 instances behind a load balancer without any code change,
  *if* the app ever outgrows one EC2 box — you're not building for that now,
  you're just not architecting yourself out of the option.
- Prisma's connection pool should be set deliberately, not left at default,
  since Postgres itself (on a `db.t4g.micro`) has a hard cap on total
  connections (roughly 85–100). Set `connection_limit` in the Prisma
  datasource URL to something conservative (e.g. 10) — a runaway pool on a
  small instance is a real way to take the DB down under even modest load.

---

## 7. Query patterns that keep the AWS bill where it's estimated to be

These aren't abstract best practices — on a `t4g.micro`/`db.t4g.micro` setup,
inefficient queries are what force an upgrade to a bigger (more expensive)
instance sooner than your actual user count would otherwise require.

- **No N+1 queries.** Fetching a list of orders and then looping to fetch
  each order's items separately is the single most common way a small
  instance's CPU gets hammered. Use Prisma's `include`:
  ```ts
  const orders = await prisma.order.findMany({
    where: { userId },
    include: { items: true },   // one query, not N+1
  });
  ```
- **Index the columns you filter on.** At minimum: `ServiceArea.pincode`,
  `Subscription.userId`, `Subscription.status`, `Order.userId`,
  `Product.deliveryScope`. An unindexed `WHERE` clause on a growing table
  is invisible at 60 users and painful (and CPU-expensive) well before you'd
  expect.
- **Always paginate** (already in `development-plan.md` §2.3 — reinforcing
  here because it's also a cost lever, not just a UX one: an unpaginated
  endpoint returning everything gets more expensive, not just slower, as
  data grows).
- **Don't poll aggressively.** Order-tracking screens should refetch on a
  reasonable interval (30–60s) or use push notifications for status
  changes, not a 2-second polling loop — that's continuous, avoidable load
  on both the API and the DB, all day, from every open app.
- **Enforce upload limits server-side.** The frontend compresses images
  before upload (per `development-plan.md` §3), but the backend must also
  reject oversized files (`multer` limits, e.g. 2MB max) — never trust the
  client to have actually compressed anything; this is what keeps S3
  storage and egress costs matching the original estimate.
- **Log level discipline in production.** `info`/`warn`/`error` only — no
  verbose per-request debug logging left on in production. Logs pile up on
  the EC2 instance's disk and, at high enough volume, both consume storage
  and add CPU overhead for no operational benefit.

---

## 8. Acceptance checklist

- [ ] Every endpoint validates its input with a schema before touching
      business logic
- [ ] Every "get/update/delete a specific resource" endpoint scopes its
      query to the authenticated user (or checks admin role) — no IDOR gaps
- [ ] No secret, token, or OTP ever appears in a log statement
- [ ] `.env` confirmed in `.gitignore`, both `backend/` and `frontend/`
- [ ] Rate limiting is tiered — strict on auth/OTP, normal elsewhere
- [ ] CORS origin list is explicit, never `*`
- [ ] Prisma connection pool size is explicitly set, not left at default
- [ ] No N+1 query patterns — relational fetches use `include`/`select`
- [ ] Indexes exist on every column used in a `WHERE` filter in a hot path
- [ ] Upload size limits enforced server-side, not just client-side
- [ ] No polling interval under ~30s anywhere in the app
- [ ] Production log level is `info` or higher, not `debug`