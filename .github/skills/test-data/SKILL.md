---
name: test-data
description: >
  Defines where JSON test data lives, how to structure and consume it, and how to keep it
  reusable across scenarios in this Playwright + TypeScript project. Use this skill whenever
  the user asks about test data, wants to add or update data for login, products, checkout,
  or orders, is about to hard-code a username/password/price/ID inside a test file, wants to
  share data between multiple tests, or asks how data-driven testing should work in this project.
  Also use it when a test already has literals like "standard_user" or "secret_sauce" embedded
  in the test body — that's a signal the data belongs in data/.
---

# test-data

All business data used in tests belongs in `data/`. Tests import it; they never own it.
This separation means you can change a username, product name, or price in one place and
every test that references it picks up the change automatically.

---

## Folder layout

```
data/
├── users.json        # All user accounts by role and scenario
├── products.json     # Products used in UI/cart/search tests
├── checkout.json     # Shipping addresses, payment methods, delivery options
└── orders.json       # Expected order state for assertion-heavy order tests
```

Add a new file when a new domain is needed. Keep files named after their domain, not after
the test that uses them — `products.json` not `cart-test-data.json`.

---

## How to consume data in tests

TypeScript imports JSON natively when `resolveJsonModule: true` is set in `tsconfig.json`
(see the `playwright-pom` skill for the baseline tsconfig). Import the whole file and
destructure what you need:

```typescript
import users from '../data/users.json';
import { validCard, addresses } from '../data/checkout.json';
```

For parameterised (data-driven) runs, pass the data into `test.each` or a plain `for...of`:

```typescript
import loginScenarios from '../data/users.json';

// test.each with an array of objects
for (const scenario of loginScenarios.negativeLogin) {
  test(`login blocked for: ${scenario.label}`, async ({ page }) => {
    await loginPage.login(scenario.username, scenario.password);
    await expect(loginPage.errorMessage).toHaveText(scenario.expectedError);
  });
}
```

The loop approach keeps test names descriptive (each iteration becomes a named test in the
Playwright report) without needing a custom formatter.

---

## Data file schemas

Keep each file focused. Structure data by scenario group so that different tests can pull
exactly what they need without loading unrelated data.

### users.json

```json
{
  "standard": {
    "username": "standard_user",
    "password": "secret_sauce",
    "label": "standard customer"
  },
  "locked": {
    "username": "locked_out_user",
    "password": "secret_sauce",
    "label": "locked out account"
  },
  "admin": {
    "username": "admin_user",
    "password": "admin_pass",
    "label": "admin"
  },
  "negativeLogin": [
    {
      "label": "wrong password",
      "username": "standard_user",
      "password": "wrong_pass",
      "expectedError": "Username and password do not match"
    },
    {
      "label": "empty username",
      "username": "",
      "password": "secret_sauce",
      "expectedError": "Username is required"
    }
  ]
}
```

### products.json

```json
{
  "backpack": {
    "name": "Sauce Labs Backpack",
    "price": 29.99,
    "id": "sauce-labs-backpack"
  },
  "bikeLight": {
    "name": "Sauce Labs Bike Light",
    "price": 9.99,
    "id": "sauce-labs-bike-light"
  },
  "sortOptions": ["Name (A to Z)", "Name (Z to A)", "Price (low to high)", "Price (high to low)"]
}
```

### checkout.json

```json
{
  "validAddress": {
    "firstName": "Jane",
    "lastName": "Doe",
    "postalCode": "10001"
  },
  "missingPostalCode": {
    "firstName": "Jane",
    "lastName": "Doe",
    "postalCode": "",
    "expectedError": "Error: Postal Code is required"
  }
}
```

### orders.json

```json
{
  "singleBackpack": {
    "itemTotal": 29.99,
    "tax": 2.40,
    "total": 32.39,
    "summaryLabel": "Payment Information"
  }
}
```

Prices and calculated totals belong in `orders.json` — not in test assertions as magic numbers.
When a price changes, you update the data file, not every assertion.

---

## Rules for keeping data clean

**No literals in test files.** If you see a string like `"standard_user"`, `"secret_sauce"`,
or `29.99` inside a `test()` or `expect()`, move it to the appropriate data file. Tests should
reference data by key, not contain the data themselves.

**One source per concept.** If `standard_user`'s username appears in both `users.json` and
`checkout.json`, that's duplication. Pick one file as the authority and import from it in the
other if needed, or keep user details only in `users.json`.

**Labels for readability.** Include a `label` or `name` field on objects used in `for...of`
loops — Playwright uses it to name the test in the report. `"label": "wrong password"` is
more useful in a failure message than `"username": "standard_user"`.

**Don't use data files as fixtures.** `data/` files hold input values and expected outputs,
not complex setup logic. If you need to create a user via API before a test, that belongs in
`beforeAll`/`beforeEach` using the `ApiClient` utility — the credentials you seed with might
come from `users.json`, but the seeding itself is test infrastructure, not data.

**Keep data minimal.** Include only the fields a test actually reads. A bloated user object
with 20 fields when the test uses 2 is noise. Trim to what's needed; add fields when a new
test genuinely requires them.

---

## Adding data for a new scenario

1. Identify which domain file the data belongs to (`users`, `products`, `checkout`, `orders`).
   If none fit, create a new file named after the domain.
2. Add the new entry under a meaningful key or into the appropriate array.
3. Import it in the test file using the key. Do not copy the value into the test.
4. If an existing entry is close but needs one field changed, add a new named entry rather
   than mutating the shared one — other tests may depend on the original values.

---

## Example: wiring a checkout test end to end

```typescript
// tests/checkout.spec.ts
import { test, expect } from '@playwright/test';
import users from '../data/users.json';
import { validAddress } from '../data/checkout.json';
import { singleBackpack } from '../data/orders.json';
import { LoginPage } from '../pages/LoginPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';

test.describe('Checkout', () => {
  test('completes order for standard user', async ({ page }) => {
    const login    = new LoginPage(page);
    const cart     = new CartPage(page);
    const checkout = new CheckoutPage(page);

    await login.goto();
    await login.login(users.standard.username, users.standard.password);
    await cart.addItemById(products.backpack.id);
    await cart.proceedToCheckout();
    await checkout.fillAddress(validAddress);
    await checkout.confirmOrder();

    await expect(checkout.orderTotal).toHaveText(`$${singleBackpack.total}`);
  });
});
```

No string or number literals appear in the test body. Every value is traceable back to a
data file, which means the test documents its own inputs just by its import statements.
