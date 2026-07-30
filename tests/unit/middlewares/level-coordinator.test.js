const { ensureResponsibility } = require('../../../middlewares/authMiddleware');

describe('ensureResponsibility Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { user: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      render: jest.fn(),
      locals: {}
    };
    next = jest.fn();
  });

  it('should call next() if lecturer has the required responsibility', async () => {
    const LecturerProfile = require('../../../models/LecturerProfile');
    LecturerProfile.findOne = jest.fn().mockResolvedValue({
      responsibilities: ['LEVEL_COORDINATOR']
    });

    const middleware = ensureResponsibility('LEVEL_COORDINATOR');
    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should return 403 and render unauthorized if lecturer lacks the responsibility', async () => {
    const LecturerProfile = require('../../../models/LecturerProfile');
    LecturerProfile.findOne = jest.fn().mockResolvedValue({
      responsibilities: []
    });

    const middleware = ensureResponsibility('LEVEL_COORDINATOR');
    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.render).toHaveBeenCalledWith('errors/unauthorized', expect.any(Object));
  });

  it('should return 403 and render unauthorized if lecturer profile is missing', async () => {
    const LecturerProfile = require('../../../models/LecturerProfile');
    LecturerProfile.findOne = jest.fn().mockResolvedValue(null);

    const middleware = ensureResponsibility('LEVEL_COORDINATOR');
    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.render).toHaveBeenCalledWith('errors/unauthorized', expect.any(Object));
  });
});
