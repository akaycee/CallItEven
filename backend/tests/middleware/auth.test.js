const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { protect } = require('../../middleware/auth');
const User = require('../../models/User');

require('../setup');

describe('Auth Middleware', () => {
  let user, token;

  beforeEach(async () => {
    user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });
    token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
  });

  const mockReq = (authHeader) => ({
    headers: {
      authorization: authHeader,
    },
  });

  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  const mockNext = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should attach user to req and call next with valid token', async () => {
    const req = mockReq(`Bearer ${token}`);
    const res = mockRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user._id.toString()).toBe(user._id.toString());
    expect(req.user.password).toBeUndefined();
  });

  it('should return 401 when no authorization header', async () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized, no token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when token is invalid', async () => {
    const req = mockReq('Bearer invalidtoken');
    const res = mockRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized, token failed' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when user no longer exists', async () => {
    // Delete the user after creating the token
    await User.findByIdAndDelete(user._id);

    const req = mockReq(`Bearer ${token}`);
    const res = mockRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when token is expired', async () => {
    const expiredToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '0s' });

    // Small delay to ensure expiration
    await new Promise(resolve => setTimeout(resolve, 100));

    const req = mockReq(`Bearer ${expiredToken}`);
    const res = mockRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should not include password in req.user', async () => {
    const req = mockReq(`Bearer ${token}`);
    const res = mockRes();
    const next = jest.fn();

    await protect(req, res, next);

    expect(req.user.password).toBeUndefined();
  });
});
