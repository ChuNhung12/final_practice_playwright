import { expect, Page, Locator } from '@playwright/test';

export class CartPage {
  readonly page: Page;
  private readonly cartTitle: Locator;
  private readonly itemName: Locator;
  private readonly itemQuantity: Locator;
  private readonly checkoutButton: Locator;
  private readonly cartEmpty: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartTitle = page.locator('.cart-title');
    this.itemName = page.locator('.item-name');
    this.itemQuantity = page.locator('.qty-value');
    this.checkoutButton = page.locator('.checkout-btn');
    this.cartEmpty = page.locator('.cart-empty');
  }

  async proceedToCheckout() {
    await this.checkoutButton.click();
    await this.page.waitForURL('**/checkout');
  }

  async verifyOnCartPage() {
    await expect(this.page).toHaveURL(/\/cart/);
    await expect(this.cartTitle).toBeVisible();
  }

  async verifyCartContainsProduct(productName: string) {
    await expect(this.itemName).toContainText(productName);
  }

  async verifyItemQuantity(expectedQty: string) {
    await expect(this.itemQuantity).toHaveText(expectedQty);
  }

  async verifyCartItemCount(expectedCount: string) {
    await expect(this.cartTitle).toContainText(`(${expectedCount})`);
  }

  async removeItem(productName: string) {
    await this.page
      .locator('.cart-item')
      .filter({ hasText: productName })
      .locator('.remove-btn')
      .click();
  }

  async verifyCartIsEmpty() {
    await expect(this.cartEmpty).toBeVisible();
  }

  async verifyCartDoesNotContainProduct(productName: string) {
    await expect(this.itemName).not.toContainText(productName);
  }
}
