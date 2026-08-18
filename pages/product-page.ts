import { expect, Page, Locator } from '@playwright/test';

export class ProductPage {
  readonly page: Page;
  private readonly cartBadge: Locator;
  private readonly cartButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartBadge = page.locator('.cart-badge');
    this.cartButton = page.locator('.cart-btn');
  }

  async goto() {
    await this.page.goto('/home');
  }

  async addToCart(productName: string) {
    await this.page
      .locator('.product-card')
      .filter({ hasText: productName })
      .locator('button')
      .click();
  }

  async goToCart() {
    await this.cartButton.click();
  }

  async verifyCartBadge(expectedCount: string) {
    await expect(this.cartBadge).toBeVisible();
    await expect(this.cartBadge).toHaveText(expectedCount);
  }
}
