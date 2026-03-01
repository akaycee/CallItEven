const { admin } = require('../../middleware/admin');

describe('Admin Middleware', () => {
  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call next when user is admin', async () => {
    const req = { user: { isAdmin: true } };
    const res = mockRes();
    const next = jest.fn();

    await admin(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 403 when user is not admin', async () => {
    const req = { user: { isAdmin: false } };
    const res = mockRes();
    const next = jest.fn();

    await admin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Access denied. Admin privileges required.',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 when user object is missing', async () => {
    const req = {};
    const res = mockRes();
    const next = jest.fn();

    await admin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 when isAdmin is undefined', async () => {
    const req = { user: {} };
    const res = mockRes();
    const next = jest.fn();

    await admin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
