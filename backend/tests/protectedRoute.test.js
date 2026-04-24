const request = require('supertest');

// Ensure a value is set before the app loads — auth middleware reads it.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const app = require('../src/server');

describe('Protected route', () => {
  test('GET /api/auth/me without a token returns 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Not authenticated' });
  });

  test('GET /api/auth/me with an invalid token returns 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', ['token=not-a-real-jwt']);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid or expired token' });
  });
});
