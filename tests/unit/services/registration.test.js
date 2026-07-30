const mongoose = require('mongoose');
const RegistrationService = require('../../../services/RegistrationService');
const Enrollment = require('../../../models/Enrollment');
const CourseOffering = require('../../../models/CourseOffering');
const Result = require('../../../models/Result');
const SystemSetting = require('../../../models/SystemSetting');
const StudentProfile = require('../../../models/StudentProfile');

describe('RegistrationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerStudent', () => {
    it('should successfully register a student if all rules pass', async () => {
      // Mocked implementations for valid scenario
      StudentProfile.findById = jest.fn().mockResolvedValue({
        _id: 'student123',
        departmentId: 'dept123',
        level: 200
      });
      
      CourseOffering.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: 'offering123',
          courseId: { _id: 'course123', departmentId: 'dept123', creditUnits: 3 },
          status: 'Published',
          sessionId: 'session123',
          semesterId: 'semester123'
        })
      });

      SystemSetting.findOne = jest.fn().mockResolvedValue({
        currentAcademicSession: 'session123',
        currentSemester: 'semester123',
        maxCreditLoad: 24
      });

      Enrollment.findOne = jest.fn().mockResolvedValue(null);
      Enrollment.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue([])
      });

      Result.findOne = jest.fn().mockResolvedValue(null);

      const saveMock = jest.fn().mockResolvedValue(true);
      jest.spyOn(Enrollment.prototype, 'save').mockImplementation(saveMock);
      CourseOffering.findByIdAndUpdate = jest.fn().mockResolvedValue(true);
      RegistrationService.logAction = jest.fn().mockResolvedValue(true);

      const result = await RegistrationService.registerStudent('student123', 'offering123', 'coord123');
      expect(result).toBeDefined();
      expect(saveMock).toHaveBeenCalled();
    });

    it('should throw if course offering is not published', async () => {
      StudentProfile.findById = jest.fn().mockResolvedValue({ departmentId: 'dept123' });
      CourseOffering.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          courseId: { departmentId: 'dept123' },
          status: 'Draft'
        })
      });

      await expect(RegistrationService.registerStudent('student123', 'offering123', 'coord123'))
        .rejects.toThrow('Course offering is not published');
    });

    it('should throw if maximum credit load is exceeded', async () => {
      StudentProfile.findById = jest.fn().mockResolvedValue({ departmentId: 'dept123' });
      CourseOffering.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          courseId: { _id: 'course1', departmentId: 'dept123', creditUnits: 6 },
          status: 'Published',
          sessionId: 'session123',
          semesterId: 'semester123'
        })
      });

      SystemSetting.findOne = jest.fn().mockResolvedValue({
        currentAcademicSession: 'session123',
        currentSemester: 'semester123',
        maxCreditLoad: 24
      });

      Enrollment.findOne = jest.fn().mockResolvedValue(null);
      Enrollment.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue([
          { courseOfferingId: { sessionId: 'session123', semesterId: 'semester123', courseId: { creditUnits: 20 } } }
        ])
      });

      await expect(RegistrationService.registerStudent('student123', 'offering123', 'coord123'))
        .rejects.toThrow('Maximum credit load');
    });
  });
});
