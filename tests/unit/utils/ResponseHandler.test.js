/**
 * Unit Tests: ResponseHandler
 * TC-RESP-001 through TC-RESP-004
 */
const ResponseHandler = require('../../../utils/responseHandler');

describe('ResponseHandler', () => {
  let res;
  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('success', () => {
    test('TC-RESP-001: should return success JSON with status 200', () => {
      ResponseHandler.success(res, { id: 1 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data: { id: 1 }
      });
    });

    test('TC-RESP-002: should accept custom message and status', () => {
      ResponseHandler.success(res, null, 'Created', 201);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Created',
        data: null
      });
    });
  });

  describe('error', () => {
    test('TC-RESP-003: should return error JSON with specified status', () => {
      ResponseHandler.error(res, 'Not Found', 404);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not Found',
        errors: null
      });
    });

    test('TC-RESP-004: should include error details', () => {
      const errors = [{ field: 'email', msg: 'required' }];
      ResponseHandler.error(res, 'Validation', 422, errors);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation',
        errors
      });
    });
  });
});
