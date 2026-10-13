# AGENTS.md — ShreeRam Milks Engineering Rules

This file is written for coding agents such as Codex, Claude Code, Cursor, and similar tools.

Read this file **in full before writing, editing, moving, deleting, or generating code in this repository during every session.**

These rules are mandatory unless the human explicitly overrides a rule for a specific task.

Also read `STORE-COMPLIANCE.md` (App Store and Google Play rules and our status against them) before adding anything that collects data, asks a permission, takes payment, sends notifications or shows staff-written content.

Also read `PERFORMANCE-AND-AWS.md` (speed, caching, pictures, AWS and scaling standards) before changing anything that loads data or pictures.

Do not weaken, bypass, reinterpret, or silently ignore these rules just to complete a task faster.

---

# 1. PROJECT CONTEXT

ShreeRam Milks is currently being developed **frontend-first**.

Current application:

- Expo
- React Native
- TypeScript
- Expo Router
- TanStack Query
- Zustand
- react-i18next
- React Hook Form
- centralized theme/design tokens
- mock JSON data during frontend development

The application intentionally has two development phases.

## Phase 1 — Frontend / Mock Data

The UI is being built using mock data.

There may be:

- no production database
- no production API
- no real authentication backend
- no real payment backend

This does NOT mean architecture may be temporary or careless.

Mock data must behave as a simulation of the future API.

## Phase 2 — Real API / Database

Phase 2 begins when:

`src/services/apiClient.ts`

performs real HTTP requests to the backend.

At that point, Phase 2 API/database/security rules become mandatory.

---

# 2. DETERMINE THE PHASE BEFORE CODING

Before implementing a task, inspect:

`src/services/apiClient.ts`

If it is still a stub and services return local mock data:

**PHASE 1**

If it performs real HTTP requests:

**PHASE 2**

Never implement Phase 2 infrastructure during Phase 1 unless the human explicitly asks for it.

Never regress Phase 2 code back to mock-only behavior.

---

# 3. REQUIRED DOCUMENTATION

Before making relevant changes, read:

`docs/design-system.md`

for:

- colors
- typography
- spacing
- radii
- sizes
- visual hierarchy
- component architecture
- UI conventions

Read:

`docs/development-plan.md`

for:

- application architecture
- data flow
- state management
- services
- TanStack Query
- performance
- API conventions
- error handling
- backend expectations

If documentation conflicts with this `AGENTS.md`, this file takes precedence.

---

# 4. ARCHITECTURE IS NON-NEGOTIABLE

The expected data flow is:

```text
SCREEN
  ↓
COMPONENT
  ↓
HOOK
  ↓
SERVICE
  ↓
MOCK DATA                 Phase 1

or

SCREEN
  ↓
COMPONENT
  ↓
HOOK
  ↓
SERVICE
  ↓
API CLIENT
  ↓
BACKEND
  ↓
DATABASE                  Phase 2
```

Do not bypass layers for convenience.

## Forbidden

Do NOT create:

```text
Component → mock JSON
Component → fetch()
Component → apiClient
Component → database

Hook → mock JSON
Hook → database

Screen → mock JSON
Screen → direct HTTP request
```

A feature is NOT considered correctly implemented merely because it visually works.

It must also respect the architecture.

---

# 5. RESPONSIBILITY OF EACH LAYER

## Screens

Screens compose features and page layouts.

Screens should not contain:

- HTTP implementation
- database logic
- mock imports
- complex business logic
- response transformation logic

## Components

Components:

- render UI
- receive typed props
- dispatch user events

Components must not know whether data came from:

- mock JSON
- API
- cache
- database

## Hooks

Hooks manage:

- TanStack Query
- mutations
- caching
- invalidation
- loading state
- asynchronous state coordination

Hooks must not import mock JSON.

## Services

Services own the application's external-data contract.

Services:

- expose typed functions
- receive explicit parameters
- return domain/API types
- surface predictable errors

Phase 1 services may read mock data.

Phase 2 services call `apiClient`.

## apiClient

`apiClient` owns HTTP transport concerns.

Examples:

- base URL
- HTTP methods
- headers
- authentication headers
- serialization
- response parsing
- transport errors
- timeouts

Feature-specific business logic does not belong in `apiClient`.

---

# 6. PHASE 1 — MOCK DATA RULES

Mock data is NOT disposable UI fixture data.

Mock data represents the expected backend contract.

Treat mock shapes as load-bearing.

## Rule 1 — Mock imports

Only files inside:

`src/services/`

may import:

`src/mock-data/`

Never import mock JSON directly from:

- screens
- components
- hooks
- stores
- utilities

---

## Rule 2 — Models are the source of truth

Define domain/API models in:

`src/types/models.ts`

or an appropriate domain-specific type file if the project later splits models by feature.

Design the type based on what the real application should receive from the backend.

Do NOT design types merely around what happens to be convenient in the mock JSON.

If mock JSON conflicts with the correct model:

**fix the mock data.**

Do not weaken the model.

---

## Rule 3 — Design service signatures for the real API

Every service function should already have approximately the interface it will need when the real backend exists.

Example:

Prefer:

```ts
getProducts({
  pincode,
  categoryId,
  page,
  limit,
});
```

over:

```ts
getProducts();
```

if the real feature logically requires those parameters.

The mock implementation may temporarily ignore a parameter.

The public service contract should not.

---

# 7. PHASE 1 IMPLEMENTATION ORDER

When implementing a data-driven feature, prefer this order:

```text
1. Domain model/type
2. Service contract
3. Mock data
4. Query/mutation hook
5. UI component
6. Screen integration
```

Do not start by hardcoding data inside the screen and move it later.

---

# 8. MOCK DATA MUST BE REALISTIC

Mock data should represent realistic production scenarios.

Where relevant include:

- normal records
- empty results
- optional fields
- unavailable items
- disabled states
- long names
- multiple records
- boundary values

Do not create unrealistic mock structures merely to make UI implementation easier.

---

# 9. USER-FACING COPY MUST USE I18N

Do not hardcode user-facing text directly in components or screens.

Use:

`react-i18next`

with translation resources such as:

`src/locales/en.json`

`src/locales/gu.json`

This includes:

- titles
- labels
- buttons
- placeholders
- empty states
- validation messages
- errors
- dialogs
- temporary screens
- onboarding copy

Placeholder screens are not exempt.

---

# 10. DESIGN SYSTEM RULES

Never hardcode design values when an appropriate token exists.

Use tokens from:

`src/theme/`

for:

- colors
- spacing
- typography
- font sizes
- font weights
- radii
- component sizes
- opacity
- z-index

Do not create arbitrary values simply because they visually approximate a design.

If a required reusable token does not exist, add it to the appropriate theme file instead of repeatedly hardcoding it.

---

# 11. COMPONENT ARCHITECTURE

Follow:

```text
atoms
  ↓
molecules
  ↓
organisms
  ↓
screens
```

### Atoms

Small reusable primitives.

Examples:

- Button
- Text
- Icon
- Input
- Badge

### Molecules

Small combinations of atoms.

### Organisms

Larger reusable sections.

### Screens

Route-level composition.

Do not create a new abstraction only because a component contains several lines of JSX.

Create reusable components when there is a real reusable responsibility.

---

# 12. TYPESCRIPT RULES

TypeScript is mandatory.

Do not introduce `.js` files for application code.

Never use:

```ts
any
```

as a shortcut.

Do not use:

```ts
@ts-ignore
```

to hide a problem.

Do not use:

```ts
@ts-expect-error
```

unless there is a legitimate documented compatibility issue and no correct typed alternative.

Prefer:

- explicit domain types
- discriminated unions
- narrow interfaces
- typed service responses
- typed errors

Do not weaken TypeScript configuration to make code compile.

---

# 13. ONE FUNCTION — ONE RESPONSIBILITY

Keep responsibilities separated.

Example:

Service:

```text
fetch / obtain / validate data
```

Hook:

```text
cache / stale state / mutation / invalidation
```

Component:

```text
render / interaction
```

Do not create giant functions that fetch, transform, cache, mutate state, navigate, and render behavior together.

---

# 14. STATE MANAGEMENT

Use:

**TanStack Query**

for server/external data.

Use:

**Zustand**

for client-only shared state.

Use local React state when state only belongs to one component or screen.

Do NOT introduce Redux.

Do not copy TanStack Query server data into Zustand without a genuine architectural reason.

Do not create two sources of truth for the same data.

---

# 15. LISTS

For potentially growing/repeated collections use:

- FlatList
- FlashList when appropriate

Do not render large/growing collections using:

```tsx
<ScrollView>
  {items.map(...)}
</ScrollView>
```

Small fixed UI groups are exempt.

---

# 16. DEPENDENCY DISCIPLINE

Before installing ANY package:

1. inspect `package.json`
2. check whether an existing dependency already solves the problem
3. check whether React Native/Expo/platform APIs already solve it
4. consider whether a small local implementation is simpler

Do not install a package for something that can reasonably be implemented in roughly 20 lines of maintainable code.

Do not add competing libraries for the same responsibility.

Examples:

Do not add:

- another server-state library beside TanStack Query
- another global-state library beside Zustand
- another i18n library
- another form library without a real requirement

---

# 17. APP SIZE DISCIPLINE

Import only what is required.

Prefer:

```ts
import { Something } from 'library';
```

where supported instead of importing a large namespace unnecessarily.

Do not embed base64 images in source code.

Use proper asset files.

Prefer optimized formats such as WebP when appropriate.

Do not add unnecessary font families or weights.

Only use fonts represented by the design system.

---

# 18. MINIMAL-CHANGE RULE

Make the smallest correct change that fully solves the requested task.

Do NOT automatically:

- refactor unrelated files
- rename unrelated components
- reorganize directories
- replace established architecture
- rewrite working code
- introduce abstractions for hypothetical future requirements
- modify unrelated service contracts
- install unnecessary packages
- perform cleanup unrelated to the requested task

Follow existing project patterns whenever they are correct.

Do not turn a feature task into a repository-wide refactor.

---

# 19. DO NOT DUPLICATE EXISTING IMPLEMENTATIONS

Before creating a new:

- component
- hook
- service
- utility
- type
- store
- helper
- theme token

search the repository for an existing implementation.

Extend/reuse existing code when appropriate.

Do not create:

`Button2`

`NewButton`

`CustomButton`

or equivalent duplicates because finding the existing component was inconvenient.

---

# 20. NEVER FAKE IMPLEMENTATION

Do not make unfinished functionality appear complete.

Never:

- hardcode successful responses
- return fake API success
- silently swallow failures
- hide errors just to keep the UI working
- hardcode user/account data as if authenticated
- disable validation
- disable TypeScript rules
- disable ESLint rules simply to make checks pass
- claim an API is connected when it is not
- claim tests passed when they were not executed

If required infrastructure is missing, clearly state what remains unavailable.

---

# 21. ERROR HANDLING

Do not silently swallow errors.

User-facing errors should eventually flow through the project's centralized error-handling conventions.

Avoid exposing:

- stack traces
- raw HTTP errors
- internal database errors
- implementation details

to users.

Do not create a new error format for every feature.

---

# 22. PHASE 2 — API RESPONSE VALIDATION

Once real HTTP APIs are connected:

Validate external API responses using Zod inside the service layer before data reaches hooks/components.

Expected flow:

```text
API
 ↓
apiClient
 ↓
service
 ↓
Zod validation
 ↓
typed result
 ↓
hook
 ↓
component
```

A service returns valid typed data or throws a typed error.

Do not use:

```ts
return null;
```

or:

```ts
return undefined;
```

to silently indicate request failure.

---

# 23. PHASE 2 — QUERY RULES

When database/API implementation exists:

Never use:

```sql
SELECT *
```

Select only required columns.

Never perform an N+1 query pattern.

Do not perform database/API requests inside loops when the operation can be batched.

Use:

- joins
- batched queries
- `WHERE ... IN (...)`
- aggregate queries

as appropriate.

---

# 24. PAGINATION FROM DAY ONE

Every potentially growing list endpoint must support pagination from its first real implementation.

Use:

- cursor pagination

or:

- offset + limit

depending on the use case.

Do not build an endpoint that loads an unlimited table and plan to "add pagination later."

---

# 25. DATABASE INDEXES

When introducing queries that regularly:

- filter
- sort
- join
- search

on a database column, evaluate whether the column requires an index.

When an index is required, add it in the same change as the query.

Do not knowingly introduce expensive queries and postpone the required index.

---

# 26. SERVER-SIDE AUTHORIZATION

Frontend restrictions are NOT authorization.

The backend must verify access to protected resources.

Never trust:

- hidden buttons
- disabled screens
- client-provided user IDs
- client-provided role claims

as authorization.

User-owned data must be scoped to the authenticated user server-side.

Administrative operations must verify authorization server-side.

---

# 27. VALIDATION

Once backend/API implementation begins:

Use Zod for request validation.

Validate:

- params
- query parameters
- request bodies
- environment/config values where appropriate

Never trust client input.

---

# 28. DESTRUCTIVE ACTIONS

Never implement hard deletion by default.

Prefer:

- `deleted_at`
- `is_active`
- equivalent soft-delete mechanisms

unless the human explicitly requests hard deletion.

Never casually generate:

```sql
DROP TABLE
DROP COLUMN
TRUNCATE
DELETE FROM table
```

or other destructive operations.

A destructive migration must be explicitly requested.

---

# 29. MIGRATIONS

The agent may write migration files when required.

The agent must NOT execute a migration against a live production database unless the human explicitly instructs and authorizes that exact action.

Migration changes should exist as committed/reviewable files.

If fixing a problem appears to require deleting production data, stop and explain the requirement instead of deleting data automatically.

---

# 30. FINANCIAL DATA

When monetary operations are introduced:

Store money using integer minor units.

For INR:

```text
₹10.50 = 1050 paise
```

Do not use floating-point values for authoritative financial calculations.

Operations that change financial state must use database transactions where atomicity is required.

Examples:

- payment + order state
- refunds
- wallet/credit adjustments
- invoice totals
- financial ledger changes

---

# 31. PAYMENTS AND WEBHOOKS

When payments/webhooks are implemented:

Require:

- webhook signature verification
- idempotency
- server-side payment verification
- safe retry handling
- transactional financial updates

Never trust payment success sent only by the client.

Never expose payment secrets in the mobile application.

---

# 32. PUBLIC ENVIRONMENT VARIABLES

Anything using:

```text
EXPO_PUBLIC_*
```

must be considered public information.

Never store secrets in an `EXPO_PUBLIC_*` variable.

Examples of acceptable public configuration:

```text
EXPO_PUBLIC_API_URL
EXPO_PUBLIC_DATA_SOURCE
```

Examples of secrets that must remain server-side:

```text
DATABASE_URL
JWT_SECRET
REFRESH_TOKEN_SECRET
RAZORPAY_KEY_SECRET
AWS_SECRET_ACCESS_KEY
```

---

# 33. REQUEST DISCIPLINE

Never perform API/database requests inside:

```ts
.map()
```

or loops when they can be batched.

Do not manually refetch data that TanStack Query already manages.

Prefer targeted:

```ts
queryClient.invalidateQueries(...)
```

after mutations.

Use optimistic updates when appropriate and safe.

Do not automatically perform an extra GET after every mutation merely to confirm success.

---

# 34. SEARCH / TYPING REQUESTS

Anything that can trigger a network request from user typing should be debounced where appropriate.

Examples:

- search
- address autocomplete
- product suggestions

Do not fire an API request for every keystroke.

---

# 35. API COMPOSITION

If a screen repeatedly requires several related datasets, consider whether the backend contract should provide an appropriate combined endpoint.

Do not automatically create many client requests when one backend query can provide the screen's required data efficiently.

Do not create overly broad "return everything" endpoints either.

Design endpoints around actual use cases.

---

# 36. NO SECRETS IN CLIENT CODE

Never place server secrets in:

- React Native source
- Expo configuration exposed to the bundle
- Git repository
- mock files
- client environment variables

Assume users can inspect the compiled mobile application.

Authorization and sensitive operations belong on the server.

---

# 37. FILE SIZE / COMPLEXITY

Do not split files merely because they cross an arbitrary line count.

Split when a file has multiple responsibilities or becomes difficult to reason about.

Extract:

- reusable components
- business logic
- hooks
- service logic
- validation
- utilities

when those responsibilities become independently meaningful.

Avoid both:

- giant monolithic screens

and:

- excessive tiny files with no meaningful responsibility.

---

# 38. COMMENTS

Prefer clear code over comments explaining confusing code.

Use comments for:

- non-obvious decisions
- platform workarounds
- external constraints
- important invariants

Do not add comments that merely repeat the code.

Do not leave large blocks of commented-out code.

Git already provides history.

---

# 39. CONSOLE OUTPUT

Do not leave:

```ts
console.log()
```

in committed production code.

If logging infrastructure exists, use the established logger.

Never log:

- passwords
- OTPs
- tokens
- payment secrets
- authorization headers
- sensitive user information

---

# 40. CONTRACT CHANGES

Treat these as contracts:

- service signatures
- model types
- hook return shapes
- reusable component props
- API response shapes
- query keys

Before changing a contract:

1. search for all consumers
2. understand the impact
3. update affected consumers
4. avoid breaking unrelated features

Do not silently change shared behavior as part of an unrelated fix.

---

# 41. FORM LIFECYCLE

Forms should have explicit:

- initial state
- validation
- submission state
- error state
- success behavior

Prevent duplicate submissions while a mutation is already in progress.

Do not rely solely on UI validation once a backend exists.

The backend must validate independently.

---

# 42. DESTRUCTIVE UI ACTIONS

For destructive user actions such as:

- removing an address
- cancelling a subscription
- deleting/deactivating a record
- irreversible account actions

require clear confirmation when appropriate.

When the record may have dependencies, check those dependencies before allowing the destructive operation.

Do not hide destructive consequences from the user.

---

# 43. ACCESSIBILITY

When implementing UI, preserve basic accessibility.

Use appropriate:

- labels
- roles
- touch targets
- readable contrast
- semantic states

Interactive elements must be identifiable and usable.

Do not sacrifice accessibility merely to match a screenshot visually.

---

# 44. LOADING / EMPTY / ERROR STATES

Data-driven screens should consider:

```text
loading
success
empty
error
```

Do not design only the successful populated state.

Do not show misleading empty-state UI while a request is still loading.

---

# 45. DO NOT GUESS PRODUCT REQUIREMENTS

If a design/task clearly defines expected behavior, implement it.

If an important product decision is genuinely ambiguous and choosing incorrectly could alter:

- stored data
- payment behavior
- authentication
- destructive behavior
- shared contracts

ask the human.

Do not invent consequential business rules.

For small implementation details that do not change product behavior, follow existing project conventions instead of blocking unnecessarily.

---

# 46. VERIFICATION BEFORE COMPLETION

Before reporting a coding task complete, inspect `package.json` and run all applicable existing verification commands.

At minimum, when available:

```bash
npm run typecheck
npm run lint
```

If a test script exists:

```bash
npm run test
```

Do NOT claim:

- typecheck passed
- lint passed
- tests passed
- build passed

unless that command was actually run successfully.

If a command fails because of pre-existing unrelated issues, report that accurately.

Do not modify unrelated code simply to hide unrelated verification failures.

---

# 47. TESTING

Do not create meaningless tests solely to increase test count.

Prioritize tests for behavior where regressions matter.

Examples:

- authentication
- validation
- service contracts
- cart calculations
- checkout
- subscriptions
- delivery scheduling
- payment behavior
- error mapping
- important state transitions

Visual-only components do not automatically require tests unless their behavior warrants them.

---

# 48. SECURITY MUST NOT BE "FIXED LATER"

Once Phase 2 begins, these are implementation requirements rather than optional future cleanup:

- server-side authorization
- request validation
- safe secret handling
- payment verification
- webhook verification
- idempotency
- financial transactions
- rate limiting where abuse is possible
- pagination
- required database indexes

Do them correctly when the relevant feature is first introduced.

---

# 49. DO NOT OVERENGINEER

This application does not require enterprise infrastructure merely because enterprise patterns exist.

Do not introduce without a demonstrated requirement:

- microservices
- Kubernetes
- Kafka
- service mesh
- complex event-driven architecture
- distributed caching layers
- elaborate repository patterns
- unnecessary abstraction layers

Prefer a simple architecture that is correct, secure, maintainable, and appropriate for the application's actual scale.

---

# 50. FINAL AGENT CHECKLIST

Before completing ANY task, verify:

```text
[ ] I determined whether the repository is in Phase 1 or Phase 2.

[ ] I read the relevant project documentation.

[ ] I followed the existing architecture.

[ ] No screen/component imports mock data directly.

[ ] No component performs direct HTTP requests.

[ ] I reused existing components/hooks/services where appropriate.

[ ] I did not introduce unnecessary dependencies.

[ ] I did not use `any` as a shortcut.

[ ] I did not leave console.log debugging.

[ ] User-facing text uses i18n.

[ ] UI values use design-system tokens where applicable.

[ ] Loading/error/empty states were considered where relevant.

[ ] I did not hardcode fake success behavior.

[ ] I did not expose secrets.

[ ] I did not perform unrelated refactoring.

[ ] Shared contracts were not changed accidentally.

[ ] TypeScript verification was run if configured.

[ ] Lint verification was run if configured.

[ ] Tests were run if configured and relevant.

[ ] I accurately reported anything that could not be verified.
```

---

# CORE PRINCIPLE

Build Phase 1 so Phase 2 replaces the data source — not the application architecture.

A well-designed frontend should allow:

```text
mock service implementation
          ↓
real API service implementation
```

without requiring screens and components to be rewritten.

Correct architecture is part of completing the task.

Working UI alone is not enough.