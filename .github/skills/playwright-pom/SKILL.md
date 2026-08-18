---
name: playwright-pom
description: >
  Guides an AI agent to build, extend, and maintain a Playwright + TypeScript test automation
  project using Page Object Model (POM), TDD, API setup/cleanup, JSON data-driven testing,
  Allure reporting, and GitHub Actions. Use this skill whenever the user asks to write, fix,
  extend, or review Playwright tests; scaffold page objects or utilities; wire up Allure or
  GitHub Actions; add data-driven scenarios; or do anything related to this automation project —
  even if they don't use the words "Page Object Model" or "Playwright skill".
---

# playwright-pom

A skill for building and maintaining a Playwright + TypeScript project that follows professional
automation engineering practices: Page Object Model, TDD, API-driven setup/teardown,
JSON data-driven testing, Allure reporting, and GitHub Actions CI.

---

## 1. Always start: inspect before you code

Before writing or modifying any file, run a quick structural scan:

```
list directory structure (pages/, tests/, utils/, data/, .github/)
read playwright.config.ts
read package.json (scripts, devDependencies)
list existing page objects in pages/
list existing test files in tests/
```

Why this matters: the project may already have page objects, helpers, or fixtures you should
reuse rather than recreate. Duplicating an existing `LoginPage` or utility function is the
most common mistake in POM projects.

---

## 2. Project layout

Keep this structure. Create missing folders as needed; never scatter files at the root.

```
project-root/
├── pages/               # Page Object classes — one file per logical page/component
├── tests/               # Test specs — one file per feature
├── utils/               # Shared helpers (API client, test data loader, custom fixtures)
├── data/                # JSON test data files
├── .github/
│   └── workflows/       # CI pipeline(s)
├── playwright.config.ts
├── package.json
└── tsconfig.json
```

---

## 3. Page Object Model rules

### File naming

Page Object **files** use **kebab-case**. Page Object **classes** use **PascalCase**.

| File | Class |
|---|---|
| `pages/login-page.ts` | `LoginPage` |
| `pages/product-page.ts` | `ProductPage` |
| `pages/cart-page.ts` | `CartPage` |
| `pages/checkout-page.ts` | `CheckoutPage` |
| `pages/orders-page.ts` | `OrdersPage` |

### What belongs in a page object (`pages/`)

- All locators (as readonly class properties)
- All page interaction methods (`login()`, `addToCart()`, `fillForm()`)
- Navigation helpers (`goto()`)
- **All assertions** — `expect()` calls live here, not in test files
- **All business-level verification methods** that hide locators, `expect()` calls, and expected text from the test
- Expected UI message strings — never in test files

Verification methods read like business outcomes:

```typescript
async verifyRequiredFieldErrors()       // login blank submit
async verifyLoginSucceeded()            // redirect after valid login
async verifyProductIsInCart(name: string)
async verifyCartQuantity(expected: number)
async verifyCheckoutSuccess()
async verifyOrdersListIsNotEmpty()
```

### What belongs in a test file (`tests/`)

- `test.describe` blocks grouping related scenarios
- `test` blocks that call page object methods — **no `expect()`, no locators, no expected strings**
- `beforeAll` / `beforeEach` / `afterAll` / `afterEach` hooks
- API setup and cleanup calls

The test reads like a business scenario. If you see `expect()` or a raw locator in a test file, move it to the Page Object.

### Page object template

```typescript
// pages/login-page.ts
import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page         = page;
    this.usernameInput = page.getByTestId('login-username');
    this.passwordInput = page.getByTestId('login-password');
    this.loginButton   = page.getByTestId('login-submit');
    this.errorAlert    = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async verifyBlankCredentialError() {
    await expect(this.errorAlert).toBeVisible();
    await expect(this.errorAlert).toContainText('Vui lòng nhập đầy đủ tài khoản và mật khẩu');
    await expect(this.page).toHaveURL(/\/login/);
  }

  async verifyLoginSucceeded() {
    await expect(this.page).not.toHaveURL(/\/login/);
  }
}
```

### Test file template

```typescript
// tests/login.spec.ts
import { test } from '@playwright/test';       // no 'expect' import needed
import { LoginPage } from '../pages/login-page';
import users from '../data/users.json';

test.describe('Login', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('valid credentials redirect to home', async () => {
    await loginPage.login(users.valid.username, users.valid.password);
    await loginPage.verifyLoginSucceeded();
  });

  test('blank credentials show validation error', async () => {
    await loginPage.login(users.blank.username, users.blank.password);
    await loginPage.verifyBlankCredentialError();
  });
});
```

### Correct vs incorrect pattern

**Incorrect** — assertions and expected text leak into the test:

```typescript
test('login fails with blank fields', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login('', '');

  await expect(loginPage.errorAlert).toBeVisible();
  await expect(loginPage.errorAlert).toContainText('Vui lòng nhập đầy đủ');
});
```

**Correct** — the test describes the scenario; the Page Object owns the details:

```typescript
test('login fails with blank fields', async () => {
  await loginPage.login('', '');
  await loginPage.verifyBlankCredentialError();
});
```

---

## 4. Locator priority — most stable to least stable

Prefer locators in this order. If a stable locator is available, never fall back to a fragile one.

1. `getByRole()` — semantic, accessibility-based, most resilient
2. `getByLabel()` — tied to form labels, excellent for inputs
3. `getByTestId()` — requires `data-testid` attribute; ask the team to add if missing
4. `getByText()` — good for buttons/links when text is stable
5. `getByPlaceholder()` — acceptable for inputs without visible labels
6. `locator('css')` — only when nothing above works; use short, structural selectors
7. `locator('xpath')` — last resort; flag it with a comment explaining why

Never use positional index selectors like `nth(0)` as the primary strategy. Never use generated
class names (e.g., `.btn-39x2a`).

---

## 5. TDD approach

Write the test first, then implement the page object to make it pass.

1. Write the test spec — call the verification method by its intended name, don't implement it yet
2. Run it — it fails because the page object doesn't exist yet (red)
3. Create the page object: add locators, interaction methods, and the verification method with its `expect()` calls
4. Run again — it passes (green)
5. Refactor if needed, keeping tests green

This ensures every page object method (including verification methods) is driven by an actual test need.

---

## 6. Hooks and test isolation

Every test must be independently executable — it must pass whether run alone or in any order.

```typescript
test.beforeAll(async ({ request }) => {
  // API: seed data that the whole describe block needs
  await request.post('/api/seed', { data: { scenario: 'login-tests' } });
});

test.beforeEach(async ({ page }) => {
  // UI: navigate to starting point; instantiate page objects
});

test.afterEach(async ({ request }) => {
  // Clean up test-specific data to avoid test pollution
});

test.afterAll(async ({ request }) => {
  // API: tear down shared seeded data
});
```

Rules:
- **Never share mutable state between tests** via module-level variables
- Seed data in `beforeAll`/`beforeEach`; clean it up in the matching `after*` hook
- If an API call in `beforeAll` fails, the whole describe block should fail fast — do not
  swallow the error

---

## 7. API setup and cleanup

Use Playwright's built-in `request` fixture for API calls. Create a utility class if the same
API operations repeat across test files.

```typescript
// utils/ApiClient.ts
import { APIRequestContext } from '@playwright/test';

export class ApiClient {
  constructor(private request: APIRequestContext) {}

  async createUser(data: object) {
    const res = await this.request.post('/api/users', { data });
    if (!res.ok()) throw new Error(`createUser failed: ${res.status()}`);
    return res.json();
  }

  async deleteUser(id: string) {
    await this.request.delete(`/api/users/${id}`);
  }
}
```

Use in tests:

```typescript
test.beforeAll(async ({ request }) => {
  const api = new ApiClient(request);
  createdUser = await api.createUser(testData.newUser);
});

test.afterAll(async ({ request }) => {
  const api = new ApiClient(request);
  await api.deleteUser(createdUser.id);
});
```

---

## 8. JSON data-driven testing

Store all test inputs in `data/`. Keep data files named after the feature they serve.

```
data/
├── users.json
├── products.json
└── checkout.json
```

Example data file:

```json
{
  "valid": { "username": "standard_user", "password": "secret_sauce" },
  "invalid": { "username": "locked_out_user", "password": "wrong_pass" },
  "edge": { "username": "", "password": "" }
}
```

Import directly in TypeScript — no custom loader needed:

```typescript
import users from '../data/users.json';
```

For parameterised scenarios, use a loop — the Page Object verification method receives the expected value from the data file:

```typescript
import loginScenarios from '../data/loginScenarios.json';

for (const scenario of loginScenarios) {
  test(scenario.name, async () => {
    await loginPage.login(scenario.username, scenario.password);
    await loginPage.verifyErrorMessage(scenario.expectedError); // expect() is inside the PO
  });
}
```

---

## 9. Allure Report setup

### Install

```bash
npm install --save-dev allure-playwright
```

### Configure `playwright.config.ts`

```typescript
reporter: [
  ['line'],
  ['allure-playwright', { outputFolder: 'allure-results' }],
],
```

### Run and generate

```bash
npx playwright test
npx allure generate allure-results --clean -o allure-report
npx allure open allure-report
```

### Add metadata to tests (optional but valuable)

```typescript
import { allure } from 'allure-playwright';

test('checkout flow', async ({ page }) => {
  allure.label('feature', 'Checkout');
  allure.severity('critical');
  // ...
});
```

---

## 10. GitHub Actions CI

Create `.github/workflows/playwright.yml`. Key requirements: install dependencies, run
Playwright tests, upload the Allure report as an artifact.

```yaml
name: Playwright Tests

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run tests
        run: npx playwright test

      - name: Generate Allure report
        if: always()
        run: npx allure generate allure-results --clean -o allure-report

      - name: Upload Allure report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: allure-report
          path: allure-report/
          retention-days: 7

      - name: Upload Playwright HTML report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

---

## 11. Run and validate after every change

After writing or modifying tests, always run them and confirm they pass:

```bash
# Run all tests
npx playwright test

# Run a specific file
npx playwright test tests/login.spec.ts

# Run with Allure output
npx playwright test --reporter=allure-playwright

# Run in headed mode (for debugging)
npx playwright test --headed

# Show trace on every run (debugging)
npx playwright test --trace on
```

If a test fails:
1. Read the full error — Playwright errors are detailed and usually tell you exactly what's wrong
2. Check if a locator changed by running `npx playwright codegen <url>` to inspect the DOM
3. If the test logic is correct but the page is slow, add a `waitFor` at the page object level
   (never in test files)
4. Fix at the right layer: locator problems → page object; flow problems → test file

---

## 12. Common mistakes to avoid

| Mistake | Correct approach |
|---|---|
| Putting `expect()` in a test file | Move assertions into a Page Object verification method |
| Putting expected message strings in a test file | Keep them in the Page Object (or `data/` if data-driven) |
| Using PascalCase for Page Object **files** | Use kebab-case: `login-page.ts`, not `LoginPage.ts` |
| Exposing locators as `public` | Make locators `private`; expose only interaction + verification methods |
| Hardcoding test data strings in test files | Load from `data/*.json` |
| Creating a new page object when one exists | Check `pages/` first; extend if needed |
| Using `page.locator('.some-class')` for critical elements | Use role/label/testid locators |
| Sharing `let` state between `test` blocks | Use `beforeEach` to reset state per test |
| Calling `page.waitForTimeout(3000)` | Use `waitForSelector`, `waitForURL`, or auto-waiting locators |
| Writing test and page object in the same file | Always keep them separate |
| Skipping `afterAll`/`afterEach` cleanup | Always clean up API-created data |

---

## 13. tsconfig.json baseline

If `tsconfig.json` is missing or incomplete, use this:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "outDir": "dist",
    "baseUrl": "."
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

`resolveJsonModule: true` is required for importing JSON data files directly.
