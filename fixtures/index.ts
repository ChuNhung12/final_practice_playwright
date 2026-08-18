import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login-page';
import { ProductPage } from '../pages/product-page';
import { CartPage } from '../pages/cart-page';
import { CheckoutPage } from '../pages/checkout-page';
import { ProfilePage } from '../pages/profile-page';
import { OrdersPage } from '../pages/orders-page';

type AppFixtures = {
  loginPage: LoginPage;
  productPage: ProductPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  profilePage: ProfilePage;
  ordersPage: OrdersPage;
  credentials: { username: string; password: string };
};

export const test = base.extend<AppFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  productPage: async ({ page }, use) => {
    await use(new ProductPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
  profilePage: async ({ page }, use) => {
    await use(new ProfilePage(page));
  },
  ordersPage: async ({ page }, use) => {
    await use(new OrdersPage(page));
  },
  credentials: async ({}, use) => {
    const username = process.env.TEST_USERNAME;
    const password = process.env.TEST_PASSWORD;
    
    if (!username || !password) {
      throw new Error(
        'Missing required environment variables: TEST_USERNAME and TEST_PASSWORD. ' +
        'Please set them in .env or your environment.'
      );
    }
    
    await use({ username, password });
  },
});

export { expect } from '@playwright/test';
