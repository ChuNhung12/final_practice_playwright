import { Page, Locator, expect } from '@playwright/test';
import messages from '../data/messages.json';

export class LoginPage {
  readonly page: Page;
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page          = page;
    this.usernameInput = page.getByTestId('login-username');
    this.passwordInput = page.getByTestId('login-password');
    this.loginButton   = page.getByTestId('login-submit');
    this.errorMessage  = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async loginAndWaitForHome(username: string, password: string) {
    await this.login(username, password);
    await this.page.waitForURL('**/home');
  }

  async verifyLoginSucceeded() {
    await expect(this.page).toHaveURL(/\/home/);
  }

  async verifyLoginFailed() {
    await this.errorMessage.waitFor({ state: 'visible' });
    await expect(this.errorMessage).toHaveText(messages.login.validationError);
  }
}
