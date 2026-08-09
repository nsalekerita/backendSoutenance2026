const supabase = require('../config/supabase');
const { ok, fail } = require('../utils/response');
const { computeMatchesForOffer } = require('../services/matching.service');

// GET /api/offers?type=stage|emploi&ville=...&filiere=...
async function listOffers(req, res) {
  const { type, ville, filiere } = req.query;
  let query = supabase.from('offres').select('*, entreprise:entreprises(nom_entreprise, ville)').eq('statut', 'publiee');
  if (type) query = query.eq('type', type);
  if (ville) query = query.eq('ville', ville);
  if (filiere) query = query.eq('filiere_cible', filiere);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return fail(res, error.message, 500);
  return ok(res, data);
}

// GET /api/offers/:id  (cas d'utilisation "Consulter offre")
async function getOffer(req, res) {
  const { data, error } = await supabase
    .from('offres')
    .select('*, entreprise:entreprises(nom_entreprise, ville, logo_url)')
    .eq('id', req.params.id)
    .single();
  if (error) return fail(res, 'Offre introuvable', 404);
  return ok(res, data);
}

// POST /api/offers  (entreprise) -> cas d'utilisation "Gerer offres" / "Publier une offre"
async function createOffer(req, res) {
  const { titre, description, type, ville, filiere_cible, competences_requises } = req.body;
  if (!titre || !type) return fail(res, 'titre et type requis', 422);

  const { data: entreprise } = await supabase
    .from('entreprises')
    .select('id')
    .eq('utilisateur_id', req.user.id)
    .single();

  const { data: offre, error } = await supabase
    .from('offres')
    .insert({
      entreprise_id: entreprise.id,
      titre,
      description,
      type,
      ville,
      filiere_cible,
      competences_requises,
      statut: 'publiee',
    })
    .select()
    .single();
  if (error) return fail(res, error.message, 500);

  // Matching automatique etudiants <-> offre (cas d'utilisation "Recevoir automatiquement la liste des etudiants compatibles")
  computeMatchesForOffer(offre.id).catch((e) => console.error('Matching auto echoue:', e.message));

  return ok(res, offre, 'Offre publiee', 201);
}

// PUT /api/offers/:id (entreprise, proprietaire uniquement)
async function updateOffer(req, res) {
  const { data: entreprise } = await supabase
    .from('entreprises')
    .select('id')
    .eq('utilisateur_id', req.user.id)
    .single();

  const { data, error } = await supabase
    .from('offres')
    .update(req.body)
    .eq('id', req.params.id)
    .eq('entreprise_id', entreprise.id)
    .select()
    .single();
  if (error) return fail(res, error.message, 500);
  if (!data) return fail(res, 'Offre introuvable ou non autorisee', 404);
  return ok(res, data, 'Offre mise a jour');
}

// DELETE /api/offers/:id (entreprise ou admin)
async function deleteOffer(req, res) {
  const { error } = await supabase.from('offres').delete().eq('id', req.params.id);
  if (error) return fail(res, error.message, 500);
  return ok(res, null, 'Offre supprimee');
}

// GET /api/offers/:id/matches (entreprise, proprietaire) -> etudiants compatibles calcules par l'IA
async function getOfferMatches(req, res) {
  const { data, error } = await supabase
    .from('matchs')
    .select('*, etudiant:etudiants(*, utilisateur:utilisateurs(nom, email))')
    .eq('offre_id', req.params.id)
    .order('score', { ascending: false });
  if (error) return fail(res, error.message, 500);
  return ok(res, data);
}

module.exports = { listOffers, getOffer, createOffer, updateOffer, deleteOffer, getOfferMatches };
