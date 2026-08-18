---
name: test-workflow
description: >
  Master workflow for implementing any of the 7 Final Test automation scenarios in this
  Playwright + TypeScript project. Use this skill whenever the user says "implement scenario
  N", "write the test for X", "make scenario N pass", or describes any of the 7 test cases
  below — even if they just say "do scenario 3" or "help me with the cart test". This skill
  drives the full implementation cycle from understanding the requirement through to a
  passing automated test, coordinating all other project skills (test-scenario,
  locator-strategy, playwright-pom, test-data, api-seeding, test-review) in the right order.
  Never skip directly to coding — always follow the phases in order.
---
# test-workflow

This skill drives every Test scenario from requirement to passing automated test.
The user provides only a scenario number or short description. This skill handles everything
else: analysis, exploration, planning, implementation, execution, and review.

---

## The 7 Test Scenarios

| # | Scenario                                                      | Type                 |
| - | ------------------------------------------------------------- | -------------------- |
| 1 | Login fails when username and password are both blank         | UI — negative       |
| 2 | Add a single product to cart — verify quantity and cart page | UI — happy path     |
| 3 | Add the same product twice — quantity increments correctly   | UI — edge case      |
| 4 | Remove item from cart — one item and multiple items          | UI — state change   |
| 5 | Checkout succeeds with valid receiver info (COD)              | UI — end-to-end     |
| 6 | Update Full Name, then clean up via API                       | UI + API — advanced |
| 7 | Verify Orders page (seed order via API)                       | API + UI — advanced |

**Target application:** `https://testing.platformforge.dev`
**Credentials (from `.env`):** `USERNAME=admin` / `PASSWORD=password123`

---

## Phase 1 — Understand

### 1.1 Identify the scenario

Map the user's request to one of the 7 scenarios above. Confirm with the user if ambiguous.

### 1.2 Produce a scenario document

Read and follow the **test-scenario** skill. Use it to generate a structured scenario
document that captures:

- Preconditions
- Test data requirements
- API setup/teardown (if any)
- Numbered UI steps
- Assertions
- Expected validation messages

Do not proceed to implementation until the scenario document is complete.

### 1.3 Inspect the existing repository

Before writing a single line of code, scan what already exists:

```
pages/          ← existing Page Object classes
tests/          ← existing spec files
utils/          ← ApiClient, custom fixtures, helpers
data/           ← JSON test data files
fixtures/       ← custom fixture definitions
api/            ← API helper modules
playwright.config.ts
package.json
.env
```

Ask yourself for each item you are about to create:

- Does a matching Page Object already exist in `pages/`?
- Does the test data already exist in `data/`?
- Does an API helper method already exist in `utils/ApiClient.ts`?
- Does a fixture already exist in `fixtures/`?

**Never create duplicates.** Reuse everything that already exists.

---

## Phase 2 — Explore the Application

### For UI scenarios (1–6):

Read and follow the **locator-strategy** skill throughout this phase.

1. Use Playwright MCP (`browser_navigate`) to open the target application.
2. Navigate to the page(s) involved in the scenario.
3. Take accessibility snapshots (`browser_snapshot`) — never guess at structure.
4. For each interactive element you need to drive in the test, identify:
   - Its ARIA role and accessible name
   - A validated, stable Playwright locator (prefer `getByRole` > `getByLabel` > `getByPlaceholder` > `getByTestId` > `getByText` > CSS)
   - Whether it is unique on the page
5. Identify all expected validation messages and confirmation text that will become assertions.
6. Map the full navigation path between pages (URLs and what triggers each transition).

**Do not write any locators from memory or assumption.** Every locator must be confirmed
against the live accessibility tree before it is used in a Page Object.

### For API scenarios (6–7):

Read and follow the **api-seeding** skill.

1. Fetch the API documentation: `GET https://testing.platformforge.dev/api-docs`
2. Identify the exact endpoint, method, headers, and body for each required operation.
3. Confirm the response shape, especially any ID fields needed for cleanup.
4. Never guess endpoint paths or request bodies.

---

## Phase 3 — Plan

Before writing any code, produce an explicit plan that answers every question below.
This prevents mid-implementation surprises.

### Page Objects

- Which pages need a new Page Object class?
- Which existing Page Objects need a new method?
- What are the exact method signatures?

### Locators

- What is the validated locator expression for every element the test interacts with?
- Are all locators confirmed unique against the live page?

### Test Data

- What JSON test data is required?
- Does it already exist in `data/`? If not, which file and structure will hold it?
- Read and follow the **test-data** skill for data file conventions.

### API Setup and Cleanup

- Which API calls are required in `beforeAll` / `beforeEach`?
- Which API calls are required in `afterAll` / `afterEach`?
- Does `utils/ApiClient.ts` already have the needed methods?

### Hooks

- Which hook scope is appropriate (`beforeAll` vs `beforeEach`, `afterAll` vs `afterEach`)?

### Assertions and verification methods

- What is the complete set of things to verify after the scenario runs?
- For each: what is the business-level name for the verification method on the Page Object?
- The `expect()` calls and expected message strings belong in the Page Object, not in the test.

### Reuse

- Confirm no new file duplicates an existing one.

---

## Phase 4 — Implement

Follow the **playwright-pom** skill for all implementation decisions.

### Page Objects (`pages/`)

**File naming:** kebab-case for files, PascalCase for classes.

| File | Class |
|---|---|
| `pages/login-page.ts` | `LoginPage` |
| `pages/product-page.ts` | `ProductPage` |
| `pages/cart-page.ts` | `CartPage` |
| `pages/checkout-page.ts` | `CheckoutPage` |
| `pages/orders-page.ts` | `OrdersPage` |

Never use PascalCase filenames (`LoginPage.ts`, `ProductPage.ts`, etc.).

**Contents:**
- Locators as `private readonly` properties.
- Interaction methods (`login()`, `addToCart()`, `fillForm()`).
- Navigation helpers (`goto()`).
- **All `expect()` calls** — assertions live here, never in test files.
- **All business-level verification methods** that encapsulate locators, `expect()` calls, and expected UI text:

```typescript
async verifyBlankCredentialError()      // hides error text + expect() inside
async verifyCartQuantity(n: number)     // hides locator + expect() inside
async verifyCheckoutSuccess()           // hides URL check inside
```

- Expected UI message strings — store them as `private` constants in the class, never in test files.
- `import { expect } from '@playwright/test'` at the top of the Page Object file.

### Test File (`tests/`)

- `import { test } from '@playwright/test'` — **do not import `expect`**.
- Import Page Objects using kebab-case paths: `from '../pages/login-page'`.
- `test.describe` block groups the scenario.
- `beforeAll` / `beforeEach` for setup; `afterAll` / `afterEach` for cleanup.
- Each `test` block expresses a business scenario: setup → action → call a Page Object verification method.
- **No `expect()` in test files.** No expected message strings. No raw locators used for assertions.

### Test Data (`data/`)

- All dynamic values (credentials, names, addresses, quantities) come from JSON files in `data/`.
- Follow the **test-data** skill for file naming and import conventions.
- Hard-coded literals in test files are a defect.

### API Helpers (`utils/ApiClient.ts`)

- Follow the **api-seeding** skill.
- All API calls go through `ApiClient.ts`, never inline in test specs.
- Reuse existing methods; add new ones only when needed.

### Project configuration

- Base URL comes from `process.env.BASE_URL` (already wired in `playwright.config.ts`).
- Credentials come from `process.env.USERNAME` / `process.env.PASSWORD` or `data/` files.
- Never hard-code URLs, credentials, or environment-specific values in code.

---

## Phase 5 — Execute

### Run the test

```bash
npx playwright test tests/<spec-file>.spec.ts --headed
```

Or for a specific test:

```bash
npx playwright test tests/<spec-file>.spec.ts -g "<test name>" --headed
```

### If the test fails

1. Read the full error message and stack trace.
2. Determine whether the failure is:
   - **A locator issue** → open Playwright MCP, navigate to the failing page, take a fresh `browser_snapshot`, re-validate the locator.
   - **An assertion mismatch** → confirm the expected text/state against the live application.
   - **A timing issue** → add an appropriate `await expect(...).toBeVisible()` before the action.
   - **An API/setup issue** → re-read the API docs and verify the request/response.
3. Fix only the root cause — do not patch symptoms.
4. Re-run the test after every fix.

**A scenario is not complete until its automated test passes with exit code 0.**

---

## Phase 6 — Review

After the test passes, read and follow the **test-review** skill.

Specifically check each item below. Every FAIL must be fixed and the test re-run.

**Assertion separation (highest priority):**
- No `expect()` import or call exists anywhere in the test file.
- No expected UI message strings exist in the test file.
- No raw locators are used for verification in the test file.
- Page Objects contain verification methods (`verifyX()`) that own all `expect()` logic.

**File naming:**
- Every Page Object file uses kebab-case (`login-page.ts`, not `LoginPage.ts`).
- Every Page Object class uses PascalCase (`LoginPage`).
- Test file imports match the kebab-case filename.

**POM structure:**
- Locators are `private readonly` properties in the Page Object.
- Interaction methods and verification methods are the only public surface.
- `import { expect } from '@playwright/test'` appears in the Page Object, not the test.

**Test readability:**
- Each `test` block reads as a plain-language business scenario.
- No implementation details (locators, message text, `expect`) are visible in the test.

**General quality:**
- Locator quality: semantic locators used; no brittle CSS classes or XPaths without justification.
- Test independence: each test runs in isolation; no shared mutable state.
- Test data: all values from `data/` JSON; no literals in test files.
- Hooks: correct scope (beforeAll vs beforeEach); cleanup always runs.
- API setup/cleanup: API calls used where appropriate; no UI navigation for setup.
- No duplicated Page Objects, utilities, or data files.
- No `page.waitForTimeout()`.

Fix only confirmed issues and re-run the affected test after each fix.

---

## Important Rules

These rules apply to every scenario. Violating any of them is a defect in the implementation.

1. **Do not blindly generate code.** Every implementation decision must be grounded in
   observed evidence from the live application or the existing codebase.
2. **Do not guess locators.** Every locator must be validated against the live accessibility
   tree via Playwright MCP before being written into a Page Object.
3. **Do not guess API contracts.** Every API call must be derived from the API documentation,
   not from naming conventions or assumptions.
4. **Do not put `expect()` in test files.** All assertions belong in Page Object verification
   methods. A test file that imports or calls `expect()` is wrong.
5. **Do not put expected UI message strings in test files.** They belong in the Page Object
   (or `data/` if the same message is used across multiple scenarios).
6. **Use kebab-case for Page Object files.** `login-page.ts` not `LoginPage.ts`.
7. **Do not create duplicate Page Objects.** Check `pages/` before creating any new class.
8. **Do not create unnecessary files.** If an operation needs only one line, it doesn't need
   a helper file.
9. **Do not modify unrelated tests.** Changes must be scoped to the scenario being implemented.
10. **Always inspect existing code before creating new code.** Scan all existing files in
    `pages/`, `utils/`, `data/`, and `fixtures/` before writing anything new.
11. **Always run the test after implementation.** The scenario is not done until the test passes.
12. **A scenario is not complete until its automated test passes.** "Looks right" is not enough.

---

## Quick-reference: which skills to use and when

| Phase                             | Skill to invoke                                 |
| --------------------------------- | ----------------------------------------------- |
| Scenario analysis                 | **test-scenario**                         |
| Exploring UI and finding locators | **locator-strategy** (via Playwright MCP) |
| Exploring API contracts           | **api-seeding**                           |
| Building Page Objects and tests   | **playwright-pom**                        |
| Structuring test data files       | **test-data**                             |
| Implementing API setup/cleanup    | **api-seeding**                           |
| Post-pass quality review          | **test-review**                           |
