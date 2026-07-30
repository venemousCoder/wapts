const { test, expect } = require('@playwright/test');

test.describe('HOD Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Login as HOD
    await page.getByPlaceholder('Registration Number or Institution Email').fill('hod@wapts.edu');
    await page.getByPlaceholder('Enter your password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    await expect(page).toHaveURL(/\/hod\/dashboard/);
  });

  test('TC-E2E-HOD-001: Should view dashboard', async ({ page }) => {
    await expect(page.getByText('Pending Approvals')).toBeVisible();
    await expect(page.getByText('Active Courses')).toBeVisible();
  });

  test('TC-E2E-HOD-002: Should review submitted results', async ({ page }) => {
    await page.goto('/hod/results/review');
    await expect(page.getByRole('heading', { name: /Review Results/i })).toBeVisible();
  });

  test('TC-E2E-HOD-003: Should view department analytics', async ({ page }) => {
    await page.goto('/hod/analytics');
    await expect(page.getByRole('heading', { name: /Analytics/i })).toBeVisible();
  });

  test('TC-E2E-HOD-004: Should access student management, register a student, and verify password change flow', async ({ page }) => {
    await page.goto('/hod/students');
    await expect(page.getByRole('heading', { name: /Student Management/i })).toBeVisible();
    
    // Open modal
    await page.getByRole('button', { name: 'Add Student' }).click();
    
    // Fill out form
    const regNumber = `2024HOD${Date.now()}`;
    await page.locator('input[name="loginIdentifier"]').fill(regNumber);
    await page.locator('input[name="firstName"]').fill('John');
    await page.locator('input[name="lastName"]').fill('Doe');
    await page.locator('input[name="programme"]').fill('BSc Computer Science');
    await page.locator('select[name="level"]').selectOption('100');
    await page.locator('input[name="admissionYear"]').fill('2024');
    
    await page.getByRole('button', { name: 'Register Student' }).click();
    
    // Expect success message and temporary password flash
    const alertBox = page.getByText(/Temporary password for/);
    await expect(alertBox).toBeVisible();
    
    // Extract the temporary password
    const alertText = await alertBox.textContent();
    const tempPassword = alertText.split('is:')[1].trim();
    
    // Log out HOD
    await page.goto('/auth/logout');
    
    // Log in as new student
    await page.getByPlaceholder('Registration Number or Institution Email').fill(regNumber);
    await page.getByPlaceholder('Enter your password').fill(tempPassword);
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Should be redirected to change password
    await expect(page).toHaveURL(/\/auth\/change-password/);
    
    // Change password
    await page.locator('input[name="newPassword"]').fill('newSecurePass123');
    await page.locator('input[name="confirmPassword"]').fill('newSecurePass123');
    await page.getByRole('button', { name: /Update Password/ }).click();
    
    // Should now reach dashboard
    await expect(page).toHaveURL(/\/student\/dashboard/);
  });

  test('TC-E2E-HOD-005: Should manage courses', async ({ page }) => {
    await page.goto('/hod/courses');
    await expect(page.getByRole('heading', { name: /Courses/i })).toBeVisible();
    await page.getByRole('button', { name: 'Add Course' }).click();
    await expect(page.locator('#createCourseModal')).toBeVisible();
  });

  test('TC-E2E-HOD-006: Should manage course offerings', async ({ page }) => {
    await page.goto('/hod/offerings');
    await expect(page.getByRole('heading', { name: /Course Offerings/i })).toBeVisible();
    await page.getByRole('button', { name: 'New Offering' }).click();
    await expect(page.locator('#createOfferingModal')).toBeVisible();
  });
});
