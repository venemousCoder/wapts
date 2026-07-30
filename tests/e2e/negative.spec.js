const { test, expect } = require('@playwright/test');

test.describe('Negative Scenarios', () => {

  test('TC-E2E-NEG-001: Anonymous user cannot access protected pages', async ({ page }) => {
    await page.goto('/student/dashboard');
    // Should be redirected to login
    await expect(page).toHaveURL(/.*\/auth\/login/);
  });

  test('TC-E2E-NEG-002: Invalid login credentials', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('Registration Number or Institution Email').fill('INVALID999');
    await page.getByPlaceholder('Enter your password').fill('wrongpass');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Should still be on login page and show error
    await expect(page).toHaveURL(/.*\/auth\/login/);
    await expect(page.getByText(/Invalid credentials|not found/i)).toBeVisible();
  });

  test('TC-E2E-NEG-003: Student cannot access admin routes', async ({ page }) => {
    // Login as Student
    await page.goto('/');
    await page.getByPlaceholder('Registration Number or Institution Email').fill('REG2026001');
    await page.getByPlaceholder('Enter your password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/student\/dashboard/);

    // Try to access admin route
    const response = await page.goto('/admin/dashboard');
    console.log(`Response status: ${response.status()}, URL: ${response.url()}`);
    // Should get a 403 Forbidden or redirect
    expect(response.status()).toBe(403);
  });
});
