const { test, expect } = require('@playwright/test');

test.describe('Lecturer Assessment Creation Flow', () => {
  test('should create, validate, and publish an assessment', async ({ page }) => {
    // Note: Assumes a lecturer is already seeded and logged in.
    // In a real e2e, we would log in here.
    
    // 1. Navigate to Assessments
    await page.goto('/lecturer/assessments');
    
    // If we need to select a course, wait for the form
    if (await page.locator('select#courseOfferingId').isVisible()) {
      await page.selectOption('select#courseOfferingId', { index: 1 });
      await page.click('button:has-text("Load")');
    }

    // 2. Open Create Assessment Modal
    await page.click('button:has-text("New Assessment")');
    await expect(page.locator('#createAssessmentModal')).toBeVisible();

    // 3. Fill details for a Draft Assessment
    await page.fill('input#title', 'Midterm Project');
    await page.selectOption('select#assessmentTypeId', { index: 1 });
    await page.fill('input#maximumMarks', '100');
    await page.fill('input#weight', '50');
    await page.fill('textarea#description', 'Complete chapters 1-5');
    await page.selectOption('select#status', 'Draft');
    
    // 4. Submit
    await page.click('button#submitAssessmentBtn');

    // 5. Verify success message and Draft status
    await expect(page.locator('.alert-success')).toContainText('Assessment saved as Draft.');
    await expect(page.locator('table')).toContainText('Midterm Project');
    await expect(page.locator('table')).toContainText('Draft');
    
    // Ensure "Enter Scores" is NOT visible for Draft
    const publishButton = page.locator('button:has-text("Publish")');
    await expect(publishButton).toBeVisible();

    // 6. Publish the assessment
    await publishButton.click();
    await expect(page.locator('.alert-success')).toContainText('Assessment published successfully.');
    await expect(page.locator('table')).toContainText('Published');
    
    // Ensure "Enter Scores" IS visible for Published
    await expect(page.locator('button:has-text("Enter Scores")')).toBeVisible();

    // 7. Validate cumulative weight (attempt to add 60% when 50% exists)
    await page.click('button:has-text("New Assessment")');
    await page.fill('input#title', 'Final Exam');
    await page.selectOption('select#assessmentTypeId', { index: 1 });
    await page.fill('input#maximumMarks', '100');
    await page.fill('input#weight', '60');
    
    // Frontend validation should show the error and disable the button
    await expect(page.locator('#weightError')).toBeVisible();
    await expect(page.locator('#weightError')).toContainText('exceed 100%');
  });
});
