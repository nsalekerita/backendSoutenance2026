const supabase = require('../config/supabase');
const { ok, fail } = require('../utils/response');

// POST /api/applications  { offre_id, cv_url } -> cas d'utilisation "Postuler a une offre"
async function apply(req, res) {
  const { offre_id, cv_url } = req.body;
  if (!offre_id) return fail(res, 'offre_id requis', 422);

  const { data: etudiant } = await supabase
    .from('etudiants')
    .select('id')
    .eq('utilisateur_id', req.user.id)
    .single();

  const { data: existing } = await supabase
    .from('candidatures')
    .select('id')
    .eq('offre_id', offre_id)
    .eq('etudiant_id', etudiant.id)
    .maybeSingle();
  if (existing) return fail(res, 'Vous avez deja postule a cette offre', 409);

  const { data, error } = await supabase
    .from('candidatures')
    .insert({ offre_id, etudiant_id: etudiant.id, cv_url, statut: 'en_attente' })
    .select()
    .single();
  if (error) return fail(res, error.message, 500);
  return ok(res, data, 'Candidature envoyee', 201);
}

// GET /api/applications/me (etudiant) -> suivre sa progression
async function myApplications(req, res) {
  const { data: etudiant } = await supabase
    .from('etudiants')
    .select('id')
    .eq('utilisateur_id', req.user.id)
    .single();

  const { data, error } = await supabase
    .from('candidatures')
    .select('*, offre:offres(titre, type, entreprise:entreprises(nom_entreprise))')
    .eq('etudiant_id', etudiant.id)
    .order('created_at', { ascending: false });
  if (error) return fail(res, error.message, 500);
  return ok(res, data);
}

// GET /api/applications/offer/:offreId (entreprise) -> "Consulter les candidatures recues"
async function applicationsForOffer(req, res) {
  const { data, error } = await supabase
    .from('candidatures')
    .select('*, etudiant:etudiants(*, utilisateur:utilisateurs(nom, email))')
    .eq('offre_id', req.params.offreId)
    .order('created_at', { ascending: false });
  if (error) return fail(res, error.message, 500);
  return ok(res, data);
}

// PATCH /api/applications/:id/accept -> cas d'utilisation "Accepter candidature"
async function accept(req, res) {
  const { data, error } = await supabase
    .from('candidatures')
    .update({ statut: 'acceptee' })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return fail(res, error.message, 500);
  // TODO: notifier l'etudiant (email / notification push)
  return ok(res, data, 'Candidature acceptee');
}

// PATCH /api/applications/:id/refuse -> cas d'utilisation "Refuser candidature"
async function refuse(req, res) {
  const { data, error } = await supabase
    .from('candidatures')
    .update({ statut: 'refusee' })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return fail(res, error.message, 500);
  return ok(res, data, 'Candidature refusee');
}

module.exports = { apply, myApplications, applicationsForOffer, accept, refuse };
