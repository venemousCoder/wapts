const { test, expect } = require('@playwright/test');

test.describe('Admin Journey', () => {
  test.beforeEach(async ({ page }) => {
    console.log('Navigating to /');
    await page.goto('/');
    
    console.log('Filling login form');
    // Login as Admin
    await page.getByPlaceholder('Registration Number or Institution Email').fill('admin');
    await page.getByPlaceholder('Enter your password').fill('admin');
    console.log('Clicking Sign In');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    console.log('Waiting for URL');
    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 10000 });
    console.log('Login successful');
  });

  test('TC-E2E-ADMIN-001: Should manage users', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page.getByRole('heading', { name: /Users/i })).toBeVisible();
    // Test creating a user (assuming there's a button)
    const addUserBtn = page.getByRole('button', { name: /Add User/i });
    if (await addUserBtn.isVisible()) {
      await addUserBtn.click();
      await expect(page.locator('#createUserForm')).toBeVisible();
    }
  });

  test('TC-E2E-ADMIN-002: Should manage departments', async ({ page }) => {
    await page.goto('/admin/departments');
    await expect(page.getByRole('heading', { name: /Departments/i })).toBeVisible();
  });

  test('TC-E2E-ADMIN-003: Should manage academic calendar', async ({ page }) => {
    await page.goto('/admin/calendar');
    await expect(page.getByRole('heading', { name: /Calendar/i })).toBeVisible();
  });

  test('TC-E2E-ADMIN-004: Should manage grade scales', async ({ page }) => {
    await page.goto('/admin/grades');
    await expect(page.getByRole('heading', { name: /Grade/i })).toBeVisible();
  });

  test('TC-E2E-ADMIN-005: Should manage system configuration', async ({ page }) => {
    await page.goto('/admin/settings');
    await expect(page.getByRole('heading', { name: /Settings/i })).toBeVisible();
  });
});
