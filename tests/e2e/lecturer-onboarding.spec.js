const { test, expect } = require('@playwright/test');
const mongoose = require('mongoose');

test.describe('Lecturer Onboarding E2E', () => {
  let hodProfileId;
  let departmentId;
  const dbUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/wapts_test';
  
  test.beforeAll(async () => {
    await mongoose.connect(dbUrl);
    await mongoose.connection.db.dropDatabase();
    
    const User = require('../../models/User');
    const Department = require('../../models/Department');
    const HodProfile = require('../../models/HodProfile');
    const SystemSetting = require('../../models/SystemSetting');
    
    // Create System Settings
    await SystemSetting.create({
      allowedEmailDomains: ['university.edu.ng']
    });

    // Create a department
    const dept = await Department.create({
      name: 'Computer Science',
      code: 'CSC',
      description: 'Test Dept'
    });
    departmentId = dept._id.toString();

    // Create HOD
    const hod = await User.create({
      loginIdentifier: 'HOD001',
      loginType: 'ADMIN_USERNAME',
      passwordHash: 'dummy',
      role: 'HOD',
      firstName: 'Jane',
      lastName: 'Doe'
    });
    
    await HodProfile.create({
      userId: hod._id,
      departmentId: dept._id
    });
  });

  test.afterAll(async () => {
    await mongoose.connection.close();
  });

  test('Public submission rejects invalid email domain', async ({ page }) => {
    await page.goto('http://localhost:3000/onboarding/lecturer');
    
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Smith');
    await page.fill('input[name="email"]', 'john@gmail.com');
    await page.fill('input[name="staffNumber"]', 'STAFF001');
    await page.selectOption('select[name="departmentId"]', departmentId);
    
    await page.click('button[type="submit"]');
    
    const errorAlert = page.locator('.alert-danger');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('Please use an institution-issued email address');
  });

  test('Public submission accepts valid data', async ({ page }) => {
    await page.goto('http://localhost:3000/onboarding/lecturer');
    
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Smith');
    await page.fill('input[name="email"]', 'john@university.edu.ng');
    await page.fill('input[name="staffNumber"]', 'STAFF001');
    await page.selectOption('select[name="departmentId"]', departmentId);
    
    await page.click('button[type="submit"]');
    
    const successAlert = page.locator('.alert-success');
    await expect(successAlert).toBeVisible();
    await expect(successAlert).toContainText('Your account request has been successfully submitted');
  });

  test('Duplicate submission is blocked', async ({ page }) => {
    await page.goto('http://localhost:3000/onboarding/lecturer');
    
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Smith');
    await page.fill('input[name="email"]', 'john@university.edu.ng');
    await page.fill('input[name="staffNumber"]', 'STAFF001');
    await page.selectOption('select[name="departmentId"]', departmentId);
    
    await page.click('button[type="submit"]');
    
    const errorAlert = page.locator('.alert-danger');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('pending request already exists');
  });
});
