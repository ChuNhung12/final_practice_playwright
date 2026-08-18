import { test } from '../fixtures';
import { ApiClient } from '../utils/api-client';
import profileData from '../data/profile.json';

test.describe('Profile - Update Full Name with API cleanup', () => {
  test.beforeAll(async ({ request, credentials }) => {
    const api = new ApiClient(request);

    const token = await api.loginForToken(credentials.username, credentials.password);

    await api.updateProfileName(token, profileData.initialName);
  });

  test.beforeEach(async ({ loginPage, credentials }) => {
    await loginPage.goto();
    await loginPage.loginAndWaitForHome(credentials.username, credentials.password);
  });

  test.afterAll(async ({ request, credentials }) => {
    const api = new ApiClient(request);

    const token = await api.loginForToken(credentials.username, credentials.password);

    await api.updateProfileName(token, profileData.initialName);
  });

  test('updates Full Name on profile page and verifies via UI', async ({ profilePage }) => {
    await profilePage.goto();

    await profilePage.updateFullName(profileData.updatedName);

    await profilePage.verifyUpdateSuccess();
    await profilePage.verifyDisplayedName(profileData.updatedName);
  });
});