const supabase = require('../config/supabase');
const { computeOfferMatchScore } = require('./ai.service');

// Cas d'utilisation "Recevoir automatiquement la liste des etudiants compatibles avec l'offre publiee"
// Declenche a chaque creation d'offre : calcule un score IA etudiant <-> offre et stocke les meilleurs matchs.
async function computeMatchesForOffer(offreId) {
  const { data: offre } = await supabase.from('offres').select('*').eq('id', offreId).single();
  if (!offre) return;

  const { data: etudiants } = await supabase
    .from('etudiants')
    .select('*, notes(*), competences_etudiant(*, competence:competences(*))')
    .eq('filiere', offre.filiere_cible);

  if (!etudiants || etudiants.length === 0) return;

  const results = [];
  for (const etudiant of etudiants) {
    try {
      const { score, raison } = await computeOfferMatchScore(etudiant, offre);
      if (score >= 60) {
        results.push({ offre_id: offreId, etudiant_id: etudiant.id, score, raison });
      }
    } catch (e) {
      console.error(`Matching echoue pour etudiant ${etudiant.id}:`, e.message);
    }
  }

  if (results.length > 0) {
    await supabase.from('matchs').upsert(results, { onConflict: 'offre_id,etudiant_id' });
  }
}

module.exports = { computeMatchesForOffer };
