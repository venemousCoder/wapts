const adminController = require('../../../controllers/adminController');
const SystemSetting = require('../../../models/SystemSetting');
const AcademicSession = require('../../../models/AcademicSession');
const Semester = require('../../../models/Semester');
const GradeScale = require('../../../models/GradeScale');
const Classification = require('../../../models/Classification');
const ResponseHandler = require('../../../utils/responseHandler');

jest.mock('../../../models/SystemSetting');
jest.mock('../../../models/AcademicSession');
jest.mock('../../../models/Semester');
jest.mock('../../../models/GradeScale');
jest.mock('../../../models/Classification');
jest.mock('../../../utils/responseHandler');

describe('AdminController Settings', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      xhr: true,
      headers: { accept: 'application/json' },
      query: {},
      body: {}
    };
    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getSettings', () => {
    it('should fetch settings and dropdown options and return json if xhr', async () => {
      const mockSettings = { currentAcademicSession: 'session1' };
      const mockSessions = [{ _id: '1', name: '2026/2027' }];
      const mockSemesters = [{ _id: '2', name: 'First Semester' }];
      const mockGradeScales = [{ _id: '3', name: 'Undergraduate' }];
      
      SystemSetting.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockSettings)
        })
      });

      AcademicSession.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockSessions)
        })
      });

      Semester.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockSemesters)
          })
        })
      });

      GradeScale.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockGradeScales)
      });
      
      Classification.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([])
      });

      await adminController.getSettings(req, res, next);

      expect(ResponseHandler.success).toHaveBeenCalledWith(res, expect.objectContaining({
        settings: mockSettings,
        academicSessions: mockSessions,
        semesters: mockSemesters,
        gradeScales: mockGradeScales
      }));
    });
  });

  describe('putSettings', () => {
    it('should save settings transparently and convert falsy selections to null', async () => {
      req.body = {
        currentAcademicSession: '',
        currentSemester: '',
        activeGradeScale: ''
      };

      const mockSave = jest.fn();
      SystemSetting.findOne.mockResolvedValue({
        save: mockSave
      });

      await adminController.putSettings(req, res, next);

      expect(mockSave).toHaveBeenCalled();
      expect(ResponseHandler.success).toHaveBeenCalled();
    });

    it('should throw an error if selected semester does not belong to selected academic session', async () => {
      req.body = {
        currentAcademicSession: 'sess123',
        currentSemester: 'sem123'
      };

      Semester.findById.mockResolvedValue({
        _id: 'sem123',
        sessionId: 'differentSession'
      });

      await adminController.putSettings(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toBe('Selected Semester does not belong to the selected Academic Session.');
    });
  });
});
