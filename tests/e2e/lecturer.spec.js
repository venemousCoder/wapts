const { test, expect } = require('@playwright/test');

test.describe('Lecturer Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Login as Lecturer
    await page.getByPlaceholder('Registration Number or Institution Email').fill('lecturer@wapts.edu');
    await page.getByPlaceholder('Enter your password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    await expect(page).toHaveURL(/\/lecturer\/dashboard/);
  });

  test('TC-E2E-LECTURER-001: Should view assigned courses', async ({ page }) => {
    await page.goto('/lecturer/courses');
    await expect(page.getByRole('heading', { name: /Assigned Courses/i })).toBeVisible();
  });

  test('TC-E2E-LECTURER-002: Should navigate to attendance recording', async ({ page }) => {
    await page.goto('/lecturer/attendance');
    await expect(page.getByRole('heading', { name: /Record Attendance/i })).toBeVisible();
  });

  test('TC-E2E-LECTURER-003: Should navigate to assessment creation', async ({ page }) => {
    await page.goto('/lecturer/assessments');
    await expect(page.getByRole('heading', { name: /Assessments/i })).toBeVisible();
  });

  test('TC-E2E-LECTURER-004: Should navigate to results submission', async ({ page }) => {
    await page.goto('/lecturer/results');
    await expect(page.getByRole('heading', { name: /Results/i })).toBeVisible();
  });
});
