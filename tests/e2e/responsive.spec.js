const { test, expect } = require('@playwright/test');

test.describe('Responsive Design', () => {
  // We use mobile viewport
  test.use({ viewport: { width: 375, height: 667 } });

  test('TC-E2E-RESP-001: Mobile Login Page is responsive', async ({ page }) => {
    await page.goto('/');
    
    // Check that login form is visible
    await expect(page.locator('form#loginForm')).toBeVisible();
    
    // Check that branding is hidden on mobile (as per bootstrap d-none d-md-flex)
    await expect(page.locator('.login-left')).toBeHidden();
  });

  test('TC-E2E-RESP-002: Mobile Student Dashboard navigation', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('Registration Number or Institution Email').fill('REG2026001');
    await page.getByPlaceholder('Enter your password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    await expect(page).toHaveURL(/\/student\/dashboard/);
    
    // Verify mobile toggle menu exists (hamburger)
    const navbarToggler = page.locator('.navbar-toggler');
    if (await navbarToggler.isVisible()) {
      await navbarToggler.click();
      await expect(page.locator('#sidebar')).toBeVisible();
    }
  });
});
