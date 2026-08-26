"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genererRecommandation = genererRecommandation;
exports.derniereRecommandation = derniereRecommandation;
const supabase_1 = require("../config/supabase");
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
    const { data: etudiant } = await supabase_1.supabaseAdmin
        .from('etudiants')
        .select('nom, prenom, niveau')
        .eq('id', etudiantId)
        .single();
    const justification = await (0, gemini_client_1.callGemini)([
        {
            role: 'user',
            content: `Étudiant: ${etudiant?.prenom} ${etudiant?.nom}, niveau ${etudiant?.niveau ?? 'non renseigné'}.
Scores de compatibilité par filière (0-100): ${JSON.stringify(top)}.
Rédige une explication claire et motivante en français (5-8 phrases) de pourquoi la filière la mieux
notée lui correspond, puis liste 3 technologies, 2 certifications et 2 métiers pertinents.`,
        },
    ], "Tu es le moteur d'orientation académique de la plateforme IAI Horizon. Réponds uniquement en français, de façon concise et professionnelle.", 800);
    const { data: recommandation, error } = await supabase_1.supabaseAdmin
        .from('recommandations')
        .insert({ etudiant_id: etudiantId, justification_texte: justification })
        .select('id, created_at')
        .single();
    if (error)
        throw error;
    await supabase_1.supabaseAdmin.from('scores_filieres').insert(scores.map((s) => ({ recommandation_id: recommandation.id, filiere_id: s.filiere_id, score: s.score })));
    return { recommandation, scores };
}

async function derniereRecommandation(etudiantId) {
    const { data: recommandation } = await supabase_1.supabaseAdmin
        .from('recommandations')
        .select('id, justification_texte, created_at, scores_filieres(filiere_id, score, filieres(nom))')
        .eq('etudiant_id', etudiantId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    return recommandation;
}