"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envoyerMessage = envoyerMessage;
exports.historiqueConversation = historiqueConversation;
const { query } = require("../config/database");
const gemini_client_1 = require("./gemini.client");

async function rechercherContexte(question) {
    const termes = question.split(' ').slice(0, 6).join('%');
    const { rows } = await query(
        `SELECT type, contenu FROM base_connaissances WHERE contenu ILIKE $1 LIMIT 5`,
        [`%${termes}%`]
    );
    return rows;
}

async function envoyerMessage(etudiantId, conversationId, contenu) {
    let convId = conversationId;
    if (!convId) {
        const { rows } = await query(
            `INSERT INTO conversations (etudiant_id, type) VALUES ($1, 'chatbot_suivi') RETURNING id`,
            [etudiantId]
        );
        convId = rows[0].id;
    }
    await query(`INSERT INTO messages (conversation_id, role, contenu) VALUES ($1, 'user', $2)`, [convId, contenu]);
    const { rows: historique } = await query(
        `SELECT role, contenu FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC LIMIT 20`,
        [convId]
    );
    const contexte = await rechercherContexte(contenu);
    const contexteTexte = contexte.map((c) => `[${c.type}] ${c.contenu}`).join('\n');
    const reponse = await (0, gemini_client_1.callGemini)((historique ?? []).map((m) => ({ role: m.role, content: m.contenu })), `Tu es l'assistant IA de la plateforme IAI Horizon (Institut Africain d'Informatique, Cameroun).
Tu aides les étudiants sur leur orientation, les filières, les stages/emplois et leur suivi.
Réponds en français, de façon claire et bienveillante. Utilise ce contexte si pertinent :
${contexteTexte || '(aucun contexte spécifique trouvé)'}`, 700);
    await query(`INSERT INTO messages (conversation_id, role, contenu) VALUES ($1, 'assistant', $2)`, [convId, reponse]);
    return { conversationId: convId, reponse };
}

async function historiqueConversation(conversationId) {
    const { rows } = await query(
        `SELECT role, contenu, created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
        [conversationId]
    );
    return rows;
}
