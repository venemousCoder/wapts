const request = require('supertest');
const app = require('../../app');
const mongoose = require('mongoose');
const { createLecturer, createCourseOffering, createAssessmentType } = require('../helpers/testHelpers');
const Assessment = require('../../models/Assessment');

describe('Lecturer Assessment Integration', () => {
  let lecturerCookie;
  let offering;
  let type;

  beforeAll(async () => {
    // Setup logic goes here
  });

  beforeEach(async () => {
    const lecturer = await createLecturer('test_lecturer_assess');
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ loginIdentifier: lecturer.loginIdentifier, password: 'password123', loginType: 'INSTITUTIONAL_EMAIL' });
    
    lecturerCookie = loginRes.headers['set-cookie'];

    offering = await createCourseOffering(lecturer._id);
    type = await createAssessmentType('Quiz');
  });

  afterEach(async () => {
    await mongoose.connection.db.dropDatabase();
  });

  it('should successfully create a Draft assessment', async () => {
    const res = await request(app)
      .post('/lecturer/assessments')
      .set('Cookie', lecturerCookie)
      .send({
        courseOfferingId: offering._id.toString(),
        title: 'Draft Quiz',
        assessmentTypeId: type._id.toString(),
        weight: '20',
        maximumMarks: '100',
        status: 'Draft'
      });

    expect(res.status).toBe(302);
    expect(res.header.location).toContain('Assessment%20saved%20as%20Draft.');

    const assessment = await Assessment.findOne({ title: 'Draft Quiz' });
    expect(assessment).toBeTruthy();
    expect(assessment.status).toBe('Draft');
  });

  it('should publish a draft assessment', async () => {
    const assessment = new Assessment({
      courseOfferingId: offering._id,
      title: 'To Publish',
      assessmentTypeId: type._id,
      weight: 10,
      maximumMarks: 100,
      status: 'Draft',
      createdBy: new mongoose.Types.ObjectId()
    });
    await assessment.save();

    const res = await request(app)
      .post(`/lecturer/assessments/${assessment._id}/publish`)
      .set('Cookie', lecturerCookie);

    expect(res.status).toBe(302);
    const updated = await Assessment.findById(assessment._id);
    expect(updated.status).toBe('Published');
  });

  it('should prevent cumulative weight > 100', async () => {
    await new Assessment({
      courseOfferingId: offering._id,
      title: 'Existing 90',
      assessmentTypeId: type._id,
      weight: 90,
      maximumMarks: 100,
      status: 'Published',
      createdBy: new mongoose.Types.ObjectId()
    }).save();

    const res = await request(app)
      .post('/lecturer/assessments')
      .set('Cookie', lecturerCookie)
      .send({
        courseOfferingId: offering._id.toString(),
        title: 'New 20',
        assessmentTypeId: type._id.toString(),
        weight: '20', // Total 110 > 100
        maximumMarks: '100',
        status: 'Draft'
      });

    expect(res.status).toBe(302);
    expect(res.header.location).toContain('error=Assessment%20weight%20exceeds');
    
    const count = await Assessment.countDocuments();
    expect(count).toBe(1); // Only the existing one
  });
});
