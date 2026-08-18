import { expect, Page, Locator } from '@playwright/test';
import messages from '../data/messages.json';

export class CheckoutPage {
  readonly page: Page;
  private readonly nameInput: Locator;
  private readonly phoneInput: Locator;
  private readonly addressInput: Locator;
  private readonly codRadio: Locator;
  private readonly submitButton: Locator;
  private readonly successHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.getByTestId('checkout-name');
    this.phoneInput = page.getByTestId('checkout-phone');
    this.addressInput = page.getByTestId('checkout-address');
    this.codRadio = page.getByLabel(/Thanh toán khi nhận hàng|COD/i);
    this.submitButton = page.getByTestId('checkout-submit');
    this.successHeading = page.getByTestId('checkout-success-heading');
  }

  async fillReceiverInfo(name: string, phone: string, address: string) {
    await this.nameInput.fill(name);
    await this.phoneInput.fill(phone);
    await this.addressInput.fill(address);
  }

  async selectCOD() {
    await this.codRadio.check();
  }

  async submitOrder() {
    await this.submitButton.click();
  }

  async verifyOrderSuccess() {
    await expect(this.successHeading).toBeVisible();
    await expect(this.successHeading).toHaveText(messages.checkout.successHeading);
  }
}
