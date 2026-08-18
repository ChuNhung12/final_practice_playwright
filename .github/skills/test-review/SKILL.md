---
name: test-review
description: >
  Reviews this Playwright + TypeScript automation project against the Final Test rubric and
  produces a structured PASS/FAIL report covering tech stack, framework requirements, and
  scenario coverage. Use this skill whenever the user asks to review, audit, check, or grade
  the project; wants to know if the project is ready for submission; asks what's missing or
  incomplete; wants a quality check before the final test; or says anything like "is my project
  done", "review my tests", "what do I still need to implement", or "am I ready". This skill
  reads and analyses — it never modifies code unless the user explicitly asks.
---

# test-review

This skill audits the project against the Final Test rubric and reports findings clearly.
The goal is to give an honest, complete picture of readiness: what passes, what fails, what
is partially done, and what to fix — without touching any files.

---

## How to conduct the review

Work through the five sections below in order. For each item, read the relevant files and
make a judgment based on what is actually present in the code — not on what the user says
is there. When in doubt, mark the item as FAIL or PARTIAL and explain what you found.

---

## Section 1: Tech stack

Check each of the following. Read the files listed — do not assume anything is configured
without verifying.

### 1.1 Playwright + TypeScript

Files to read: `package.json`, `tsconfig.json` (if present), `playwright.config.ts`

- `@playwright/test` is listed in `devDependencies`
- TypeScript is configured (`tsconfig.json` exists, or `ts-node`/`tsx` is in use)
- `playwright.config.ts` uses `defineConfig` from `@playwright/test`

### 1.2 TDD (Test-Driven Development)

Files to read: all `tests/*.spec.ts` files and their corresponding `pages/*.ts` files

TDD is evidenced by:
- Test files exist and define the behaviour before (or alongside) the page objects
- Page objects are minimal — they expose exactly what the tests need, no more
- There is no page object that has no corresponding test exercising it

If you cannot determine order of creation from the files, check for over-engineering: page
objects with many methods that aren't called anywhere in tests are a red flag.

### 1.3 Allure Report

Files to read: `package.json`, `playwright.config.ts`

- `allure-playwright` is in `devDependencies`
- `playwright.config.ts` `reporter` array includes `allure-playwright`
- (Bonus) Tests use `allure.label()` or `allure.severity()` for metadata

### 1.4 GitHub Actions

Files to read: `.github/workflows/*.yml`

- At least one workflow file exists
- It runs `npx playwright test` (or equivalent)
- It generates the Allure report
- It uploads an artifact (Allure report or Playwright HTML report)
- It installs Playwright browsers with `--with-deps`

### 1.5 JSON data-driven testing

Files to read: `data/*.json`, all `tests/*.spec.ts` files

- A `data/` directory exists with at least one `.json` file
- Tests import from `data/` rather than hard-coding strings
- No test file contains literal business values (usernames, passwords, prices, product IDs)
  that belong in a data file
- `tsconfig.json` has `"resolveJsonModule": true` (required for JSON imports)

---

## Section 2: Framework requirements

### 2.1 Page Object Model

Files to read: `pages/*.ts`, all `tests/*.spec.ts` files

- A `pages/` directory exists with at least one page object class
- Each page object class has: locators as `readonly` properties, interaction methods, no
  `expect()` calls
- Test files import from `pages/` and call page object methods
- No test file defines locators inline (e.g., `page.locator('.some-class')` directly in `test()`)

### 2.2 Before/after hooks

Files to read: all `tests/*.spec.ts` files

- At least one test file uses `test.beforeEach` or `test.beforeAll`
- At least one test file uses `test.afterEach` or `test.afterAll`
- Hooks are used to navigate to the starting page, instantiate page objects, or set up state
- No test duplicates setup code that could be in a hook

### 2.3 API setup and cleanup

Files to read: `utils/ApiClient.ts` (if present), all `tests/*.spec.ts` files

- API calls are made using Playwright's `request` fixture (not a third-party HTTP client)
- A `utils/ApiClient.ts` (or equivalent) exists and centralises API calls
- `beforeAll`/`afterAll` hooks use the API to seed or clean up data
- No credentials or tokens are hard-coded in test files or API helper files

### 2.4 Independent tests

Files to read: all `tests/*.spec.ts` files

Signs that tests are NOT independent (mark FAIL if any are present):
- A `let` variable declared at module scope is mutated between `test()` blocks
- A test's `test.describe` name implies sequential steps (e.g., "Step 1", "Step 2")
- One test navigates to a page that was left open by a previous test instead of using `goto()`
- `test.only` is present (prevents the rest of the suite from running)
- Tests create data that they never clean up, potentially affecting subsequent tests

---

## Section 3: Scenario coverage

For each scenario below, look for a `test()` block (or `test.each` entry) that covers it.
Read both the test file and the page object to verify the implementation is complete — a test
that exists but doesn't actually assert the correct outcome is PARTIAL, not PASS.

| # | Scenario | What to verify |
|---|---|---|
| 1 | Login fails when username AND password are both blank | A test submits empty credentials and asserts an error message is visible |
| 2 | Add a single product and verify quantity and cart page | A test adds one product, checks the cart badge shows `1`, and navigates to the cart to verify the product appears |
| 3 | Add the same product twice and verify quantity increments | A test adds the same product twice (or two different products) and checks the cart badge increments correctly |
| 4 | Remove one item and multiple items | At least two tests: one removes a single item and verifies it disappears; another removes multiple items and verifies the cart is empty or the count updates |
| 5 | Checkout successfully with valid receiver info using COD | A test fills in checkout information, selects Cash on Delivery, confirms the order, and asserts a success confirmation is shown |
| 6 | Update Full Name and clean up via API | A test uses the API to update the user's Full Name, verifies the change in the UI, then restores the original name via API in `afterEach` or `afterAll` |
| 7 | Verify Orders page with an order seeded via API | A `beforeAll` seeds an order via API, the test navigates to the Orders page and asserts the order is visible, `afterAll` deletes the seeded order |

For scenarios 6 and 7, also verify that the API calls are in hooks (not in the test body)
and that cleanup runs unconditionally.

---

## Section 4: Code quality

Scan all files for these issues and report each one with the file and line context:

- **Hard-coded literals** — business strings or numbers embedded in test or page object files
  instead of imported from `data/`
- **Assertions in page objects** — any `expect()` call inside a file under `pages/`
- **Duplicate locators** — the same selector string appearing in more than one page object
- **Fragile locators** — use of generated class names (`.btn-39x2a`), positional index as
  primary selector (`nth(0)`), or XPath where a role/label/testid locator would work
- **Uncleaned API data** — a `beforeAll`/`beforeEach` that creates data but has no corresponding
  `afterAll`/`afterEach` cleanup
- **Dead page object methods** — methods defined in `pages/` that no test file calls
- **`waitForTimeout` calls** — explicit sleeps are a reliability smell; flag every occurrence

---

## Section 5: Final readiness report

After completing all four sections, produce the report using this exact template:

---

```
## Final Test Readiness Report

### Tech Stack
| Item | Status | Notes |
|---|---|---|
| Playwright + TypeScript | PASS/FAIL | ... |
| TDD | PASS/FAIL/PARTIAL | ... |
| Allure Report | PASS/FAIL | ... |
| GitHub Actions | PASS/FAIL | ... |
| JSON data-driven testing | PASS/FAIL | ... |

### Framework Requirements
| Item | Status | Notes |
|---|---|---|
| Page Object Model | PASS/FAIL | ... |
| Before/after hooks | PASS/FAIL | ... |
| API setup and cleanup | PASS/FAIL | ... |
| Independent tests | PASS/FAIL | ... |

### Scenario Coverage
| # | Scenario | Status | Notes |
|---|---|---|---|
| 1 | Login — blank credentials | PASS/FAIL/PARTIAL | ... |
| 2 | Add single product — quantity + cart | PASS/FAIL/PARTIAL | ... |
| 3 | Add same product twice — quantity increments | PASS/FAIL/PARTIAL | ... |
| 4 | Remove one item and multiple items | PASS/FAIL/PARTIAL | ... |
| 5 | Checkout with valid info — COD | PASS/FAIL/PARTIAL | ... |
| 6 | Update Full Name via API + cleanup | PASS/FAIL/PARTIAL | ... |
| 7 | Orders page with API-seeded order | PASS/FAIL/PARTIAL | ... |

### Code Quality Issues
List each issue as:
- [SEVERITY: high/medium/low] File: <file> — <description>

If none found: "No significant code quality issues found."

### Missing Items
Bullet list of anything required by the rubric that is absent or incomplete.
If nothing is missing: "Nothing missing."

### Recommended Fixes
Numbered list of specific, actionable steps to bring the project to full readiness.
Order by priority (blockers first).
If nothing to fix: "Project appears ready for submission."

### Overall Status
**READY** — All rubric items pass and all scenarios are covered.
  OR
**NOT READY** — <N> item(s) require attention before submission. See recommended fixes above.
```

---

## Important: read-only mode

This skill inspects and reports. Do not create, edit, or delete any project files as part of
the review. If the user asks you to fix something after seeing the report, that's a separate
request — confirm before making any changes.
