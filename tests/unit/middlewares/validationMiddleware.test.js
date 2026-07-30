/**
 * Unit Tests: validationMiddleware
 * TC-VALMW-001 through TC-VALMW-003
 */
const { validationResult } = require('express-validator');
const { validate } = require('../../../middlewares/validationMiddleware');

// Mock express-validator
jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

describe('validationMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      xhr: false,
      headers: { accept: 'text/html' },
      originalUrl: '/student/enroll',
      session: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      redirect: jest.fn()
    };
    next = jest.fn();
  });

  test('TC-VALMW-001: should call next when no validation errors', () => {
    validationResult.mockReturnValue({ isEmpty: () => true, array: () => [] });
    validate(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('TC-VALMW-002: should return 422 JSON for API requests with errors', () => {
    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => [{ param: 'email', msg: 'Email is required' }]
    });
    req.originalUrl = '/api/users';
    validate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(422);
  });

  test('TC-VALMW-003: should redirect back for browser requests with errors', () => {
    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => [{ param: 'name', msg: 'Name is required' }]
    });
    validate(req, res, next);
    expect(res.redirect).toHaveBeenCalledWith('back');
    expect(req.session.errors).toBeDefined();
  });
});
