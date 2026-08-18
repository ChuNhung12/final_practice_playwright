import { expect, Page, Locator } from '@playwright/test';
import messages from '../data/messages.json';

export class ProfilePage {
  readonly page: Page;
  private readonly nameInput: Locator;
  private readonly saveButton: Locator;
  private readonly successMessage: Locator;

  constructor(page: Page) {
    this.page           = page;
    this.nameInput      = page.getByTestId('profile-name');
    this.saveButton     = page.getByTestId('profile-save');
    this.successMessage = page.getByText(messages.profile.updateSuccess);
  }

  async goto() {
    await this.page.goto('/profile');
  }

  async updateFullName(name: string) {
    const currentName = await this.nameInput.inputValue();

    await this.nameInput.clear();
    await this.nameInput.fill(name);
    await this.saveButton.click();
  }

  async verifyUpdateSuccess() {
    await expect(this.successMessage).toBeVisible();
  }

  async verifyDisplayedName(name: string) {
    await expect(this.nameInput).toHaveValue(name);
  }
}