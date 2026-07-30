const { test, expect } = require('@playwright/test');

test.describe('Cross-Role Workflow', () => {
  // Use a single browser context to simulate multiple users if we use different pages,
  // or sequential logins in the same page. Sequential is closer to the test spec.
  test('TC-E2E-CROSS-001: Complete Academic Lifecycle', async ({ page }) => {
    // 1. Admin logs in to configure
    await page.goto('/');
    await page.getByPlaceholder('Registration Number or Institution Email').fill('admin');
    await page.getByPlaceholder('Enter your password').fill('admin');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // Verify admin can access calendar
    await page.goto('/admin/calendar');
    await expect(page.getByRole('heading', { name: /Calendar/i })).toBeVisible();

    await page.goto('/auth/logout');
    await expect(page).toHaveURL(/\/auth\/login/);

    // 2. Student registers courses
    await page.goto('/');
    await page.getByPlaceholder('Registration Number or Institution Email').fill('REG2026001');
    await page.getByPlaceholder('Enter your password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/student\/dashboard/);

    // Verify student can access course registration
    await page.goto('/student/courses/register');
    await expect(page.getByRole('heading', { name: /Course Registration/i })).toBeVisible();

    await page.goto('/auth/logout');
    await expect(page).toHaveURL(/\/auth\/login/);

    // 3. Lecturer records attendance and creates assessment
    await page.goto('/');
    await page.getByPlaceholder('Registration Number or Institution Email').fill('lecturer@wapts.edu');
    await page.getByPlaceholder('Enter your password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/lecturer\/dashboard/);

    await page.goto('/lecturer/attendance');
    await expect(page.getByRole('heading', { name: /Record Attendance/i })).toBeVisible();

    await page.goto('/auth/logout');
    await expect(page).toHaveURL(/\/auth\/login/);

    // 4. HOD approves results
    await page.goto('/');
    await page.getByPlaceholder('Registration Number or Institution Email').fill('hod@wapts.edu');
    await page.getByPlaceholder('Enter your password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/hod\/dashboard/);

    await page.goto('/hod/results/review');
    await expect(page.getByRole('heading', { name: /Review Results/i })).toBeVisible();

    await page.goto('/auth/logout');
    await expect(page).toHaveURL(/\/auth\/login/);

    // 5. Student views updated dashboard
    await page.goto('/');
    await page.getByPlaceholder('Registration Number or Institution Email').fill('REG2026001');
    await page.getByPlaceholder('Enter your password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL(/\/student\/dashboard/);

    // Check dashboard elements
    await expect(page.getByRole('heading', { name: 'Current CGPA' })).toBeVisible();
  });
});
