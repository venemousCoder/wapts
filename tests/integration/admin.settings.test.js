const request = require('supertest');
const app = require('../../app');
const mongoose = require('mongoose');
const { createAdmin, createAcademicSession, createSemester, createGradeScale } = require('../helpers/testHelpers');
const SystemSetting = require('../../models/SystemSetting');

describe('Admin Settings Integration', () => {
  let adminCookie;
  let session;
  let semester;
  let gradeScale;

  beforeAll(async () => {
    // Standard setup
  });

  beforeEach(async () => {
    const admin = await createAdmin('admin_settings_test');
    
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ loginIdentifier: admin.loginIdentifier, password: 'password123', loginType: 'ADMIN_USERNAME' });
    
    adminCookie = loginRes.headers['set-cookie'];

    session = await createAcademicSession('2026/2027');
    semester = await createSemester(session._id, 'First Semester');
    gradeScale = await createGradeScale('Undergraduate Scale');
  });

  afterEach(async () => {
    await mongoose.connection.db.dropDatabase();
  });

  it('should successfully save valid settings with references', async () => {
    const res = await request(app)
      .post('/admin/settings')
      .set('Cookie', adminCookie)
      .set('Accept', 'application/json')
      .send({
        currentAcademicSession: session._id.toString(),
        currentSemester: semester._id.toString(),
        activeGradeScale: gradeScale._id.toString()
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const setting = await SystemSetting.findOne();
    expect(setting.currentAcademicSession.toString()).toBe(session._id.toString());
    expect(setting.currentSemester.toString()).toBe(semester._id.toString());
    expect(setting.activeGradeScale.toString()).toBe(gradeScale._id.toString());
  });

  it('should reject semester that does not belong to the selected session', async () => {
    const otherSession = await createAcademicSession('2027/2028');
    
    const res = await request(app)
      .post('/admin/settings')
      .set('Cookie', adminCookie)
      .set('Accept', 'application/json')
      .send({
        currentAcademicSession: otherSession._id.toString(),
        currentSemester: semester._id.toString(), // Belongs to 'session', not 'otherSession'
        activeGradeScale: gradeScale._id.toString()
      });

    expect(res.status).toBe(500); // Wait, next(err) throws 500
    expect(res.body.message).toBe('Selected Semester does not belong to the selected Academic Session.');
  });
});
