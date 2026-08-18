---
name: api-seeding
description: >
  Guides an agent to set up and tear down test data through API calls in this Playwright +
  TypeScript project — covering order seeding, user profile updates, and post-test cleanup.
  Use this skill whenever the user needs to create or delete test data before or after a UI
  test; wants to seed an order before verifying the Orders page; needs to update a user's
  Full Name through API; asks how to avoid navigating the UI just to set up preconditions;
  is about to hard-code a token, password, or base URL in a test file; or needs help
  structuring beforeAll/afterAll API hooks. Also use it whenever a test's setup step involves
  more than one UI interaction that isn't itself what the test is verifying.
---

# api-seeding

UI tests should test UI behaviour — not recreate it to reach a starting state. When a test
needs an order to exist, a user profile to be updated, or data to be cleaned up afterward,
do it through the API. This keeps tests fast, reliable, and focused on the one thing they
actually verify.

---

## Step 1: Inspect the API documentation before writing any code

Every time you are about to write an API call, first fetch the API documentation endpoint to
confirm the correct path, method, required headers, and body shape. Do not guess endpoints
from naming conventions or copy them from other tests without verifying.

```typescript
// The API docs endpoint for this project:
// GET <baseURL>/api-docs  (or /swagger, /openapi.json — check playwright.config.ts baseURL)
```

If the docs URL is not set in `playwright.config.ts`, look for it in:
- `utils/ApiClient.ts` (if it exists)
- A `.env` or `.env.example` file
- Ask the user before proceeding

Read the response and identify:
1. The endpoint path and HTTP method for the operation you need
2. Required request headers (e.g., `Authorization`, `Content-Type`)
3. The request body schema
4. The response body schema — specifically the ID field you'll need for cleanup

---

## Step 2: Check for an existing ApiClient before writing new API code

Look in `utils/ApiClient.ts`. If it exists, read it and reuse the methods it already has.
Only add a new method when the operation you need isn't already there.

If `utils/ApiClient.ts` does not exist, create it. All API interaction belongs in this file,
not in test specs.

### ApiClient template

```typescript
// utils/ApiClient.ts
import { APIRequestContext } from '@playwright/test';

export class ApiClient {
  private readonly baseURL: string;

  constructor(private request: APIRequestContext) {
    // baseURL comes from the environment, never hard-coded
    this.baseURL = process.env.BASE_URL ?? 'http://localhost:3000';
  }

  private authHeader() {
    const token = process.env.API_TOKEN;
    if (!token) throw new Error('API_TOKEN environment variable is not set');
    return { Authorization: `Bearer ${token}` };
  }

  async seedOrder(orderData: object): Promise<string> {
    const res = await this.request.post(`${this.baseURL}/api/orders`, {
      headers: { ...this.authHeader(), 'Content-Type': 'application/json' },
      data: orderData,
    });
    if (!res.ok()) throw new Error(`seedOrder failed: ${res.status()} ${await res.text()}`);
    const body = await res.json();
    return body.id; // return the ID so the test can delete it later
  }

  async deleteOrder(id: string): Promise<void> {
    const res = await this.request.delete(`${this.baseURL}/api/orders/${id}`, {
      headers: this.authHeader(),
    });
    if (!res.ok()) throw new Error(`deleteOrder failed: ${res.status()}`);
  }

  async updateUserFullName(userId: string, fullName: string): Promise<void> {
    const res = await this.request.patch(`${this.baseURL}/api/users/${userId}`, {
      headers: { ...this.authHeader(), 'Content-Type': 'application/json' },
      data: { fullName },
    });
    if (!res.ok()) throw new Error(`updateUserFullName failed: ${res.status()}`);
  }
}
```

Key rules baked into this template:
- `BASE_URL` and `API_TOKEN` come from environment variables — never from a string literal
- Every method throws on non-OK responses so test failures surface clearly
- Every create method returns the created resource's ID so cleanup is always possible

---

## Step 3: Store credentials and base URLs in environment variables

Never write a token, password, or base URL as a string literal in any TypeScript file.

```
# .env (git-ignored)
BASE_URL=http://localhost:3000
API_TOKEN=your-token-here
```

Reference them in code:

```typescript
process.env.BASE_URL
process.env.API_TOKEN
```

If the project uses `dotenv`, it is loaded in `playwright.config.ts`. If it isn't, add:

```typescript
// playwright.config.ts (top of file)
import dotenv from 'dotenv';
dotenv.config();
```

And install the package if needed: `npm install dotenv`.

---

## Step 4: Wire API setup and cleanup into hooks, not test bodies

API calls belong in `beforeAll`/`afterAll` (for data shared across tests in a describe block)
or `beforeEach`/`afterEach` (for data that each test creates independently). The test body
itself should only contain UI actions and assertions.

### Pattern: seed an order, verify it on the Orders page, then delete it

```typescript
// tests/orders.spec.ts
import { test, expect } from '@playwright/test';
import { ApiClient } from '../utils/ApiClient';
import { OrdersPage } from '../pages/OrdersPage';
import orderData from '../data/orders.json';

test.describe('Orders page', () => {
  let api: ApiClient;
  let seededOrderId: string;

  test.beforeAll(async ({ request }) => {
    api = new ApiClient(request);
    seededOrderId = await api.seedOrder(orderData.singleBackpack);
  });

  test.afterAll(async ({ request }) => {
    const api = new ApiClient(request);
    await api.deleteOrder(seededOrderId);
  });

  test('seeded order appears on Orders page', async ({ page }) => {
    const ordersPage = new OrdersPage(page);
    await ordersPage.goto();
    await expect(ordersPage.orderById(seededOrderId)).toBeVisible();
  });
});
```

Why `beforeAll`/`afterAll` here: the order is shared across all tests in this describe block.
If each test needed its own independent order, use `beforeEach`/`afterEach` instead and store
the ID as a local variable within the `beforeEach` closure.

### Pattern: update Full Name through API before verifying the profile UI

```typescript
// tests/profile.spec.ts
import { test, expect } from '@playwright/test';
import { ApiClient } from '../utils/ApiClient';
import { ProfilePage } from '../pages/ProfilePage';
import users from '../data/users.json';

test.describe('Profile page', () => {
  const targetName = 'Jane Doe';
  let originalName: string;

  test.beforeEach(async ({ request }) => {
    const api = new ApiClient(request);
    // save current name so we can restore it
    originalName = users.standard.fullName;
    await api.updateUserFullName(users.standard.id, targetName);
  });

  test.afterEach(async ({ request }) => {
    const api = new ApiClient(request);
    await api.updateUserFullName(users.standard.id, originalName);
  });

  test('updated Full Name is displayed on profile', async ({ page }) => {
    const profilePage = new ProfilePage(page);
    await profilePage.goto();
    await expect(profilePage.fullNameField).toHaveValue(targetName);
  });
});
```

---

## Step 5: Keep the separation clean

| Layer | What goes here |
|---|---|
| `utils/ApiClient.ts` | All HTTP calls — one method per operation |
| `beforeAll` / `beforeEach` | API setup: create data, store returned IDs |
| `afterAll` / `afterEach` | API cleanup: delete data using stored IDs |
| Test body | UI navigation, interactions, and `expect()` assertions only |
| `data/*.json` | Request body payloads and IDs referenced in tests |

If you find yourself writing `request.post(...)` inside a `test()` block, move it to a hook.
If you find yourself writing the same endpoint URL twice, move it to `ApiClient`.

---

## Common mistakes to avoid

**Forgetting to save the created resource's ID.** If you don't capture the ID returned by a
create call, cleanup becomes impossible. Always `return id` from create methods and store it
in a variable that the `after*` hook can access.

**Assuming the cleanup will only run on pass.** Playwright runs `afterAll`/`afterEach` even
when a test fails. This is the correct behaviour — cleanup should always happen. Don't write
conditional cleanup logic.

**Using UI navigation to set up state.** If the test can create an order by clicking through
a UI flow, so can the API. The API is faster, more reliable, and doesn't couple your test
setup to the UI behaviour you haven't tested yet.

**Sharing a single `ApiClient` instance across parallel test files.** Each test file runs in
its own worker. Instantiate `ApiClient` inside the `beforeAll` or `beforeEach` hook using the
`request` fixture provided to that hook — don't try to share it at module scope.
