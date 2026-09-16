"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genererRecommandation = genererRecommandation;
exports.derniereRecommandation = derniereRecommandation;
const { query } = require("../config/database");
const scoring_service_1 = require("../scoring/scoring.service");
const gemini_client_1 = require("./gemini.client");

async function genererRecommandation(etudiantId) {
    const scores = await (0, scoring_service_1.calculerScoresFilieres)(etudiantId);
    if (scores.length === 0) {
        const err = new Error('Données insuffisantes pour générer une recommandation');
        err.status = 422;
        throw err;
    }
    const top = scores.slice(0, 3);
    const { rows: etudiantRows } = await query(
        `SELECT nom, prenom, niveau FROM etudiants WHERE id = $1`,
        [etudiantId]
    );
    const etudiant = etudiantRows[0];
    const justification = await (0, gemini_client_1.callGemini)([
        {
            role: 'user',
            content: `Étudiant: ${etudiant?.prenom} ${etudiant?.nom}, niveau ${etudiant?.niveau ?? 'non renseigné'}.
Scores de compatibilité par filière (0-100): ${JSON.stringify(top)}.
Rédige une explication claire et motivante en français (5-8 phrases) de pourquoi la filière la mieux
notée lui correspond, puis liste 3 technologies, 2 certifications et 2 métiers pertinents.`,
        },
    ], "Tu es le moteur d'orientation académique de la plateforme IAI Horizon. Réponds uniquement en français, de façon concise et professionnelle.", 800);
    const { rows: recommandationRows } = await query(
        `INSERT INTO recommandations (etudiant_id, justification_texte) VALUES ($1, $2) RETURNING id, created_at`,
        [etudiantId, justification]
    );
    const recommandation = recommandationRows[0];
    for (const s of scores) {
        await query(
            `INSERT INTO scores_filieres (recommandation_id, filiere_id, score) VALUES ($1, $2, $3)`,
            [recommandation.id, s.filiere_id, s.score]
        );
    }
    return { recommandation, scores };
}

async function derniereRecommandation(etudiantId) {
    const { rows } = await query(
        `SELECT id, justification_texte, created_at FROM recommandations
         WHERE etudiant_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [etudiantId]
    );
    const recommandation = rows[0];
    if (!recommandation) return null;
    const { rows: scoresFilieres } = await query(
        `SELECT s.filiere_id, s.score, json_build_object('nom', f.nom) AS filieres
         FROM scores_filieres s JOIN filieres f ON f.id = s.filiere_id
         WHERE s.recommandation_id = $1`,
        [recommandation.id]
    );
    return { ...recommandation, scores_filieres: scoresFilieres };
}
