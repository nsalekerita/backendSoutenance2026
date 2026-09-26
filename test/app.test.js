process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

const request = require('supertest');
const { app } = require('../app');
const authService = require('../auth/auth.service');
const { signToken } = require('../utils/jwt');

describe('GET /health', () => {
  test('returns 200 and service status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok' });
  });
});

describe('unknown route', () => {
  test('returns 404 with the standard error envelope', async () => {
    const res = await request(app).get('/api/route-inexistante');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false });
  });
});

describe('POST /api/auth/google', () => {
  test('accepts the standard Google credential field and canonicalizes the role', async () => {
    const loginSpy = jest.spyOn(authService, 'loginOrRegisterWithGoogle').mockResolvedValue({
      token: 'google-token',
      user: { id: 'u-1', email: 'google@example.com', role: 'etudiant', profileId: 'p-1' },
    });

    const res = await request(app)
      .post('/api/auth/google')
      .send({ credential: 'fake-google-credential', role: 'ETUDIANT' });

    expect(res.status).toBe(200);
    expect(loginSpy).toHaveBeenCalledWith('fake-google-credential', 'etudiant');
  });
});

describe('protected routes', () => {
  test('reject requests without an Authorization header', async () => {
    const res = await request(app).get('/api/admin/stats');
    expect(res.status).toBe(401);
  });

  test('reject requests with an invalid token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer invalid-token');
    expect(res.status).toBe(401);
  });

  test('protects the specific company offers route before the dynamic /:id route', async () => {
    const res = await request(app).get('/api/offres/entreprise/mes-offres');
    expect(res.status).toBe(401);
  });

  test('protects candidature uploads and company messaging', async () => {
    const upload = await request(app).post('/api/candidatures/upload-url');
    const messages = await request(app).get('/api/messages/conversation/00000000-0000-0000-0000-000000000000');
    expect(upload.status).toBe(401);
    expect(messages.status).toBe(401);
  });

  test('reserves filiere creation for administrators', async () => {
    const token = signToken({ id: 'user-1', email: 'student@example.com', role: 'etudiant', profileId: 'profile-1' });
    const res = await request(app).post('/api/filieres').set('Authorization', `Bearer ${token}`).send({ nom: 'Test' });
    expect(res.status).toBe(403);
  });
});
