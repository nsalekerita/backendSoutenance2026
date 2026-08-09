const supabase = require('../config/supabase');
const { ok, fail } = require('../utils/response');

// GET /api/admin/users?role=&statut=  -> "Gerer les comptes utilisateurs"
async function listUsers(req, res) {
  const { role, statut } = req.query;
  let query = supabase.from('utilisateurs').select('id, email, nom, role, statut, created_at');
  if (role) query = query.eq('role', role);
  if (statut) query = query.eq('statut', statut);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return fail(res, error.message, 500);
  return ok(res, data);
}

// PATCH /api/admin/users/:id/status  { statut: 'actif' | 'suspendu' } -> valider/suspendre un compte
async function updateUserStatus(req, res) {
  const { statut } = req.body;
  if (!['actif', 'suspendu', 'en_attente'].includes(statut)) {
    return fail(res, 'statut invalide', 422);
  }
  const { data, error } = await supabase
    .from('utilisateurs')
    .update({ statut })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return fail(res, error.message, 500);
  return ok(res, data, 'Statut mis a jour');
}

// GET/POST /api/admin/referentials/:type  (specialisations | certifications | metiers | formations | competences)
async function listReferential(req, res) {
  const table = req.params.type;
  const { data, error } = await supabase.from(table).select('*');
  if (error) return fail(res, error.message, 500);
  return ok(res, data);
}

async function createReferential(req, res) {
  const table = req.params.type;
  const { data, error } = await supabase.from(table).insert(req.body).select().single();
  if (error) return fail(res, error.message, 500);
  return ok(res, data, 'Element ajoute au referentiel', 201);
}

// GET /api/admin/stats -> "Consulter les statistiques globales de la plateforme"
async function globalStats(req, res) {
  const [{ count: nbEtudiants }, { count: nbEntreprises }, { count: nbOffres }, { count: nbCandidatures }] =
    await Promise.all([
      supabase.from('etudiants').select('*', { count: 'exact', head: true }),
      supabase.from('entreprises').select('*', { count: 'exact', head: true }),
      supabase.from('offres').select('*', { count: 'exact', head: true }),
      supabase.from('candidatures').select('*', { count: 'exact', head: true }),
    ]);

  return ok(res, { nbEtudiants, nbEntreprises, nbOffres, nbCandidatures });
}

// GET /api/admin/ai-scores -> "Superviser le fonctionnement des recommandations IA"
async function aiScoresOverview(req, res) {
  const { data, error } = await supabase
    .from('recommandations')
    .select('*, etudiant:etudiants(utilisateur:utilisateurs(nom)), specialisation:specialisations(nom)')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) return fail(res, error.message, 500);
  return ok(res, data);
}

module.exports = {
  listUsers,
  updateUserStatus,
  listReferential,
  createReferential,
  globalStats,
  aiScoresOverview,
};
