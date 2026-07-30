const lecturerController = require('../../../controllers/lecturerController');
const LecturerProfile = require('../../../models/LecturerProfile');
const CourseOffering = require('../../../models/CourseOffering');
const Assessment = require('../../../models/Assessment');

jest.mock('../../../models/LecturerProfile');
jest.mock('../../../models/CourseOffering');
jest.mock('../../../models/Assessment');

describe('Assessment Creation Validation', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: { _id: 'user123' },
      body: {
        courseOfferingId: 'offering123',
        title: 'Quiz 1',
        assessmentTypeId: 'type123',
        weight: '20',
        maximumMarks: '100',
        status: 'Draft',
        dueDate: '2050-01-01'
      }
    };
    res = {
      redirect: jest.fn()
    };
    next = jest.fn();

    LecturerProfile.findOne.mockResolvedValue({ _id: 'lecturer123' });
    CourseOffering.findById.mockResolvedValue({ lecturerId: 'lecturer123' });
    Assessment.findOne.mockResolvedValue(null); // No duplicate title
    Assessment.find.mockResolvedValue([]); // No existing assessments for weight sum
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should redirect with success when valid', async () => {
    Assessment.prototype.save = jest.fn().mockResolvedValue();
    await lecturerController.createAssessment(req, res, next);
    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('success='));
  });

  it('should reject maximum marks <= 0', async () => {
    req.body.maximumMarks = '-10';
    await lecturerController.createAssessment(req, res, next);
    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('error=Maximum%20Marks%20must%20be%20greater%20than%20zero.'));
  });

  it('should reject duplicate titles', async () => {
    Assessment.findOne.mockResolvedValue({ title: 'Quiz 1' });
    await lecturerController.createAssessment(req, res, next);
    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('error=An%20assessment%20with%20this%20title%20already%20exists'));
  });

  it('should reject past due dates', async () => {
    req.body.dueDate = '2000-01-01';
    await lecturerController.createAssessment(req, res, next);
    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('error=Due%20date%20cannot%20be%20in%20the%20past.'));
  });

  it('should reject weight exceeding 100%', async () => {
    Assessment.find.mockResolvedValue([{ weight: 90 }]); // 90 + 20 = 110 > 100
    await lecturerController.createAssessment(req, res, next);
    expect(res.redirect).toHaveBeenCalledWith(expect.stringContaining('error=Assessment%20weight%20exceeds%20the%20remaining%20allowable%20weight.'));
  });
});
