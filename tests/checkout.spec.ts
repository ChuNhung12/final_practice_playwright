import { test } from '../fixtures';
import products from '../data/products.json';
import checkout from '../data/checkout.json';

test.describe('Checkout — COD with valid receiver info', () => {
  test.beforeEach(async ({ loginPage, credentials }) => {
    await loginPage.goto();
    await loginPage.loginAndWaitForHome(credentials.username, credentials.password);
  });

  test('checkout succeeds with valid receiver information and COD payment', async ({ productPage, cartPage, checkoutPage }) => {
    await productPage.addToCart(products.firstProduct.name);
    await productPage.goToCart();
    await cartPage.proceedToCheckout();
    await checkoutPage.fillReceiverInfo(
      checkout.validReceiver.name,
      checkout.validReceiver.phone,
      checkout.validReceiver.address,
    );
    await checkoutPage.selectCOD();
    await checkoutPage.submitOrder();
    await checkoutPage.verifyOrderSuccess();
  });
});
