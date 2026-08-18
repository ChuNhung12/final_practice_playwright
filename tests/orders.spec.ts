import { test } from '../fixtures';
import { ApiClient } from '../utils/api-client';
import orderData from '../data/orders.json';

test.describe('Orders page — verify seeded order', () => {
  let api: ApiClient;
  let seededOrderId: string;
  let token: string;
  let testUsername: string;
  let testPassword: string;

  test.beforeAll(async ({ request, credentials }) => {
    testUsername = credentials.username;
    testPassword = credentials.password;
    api = new ApiClient(request);
    // Get token for API calls
    token = await api.loginForToken(testUsername, testPassword);
    // Seed an order via API
    seededOrderId = await api.seedOrder(token, orderData.singleProduct);
  });

  test.beforeEach(async ({ loginPage, credentials }) => {
    // Log in through UI so the page has valid session
    await loginPage.goto();
    await loginPage.loginAndWaitForHome(credentials.username, credentials.password);
  });

  test.afterAll(async ({ request }) => {
    // Clean up: delete the seeded order
    const api = new ApiClient(request);
    const token = await api.loginForToken(testUsername, testPassword);
    await api.deleteOrder(token, seededOrderId);
  });

  test('seeded order appears on Orders page', async ({ ordersPage }) => {
    await ordersPage.goto();
    await ordersPage.verifyOrderVisible(seededOrderId);
  });
});
