const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const { ok, fail } = require('../utils/response');

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/register  { role: 'etudiant' | 'entreprise', email, password, nom, ... }
async function register(req, res) {
  const { role, email, password, nom } = req.body;
  if (!role || !email || !password || !nom) {
    return fail(res, 'Champs requis: role, email, password, nom', 422);
  }
  if (!['etudiant', 'entreprise'].includes(role)) {
    return fail(res, "role doit etre 'etudiant' ou 'entreprise'", 422);
  }

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  if (existing) return fail(res, 'Un compte existe deja avec cet email', 409);

  const password_hash = await bcrypt.hash(password, 10);

  const { data: user, error } = await supabase
    .from('users')
    .insert({ email, password_hash, role, nom, statut: role === 'entreprise' ? 'en_attente' : 'actif' })
    .select()
    .single();
  if (error) return fail(res, error.message, 500);

  // Ligne detail associee (profil etudiant ou fiche entreprise)
  if (role === 'etudiant') {
    await supabase.from('etudiants').insert({ utilisateur_id: user.id });
  } else {
    await supabase.from('entreprises').insert({ utilisateur_id: user.id, nom_entreprise: nom });
  }

  const token = signToken(user);
  return ok(res, { token, user: { id: user.id, role: user.role, email: user.email, statut: user.statut } }, 'Compte cree', 201);
}

// POST /api/auth/login { email, password }
async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return fail(res, 'email et password requis', 422);

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  if (error) return fail(res, error.message, 500);
  if (!user) return fail(res, 'Identifiants invalides', 401);

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) return fail(res, 'Identifiants invalides', 401);

  if (user.role === 'entreprise' && user.statut !== 'actif') {
    return fail(res, "Compte entreprise en attente de validation par l'administrateur", 403);
  }

  const token = signToken(user);
  return ok(res, { token, user: { id: user.id, role: user.role, email: user.email } }, 'Connexion reussie');
}

module.exports = { register, login };
