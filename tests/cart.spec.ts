import { test } from '../fixtures';
import products from '../data/products.json';

test.describe('Cart — add same product twice', () => {
  test.beforeEach(async ({ loginPage, credentials }) => {
    await loginPage.goto();
    await loginPage.loginAndWaitForHome(credentials.username, credentials.password);
  });

  test('adding same product twice shows quantity 2 in badge and on cart page', async ({ productPage, cartPage }) => {
    await productPage.addToCart(products.firstProduct.name);
    await productPage.addToCart(products.firstProduct.name);
    await productPage.verifyCartBadge(products.firstProduct.expectedDoubleQuantity);
    await productPage.goToCart();
    await cartPage.verifyOnCartPage();
    await cartPage.verifyCartContainsProduct(products.firstProduct.name);
    await cartPage.verifyItemQuantity(products.firstProduct.expectedDoubleQuantity);
    await cartPage.verifyCartItemCount(products.firstProduct.expectedDoubleQuantity);
  });
});

test.describe('Cart — add single product', () => {
  test.beforeEach(async ({ loginPage, credentials }) => {
    await loginPage.goto();
    await loginPage.loginAndWaitForHome(credentials.username, credentials.password);
  });

  test('adding one product shows quantity 1 in badge and on cart page', async ({ productPage, cartPage }) => {
    await productPage.addToCart(products.firstProduct.name);
    await productPage.verifyCartBadge(products.firstProduct.expectedCartQuantity);
    await productPage.goToCart();
    await cartPage.verifyOnCartPage();
    await cartPage.verifyCartContainsProduct(products.firstProduct.name);
    await cartPage.verifyItemQuantity(products.firstProduct.expectedCartQuantity);
    await cartPage.verifyCartItemCount(products.firstProduct.expectedCartQuantity);
  });
});

test.describe('Cart — remove items', () => {
  test.beforeEach(async ({ loginPage, credentials }) => {
    await loginPage.goto();
    await loginPage.loginAndWaitForHome(credentials.username, credentials.password);
  });

  test('removing the only item leaves the cart empty', async ({ productPage, cartPage }) => {
    await productPage.addToCart(products.firstProduct.name);
    await productPage.goToCart();
    await cartPage.verifyOnCartPage();
    await cartPage.removeItem(products.firstProduct.name);
    await cartPage.verifyCartIsEmpty();
    await cartPage.verifyCartItemCount('0');
  });

  test('removing one of multiple items keeps remaining items in cart', async ({ productPage, cartPage }) => {
    await productPage.addToCart(products.firstProduct.name);
    await productPage.addToCart(products.secondProduct.name);
    await productPage.goToCart();
    await cartPage.verifyOnCartPage();
    await cartPage.removeItem(products.firstProduct.name);
    await cartPage.verifyCartContainsProduct(products.secondProduct.name);
    await cartPage.verifyCartDoesNotContainProduct(products.firstProduct.name);
    await cartPage.verifyCartItemCount('1');
  });
});
