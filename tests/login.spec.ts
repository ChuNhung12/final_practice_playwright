import { test } from '../fixtures';
import users from '../data/users.json';

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('valid credentials redirect to home', async ({ loginPage, credentials }) => {
    await loginPage.loginAndWaitForHome(credentials.username, credentials.password);
    await loginPage.verifyLoginSucceeded();
  });

  test('blank credentials show validation error', async ({ loginPage }) => {
    await loginPage.login(users.blank.username, users.blank.password);
    await loginPage.verifyLoginFailed();
  });
});
