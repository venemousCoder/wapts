const { test, expect } = require('@playwright/test');

test.describe('Student Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login
    await page.goto('/');
    
    // Login as Student
    await page.getByPlaceholder('Registration Number or Institution Email').fill('REG2026001');
    await page.getByPlaceholder('Enter your password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Wait for navigation to dashboard
    await expect(page).toHaveURL(/\/student\/dashboard/);
  });

  test('TC-E2E-STUDENT-001: Should view dashboard statistics', async ({ page }) => {
    // Verify dashboard statistics are visible
    await expect(page.getByRole('heading', { name: 'Current CGPA' })).toBeVisible();
    await expect(page.getByText('Credits Earned')).toBeVisible();
    await expect(page.getByText('Classification')).toBeVisible();
    await expect(page.getByText('Academic Risk')).toBeVisible();
  });

  test('TC-E2E-STUDENT-002: Should navigate to registered courses', async ({ page }) => {
    // Click on registered courses or navigate
    await page.goto('/student/courses');
    
    // Verify courses page is displayed
    await expect(page.getByRole('heading', { name: /Course Registration/i })).toBeVisible();
  });

  test('TC-E2E-STUDENT-003: Should view attendance records', async ({ page }) => {
    await page.goto('/student/attendance');
    await expect(page.getByRole('heading', { name: /Attendance/i })).toBeVisible();
  });

  test('TC-E2E-STUDENT-004: Should view results', async ({ page }) => {
    await page.goto('/student/results');
    await expect(page.getByRole('heading', { name: /Results/i })).toBeVisible();
  });

  test('TC-E2E-STUDENT-005: Should view transcript', async ({ page }) => {
    await page.goto('/student/transcript');
    await expect(page.getByRole('heading', { name: /Transcript/i })).toBeVisible();
  });

  test('TC-E2E-STUDENT-006: Should handle logout', async ({ page }) => {
    // Locate the logout button - may be in a dropdown
    await page.goto('/auth/logout');
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
