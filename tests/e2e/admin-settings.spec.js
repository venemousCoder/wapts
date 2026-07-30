const { test, expect } = require('@playwright/test');

test.describe('Admin System Settings Configuration', () => {
  test('should allow admin to configure settings using dropdowns and update status panel', async ({ page }) => {
    // Navigate to Login
    await page.goto('/auth/login');
    await page.fill('input[name="loginIdentifier"]', 'admin');
    await page.fill('input[name="password"]', 'admin'); // Assuming seed password
    await page.selectOption('select[name="loginType"]', 'ADMIN_USERNAME');
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await expect(page).toHaveURL(/\/admin\/dashboard/);

    // Navigate to Settings
    await page.click('a[href="/admin/settings"]');
    await expect(page).toHaveURL(/\/admin\/settings/);

    // Ensure we see dropdowns instead of raw text inputs
    const sessionSelect = page.locator('select[name="currentAcademicSession"]');
    const semesterSelect = page.locator('select[name="currentSemester"]');
    const gradeScaleSelect = page.locator('select[name="activeGradeScale"]');
    
    // Check if dropdowns exist (or if it's the empty state, the buttons exist)
    const sessionSelectCount = await sessionSelect.count();
    
    if (sessionSelectCount > 0) {
      // Select an option
      await sessionSelect.selectOption({ index: 1 }); // Select the first available valid option
      await semesterSelect.selectOption({ index: 1 });
      await gradeScaleSelect.selectOption({ index: 1 });

      // Save settings
      await page.click('button:has-text("Save Settings")');

      // Check for success message
      await expect(page.locator('.alert-success')).toBeVisible();

      // Check status panel to ensure it updated from 'Not Set' to an actual text value
      const statusPanelText = await page.locator('.col-lg-4 .card-body').innerText();
      expect(statusPanelText).not.toContain('Not Set'); // Assuming options were actually selected
    } else {
      // Empty state assertions
      await expect(page.locator('text="No Academic Sessions available."')).toBeVisible();
      await expect(page.locator('a:has-text("Create Academic Session")')).toBeVisible();
    }
  });
});
