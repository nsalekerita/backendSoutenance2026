const supabase = require('../config/supabase');
const { ok, fail } = require('../utils/response');

// GET /api/companies/me
async function getMyCompany(req, res) {
  const { data, error } = await supabase
    .from('entreprises')
    .select('*, offres(*)')
    .eq('utilisateur_id', req.user.id)
    .single();
  if (error) return fail(res, error.message, 500);
  return ok(res, data);
}

// PUT /api/companies/me
async function updateMyCompany(req, res) {
  const { nom_entreprise, secteur, ville, logo_url, description } = req.body;
  const { data, error } = await supabase
    .from('entreprises')
    .update({ nom_entreprise, secteur, ville, logo_url, description })
    .eq('utilisateur_id', req.user.id)
    .select()
    .single();
  if (error) return fail(res, error.message, 500);
  return ok(res, data, 'Fiche entreprise mise a jour');
}

// GET /api/companies/students?filiere=&competence= -> "Consulter les profils des etudiants (recherche manuelle)"
async function searchStudents(req, res) {
  const { filiere, niveau } = req.query;
  let query = supabase
    .from('etudiants')
    .select('*, utilisateur:utilisateurs(nom, email), competences_etudiant(*, competence:competences(*))');
  if (filiere) query = query.eq('filiere', filiere);
  if (niveau) query = query.eq('niveau', niveau);

  const { data, error } = await query;
  if (error) return fail(res, error.message, 500);
  return ok(res, data);
}

module.exports = { getMyCompany, updateMyCompany, searchStudents };
