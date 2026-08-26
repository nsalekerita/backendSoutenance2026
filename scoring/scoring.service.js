"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculerScoresFilieres = calculerScoresFilieres;
const supabase_1 = require("../config/supabase");
const NIVEAU_POIDS = { debutant: 1, intermediaire: 2, avance: 3 };
/**
 * Moteur de scoring PUR (aucun appel IA ici, cf. découpage backend fourni :
 * "scoring/ -> moteur de scoring (logique pure, sans IA)").
 * Le score représente une compatibilité étudiant <-> filière basée sur les
 * critères pondérés définis dans filiere_criteres (competence / interet / matiere).
 */
async function calculerScoresFilieres(etudiantId) {
    const [{ data: signaux }, { data: filieres }] = await Promise.all([
        getSignauxEtudiant(etudiantId),
        supabase_1.supabaseAdmin.from('filieres').select('id, nom, filiere_criteres(id, type, nom, poids)'),
    ]);
    const scores = (filieres ?? []).map((filiere) => {
        let score = 0;
        let poidsTotal = 0;
        for (const critere of filiere.filiere_criteres ?? []) {
            poidsTotal += Number(critere.poids);
            if (critere.type === 'competence') {
                const match = signaux.competences.find((c) => c.competence_nom.toLowerCase() === critere.nom.toLowerCase());
                if (match)
                    score += Number(critere.poids) * (NIVEAU_POIDS[match.niveau] / 3);
            }
            if (critere.type === 'interet') {
                const match = signaux.interets.find((i) => i.domaine.toLowerCase() === critere.nom.toLowerCase());
                if (match)
                    score += Number(critere.poids);
            }
            // type === 'matiere' : à brancher sur une future table de notes par matière
        }
        const scoreNormalise = poidsTotal > 0 ? Math.round((score / poidsTotal) * 100) : 0;
        return { filiere_id: filiere.id, filiere_nom: filiere.nom, score: scoreNormalise };
    });
    return scores.sort((a, b) => b.score - a.score);
}
async function getSignauxEtudiant(etudiantId) {
    const [{ data: competences }, { data: interets }] = await Promise.all([
        supabase_1.supabaseAdmin.from('etudiant_competences').select('competence_nom, niveau').eq('etudiant_id', etudiantId),
        supabase_1.supabaseAdmin.from('etudiant_interets').select('domaine').eq('etudiant_id', etudiantId),
    ]);
    return { data: { competences: competences ?? [], interets: interets ?? [] } };
}
