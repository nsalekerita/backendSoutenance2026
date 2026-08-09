const jwt = require('jsonwebtoken');
const { fail } = require('../utils/response');

// Verifie le token JWT et attache req.user = { id, role }
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return fail(res, 'Authentification requise', 401);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, role: 'etudiant' | 'entreprise' | 'admin' }
    next();
  } catch (err) {
    return fail(res, 'Token invalide ou expire', 401);
  }
}

// Restreint l'acces a certains roles: requireRole('admin'), requireRole('entreprise','admin')
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return fail(res, 'Acces non autorise pour ce role', 403);
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
