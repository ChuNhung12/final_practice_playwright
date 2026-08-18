import { expect, Page, Locator } from '@playwright/test';
import messages from '../data/messages.json';

export class OrdersPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/orders');
  }

  orderById(orderId: string): Locator {
    return this.page.getByText(`${messages.orders.orderNumberPrefix}${orderId}`);
  }

  async verifyOrderVisible(orderId: string) {
    const orderElement = this.orderById(orderId);
    await expect(orderElement).toBeVisible({ timeout: 10000 });
  }
}
