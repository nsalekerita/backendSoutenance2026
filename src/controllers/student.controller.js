const supabase = require('../config/supabase');
const { ok, fail } = require('../utils/response');

// GET /api/students/me
async function getMyProfile(req, res) {
  const { data, error } = await supabase
    .from('etudiants')
    .select('*, notes(*), competences_etudiant(*, competence:competences(*))')
    .eq('utilisateur_id', req.user.id)
    .single();
  if (error) return fail(res, error.message, 500);
  return ok(res, data);
}

// PUT /api/students/me  { photo_url, filiere, niveau, centres_interet, objectifs_professionnels }
async function updateMyProfile(req, res) {
  const { photo_url, filiere, niveau, centres_interet, objectifs_professionnels } = req.body;
  const { data, error } = await supabase
    .from('etudiants')
    .update({ photo_url, filiere, niveau, centres_interet, objectifs_professionnels })
    .eq('utilisateur_id', req.user.id)
    .select()
    .single();
  if (error) return fail(res, error.message, 500);
  return ok(res, data, 'Profil mis a jour');
}

// POST /api/students/me/notes  { matiere, note }
async function addNote(req, res) {
  const { matiere, note } = req.body;
  if (!matiere || note == null) return fail(res, 'matiere et note requis', 422);

  const { data: etudiant } = await supabase
    .from('etudiants')
    .select('id')
    .eq('utilisateur_id', req.user.id)
    .single();

  const { data, error } = await supabase
    .from('notes')
    .upsert({ etudiant_id: etudiant.id, matiere, note }, { onConflict: 'etudiant_id,matiere' })
    .select()
    .single();
  if (error) return fail(res, error.message, 500);
  return ok(res, data, 'Note enregistree');
}

// POST /api/students/me/competences  { competence_id, niveau }
async function addCompetence(req, res) {
  const { competence_id, niveau } = req.body;
  if (!competence_id || !niveau) return fail(res, 'competence_id et niveau requis', 422);

  const { data: etudiant } = await supabase
    .from('etudiants')
    .select('id')
    .eq('utilisateur_id', req.user.id)
    .single();

  const { data, error } = await supabase
    .from('competences_etudiant')
    .upsert({ etudiant_id: etudiant.id, competence_id, niveau }, { onConflict: 'etudiant_id,competence_id' })
    .select()
    .single();
  if (error) return fail(res, error.message, 500);
  return ok(res, data, 'Competence enregistree');
}

// POST /api/students/me/orientation-test  { reponses: [...] }
// Cf. use case "Effectuer test" -> delegue le calcul du score au service IA
async function submitOrientationTest(req, res) {
  const { reponses } = req.body;
  if (!Array.isArray(reponses) || reponses.length === 0) {
    return fail(res, 'reponses (tableau) requis', 422);
  }

  const { data: etudiant } = await supabase
    .from('etudiants')
    .select('id')
    .eq('utilisateur_id', req.user.id)
    .single();

  const { data, error } = await supabase
    .from('tests_orientation')
    .insert({ etudiant_id: etudiant.id, reponses })
    .select()
    .single();
  if (error) return fail(res, error.message, 500);

  return ok(res, data, 'Test enregistre. Utilisez /api/ai/score pour generer votre recommandation.', 201);
}

// GET /api/students/me/recommendations
async function getMyRecommendations(req, res) {
  const { data: etudiant } = await supabase
    .from('etudiants')
    .select('id')
    .eq('utilisateur_id', req.user.id)
    .single();

  const { data, error } = await supabase
    .from('recommandations')
    .select('*, specialisation:specialisations(*)')
    .eq('etudiant_id', etudiant.id)
    .order('created_at', { ascending: false });
  if (error) return fail(res, error.message, 500);
  return ok(res, data);
}

module.exports = {
  getMyProfile,
  updateMyProfile,
  addNote,
  addCompetence,
  submitOrientationTest,
  getMyRecommendations,
};
