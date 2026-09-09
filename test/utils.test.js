process.env.JWT_SECRET = 'test-secret';
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

const { hashPassword, comparePassword } = require('../utils/password');
const { signToken, verifyToken } = require('../utils/jwt');
const { ok, fail } = require('../utils/response');

function mockRes() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe('utils/password', () => {
  test('hashPassword produces a hash different from the plain password', async () => {
    const hash = await hashPassword('MonMotDePasse123');
    expect(hash).not.toBe('MonMotDePasse123');
    expect(hash.length).toBeGreaterThan(20);
  });

  test('comparePassword returns true for the correct password and false otherwise', async () => {
    const hash = await hashPassword('MonMotDePasse123');
    await expect(comparePassword('MonMotDePasse123', hash)).resolves.toBe(true);
    await expect(comparePassword('MauvaisMotDePasse', hash)).resolves.toBe(false);
  });
});

describe('utils/jwt', () => {
  test('signToken then verifyToken returns the original payload', () => {
    const payload = { id: 'u1', email: 'a@b.com', role: 'etudiant', profileId: 'e1' };
    const token = signToken(payload);
    const decoded = verifyToken(token);
    expect(decoded).toMatchObject(payload);
  });

  test('verifyToken throws for an invalid token', () => {
    expect(() => verifyToken('not-a-valid-token')).toThrow();
  });
});

describe('utils/response', () => {
  test('ok() returns a 200 JSON envelope by default', () => {
    const res = mockRes();
    ok(res, { foo: 'bar' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true, data: { foo: 'bar' } });
  });

  test('fail() returns the given status and message', () => {
    const res = mockRes();
    fail(res, 'Erreur', 422, { field: 'invalide' });
    expect(res.statusCode).toBe(422);
    expect(res.body).toEqual({ success: false, message: 'Erreur', details: { field: 'invalide' } });
  });
});
