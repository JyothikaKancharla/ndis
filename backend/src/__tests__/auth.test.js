process.env.JWT_SECRET = 'test_secret_key';

const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Mock mongoose User model so tests don't need a real DB connection
jest.mock('../models/User');

// ─── POST /api/auth/signup ─────────────────────────────────────────────────

describe('POST /api/auth/signup', () => {
  beforeEach(() => jest.clearAllMocks());

  test('201 - creates a new user with valid data', async () => {
    User.findOne.mockResolvedValue(null); // no existing user
    User.prototype.save = jest.fn().mockResolvedValue();
    User.prototype._id = 'mockId123';
    User.prototype.name = 'Test Staff';
    User.prototype.email = 'staff@test.com';
    User.prototype.role = 'staff';

    const res = await request(app).post('/api/auth/signup').send({
      name: 'Test Staff',
      email: 'staff@test.com',
      password: 'password123',
      role: 'staff',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Signup successful');
  });

  test('400 - rejects duplicate email', async () => {
    User.findOne.mockResolvedValue({ email: 'staff@test.com' }); // user already exists

    const res = await request(app).post('/api/auth/signup').send({
      name: 'Test Staff',
      email: 'staff@test.com',
      password: 'password123',
      role: 'staff',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('User already exists');
  });

  test('400 - rejects invalid role', async () => {
    User.findOne.mockResolvedValue(null);

    const res = await request(app).post('/api/auth/signup').send({
      name: 'Test User',
      email: 'test@test.com',
      password: 'password123',
      role: 'admin', // not a valid role
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Invalid role');
  });

  test('201 - accepts supervisor role', async () => {
    User.findOne.mockResolvedValue(null);
    User.prototype.save = jest.fn().mockResolvedValue();
    User.prototype._id = 'mockId456';
    User.prototype.name = 'Supervisor';
    User.prototype.email = 'sup@test.com';
    User.prototype.role = 'supervisor';

    const res = await request(app).post('/api/auth/signup').send({
      name: 'Supervisor',
      email: 'sup@test.com',
      password: 'password123',
      role: 'supervisor',
    });

    expect(res.statusCode).toBe(201);
  });

  test('201 - accepts government role', async () => {
    User.findOne.mockResolvedValue(null);
    User.prototype.save = jest.fn().mockResolvedValue();
    User.prototype._id = 'mockId789';
    User.prototype.name = 'Gov User';
    User.prototype.email = 'gov@test.com';
    User.prototype.role = 'government';

    const res = await request(app).post('/api/auth/signup').send({
      name: 'Gov User',
      email: 'gov@test.com',
      password: 'password123',
      role: 'government',
    });

    expect(res.statusCode).toBe(201);
  });
});

// ─── POST /api/auth/login ──────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  beforeEach(() => jest.clearAllMocks());

  test('200 - returns token on valid credentials', async () => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    User.findOne.mockResolvedValue({
      _id: 'userId1',
      name: 'Staff User',
      email: 'staff@test.com',
      password: hashedPassword,
      role: 'staff',
      isActive: true,
      profilePic: null,
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'staff@test.com',
      password: 'password123',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('staff');
  });

  test('401 - rejects wrong password', async () => {
    const hashedPassword = await bcrypt.hash('correctPassword', 10);
    User.findOne.mockResolvedValue({
      _id: 'userId1',
      email: 'staff@test.com',
      password: hashedPassword,
      role: 'staff',
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'staff@test.com',
      password: 'wrongPassword',
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  test('401 - rejects non-existent user', async () => {
    User.findOne.mockResolvedValue(null); // user not found

    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@test.com',
      password: 'password123',
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  test('200 - returned token contains user role', async () => {
    const hashedPassword = await bcrypt.hash('pass123', 10);
    User.findOne.mockResolvedValue({
      _id: 'userId2',
      name: 'Supervisor',
      email: 'sup@test.com',
      password: hashedPassword,
      role: 'supervisor',
      isActive: true,
      profilePic: null,
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'sup@test.com',
      password: 'pass123',
    });

    expect(res.statusCode).toBe(200);
    // Decode token payload (base64 middle part)
    const payload = JSON.parse(Buffer.from(res.body.token.split('.')[1], 'base64').toString());
    expect(payload.role).toBe('supervisor');
  });
});

// ─── GET /api/health ───────────────────────────────────────────────────────

describe('GET /api/health', () => {
  test('200 - health check passes', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
