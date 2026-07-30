/**
 * Unit Tests: authMiddleware
 * TC-AUTHMW-001 through TC-AUTHMW-005
 */
const { ensureAuthenticated, ensureRole } = require('../../../middlewares/authMiddleware');

describe('authMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      isAuthenticated: jest.fn(),
      xhr: false,
      headers: { accept: 'text/html' },
      originalUrl: '/student/dashboard',
      user: { role: 'Student' }
    };
    res = {
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      render: jest.fn()
    };
    next = jest.fn();
  });

  describe('ensureAuthenticated', () => {
    test('TC-AUTHMW-001: should call next for authenticated users', () => {
      req.isAuthenticated.mockReturnValue(true);
      ensureAuthenticated(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test('TC-AUTHMW-002: should return 401 JSON for unauthenticated API request', () => {
      req.isAuthenticated.mockReturnValue(false);
      req.originalUrl = '/api/data';
      ensureAuthenticated(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('TC-AUTHMW-003: should redirect for unauthenticated browser request', () => {
      req.isAuthenticated.mockReturnValue(false);
      ensureAuthenticated(req, res, next);
      expect(res.redirect).toHaveBeenCalledWith('/auth/login');
    });
  });

  describe('ensureRole', () => {
    test('TC-AUTHMW-004: should allow matching roles', () => {
      req.isAuthenticated.mockReturnValue(true);
      const middleware = ensureRole(['Student', 'Lecturer']);
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    test('TC-AUTHMW-005: should return 403 for mismatched role on API', () => {
      req.isAuthenticated.mockReturnValue(true);
      req.user.role = 'Student';
      req.originalUrl = '/api/admin';
      req.headers.accept = 'application/json';
      const middleware = ensureRole(['Admin']);
      middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('TC-AUTHMW-006: should redirect to login if not authenticated', () => {
      req.isAuthenticated.mockReturnValue(false);
      const middleware = ensureRole(['Admin']);
      middleware(req, res, next);
      expect(res.redirect).toHaveBeenCalledWith('/auth/login');
    });
  });
});
