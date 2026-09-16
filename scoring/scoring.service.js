"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculerScoresFilieres = calculerScoresFilieres;
const { query } = require("../config/database");
const NIVEAU_POIDS = { debutant: 1, intermediaire: 2, avance: 3 };
/**
 * Moteur de scoring PUR (aucun appel IA ici, cf. découpage backend fourni :
 * "scoring/ -> moteur de scoring (logique pure, sans IA)").
 * Le score représente une compatibilité étudiant <-> filière basée sur les
 * critères pondérés définis dans filiere_criteres (competence / interet / matiere).
 */
async function calculerScoresFilieres(etudiantId) {
    const [signaux, { rows: filiereRows }] = await Promise.all([
        getSignauxEtudiant(etudiantId),
        query('SELECT id, nom FROM filieres'),
    ]);
    for (const filiere of filiereRows) {
        const { rows: criteres } = await query(
            'SELECT id, type, nom, poids FROM filiere_criteres WHERE filiere_id = $1',
            [filiere.id]
        );
        filiere.filiere_criteres = criteres;
    }
    const scores = filiereRows.map((filiere) => {
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
    const [{ rows: competences }, { rows: interets }] = await Promise.all([
        query('SELECT competence_nom, niveau FROM etudiant_competences WHERE etudiant_id = $1', [etudiantId]),
        query('SELECT domaine FROM etudiant_interets WHERE etudiant_id = $1', [etudiantId]),
    ]);
    return { competences, interets };
}
