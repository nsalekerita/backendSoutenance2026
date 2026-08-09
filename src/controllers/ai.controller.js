const supabase = require('../config/supabase');
const { ok, fail } = require('../utils/response');
const {
  computeCompatibilityScore,
  generateRecommendations,
  chatbotReply,
} = require('../services/ai.service');

// POST /api/ai/score  { specialisation_id } -> "Consulter son score de compatibilite par specialisation"
async function scoreCompatibility(req, res) {
  const { specialisation_id } = req.body;
  if (!specialisation_id) return fail(res, 'specialisation_id requis', 422);

  const { data: etudiant } = await supabase
    .from('etudiants')
    .select('*, notes(*), competences_etudiant(*, competence:competences(*))')
    .eq('utilisateur_id', req.user.id)
    .single();

  const { data: specialisation } = await supabase
    .from('specialisations')
    .select('*')
    .eq('id', specialisation_id)
    .single();
  if (!specialisation) return fail(res, 'Specialisation introuvable', 404);

  try {
    const { score, explication } = await computeCompatibilityScore(etudiant, specialisation);

    const { data, error } = await supabase
      .from('recommandations')
      .upsert(
        { etudiant_id: etudiant.id, specialisation_id, score, explication },
        { onConflict: 'etudiant_id,specialisation_id' }
      )
      .select()
      .single();
    if (error) return fail(res, error.message, 500);

    return ok(res, data, 'Score calcule');
  } catch (e) {
    return fail(res, `Erreur du moteur IA: ${e.message}`, 502);
  }
}

// POST /api/ai/recommendations -> genere technologies/certifications/formations/metiers
async function recommend(req, res) {
  const { data: etudiant } = await supabase
    .from('etudiants')
    .select('*, notes(*), competences_etudiant(*, competence:competences(*))')
    .eq('utilisateur_id', req.user.id)
    .single();

  try {
    const recommandations = await generateRecommendations(etudiant);
    return ok(res, recommandations, 'Recommandations generees');
  } catch (e) {
    return fail(res, `Erreur du moteur IA: ${e.message}`, 502);
  }
}

// POST /api/ai/chat  { message, historique? } -> cas d'utilisation "Discuter avec l'assistant IA"
async function chat(req, res) {
  const { message, historique } = req.body;
  if (!message) return fail(res, 'message requis', 422);

  const { data: etudiant } = await supabase
    .from('etudiants')
    .select('*')
    .eq('utilisateur_id', req.user.id)
    .single();

  try {
    const reply = await chatbotReply(etudiant, historique, message);

    await supabase.from('messages_chatbot').insert([
      { etudiant_id: etudiant.id, role: 'user', contenu: message },
      { etudiant_id: etudiant.id, role: 'assistant', contenu: reply },
    ]);

    return ok(res, { reply });
  } catch (e) {
    return fail(res, `Erreur du chatbot: ${e.message}`, 502);
  }
}

module.exports = { scoreCompatibility, recommend, chat };
