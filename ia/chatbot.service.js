"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envoyerMessage = envoyerMessage;
exports.historiqueConversation = historiqueConversation;
const supabase_1 = require("../config/supabase");
const gemini_client_1 = require("./gemini.client");

async function rechercherContexte(question) {
    const { data } = await supabase_1.supabaseAdmin
        .from('base_connaissances')
        .select('type, contenu')
        .textSearch('contenu', question.split(' ').slice(0, 6).join(' | '), { type: 'websearch' })
        .limit(5);
    return data ?? [];
}

async function envoyerMessage(etudiantId, conversationId, contenu) {
    let convId = conversationId;
    if (!convId) {
        const { data, error } = await supabase_1.supabaseAdmin
            .from('conversations')
            .insert({ etudiant_id: etudiantId, type: 'chatbot_suivi' })
            .select('id')
            .single();
        if (error)
            throw error;
        convId = data.id;
    }
    await supabase_1.supabaseAdmin.from('messages').insert({ conversation_id: convId, role: 'user', contenu });
    const { data: historique } = await supabase_1.supabaseAdmin
        .from('messages')
        .select('role, contenu')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })
        .limit(20);
    const contexte = await rechercherContexte(contenu);
    const contexteTexte = contexte.map((c) => `[${c.type}] ${c.contenu}`).join('\n');
    const reponse = await (0, gemini_client_1.callGemini)((historique ?? []).map((m) => ({ role: m.role, content: m.contenu })), `Tu es l'assistant IA de la plateforme IAI Horizon (Institut Africain d'Informatique, Cameroun).
Tu aides les étudiants sur leur orientation, les filières, les stages/emplois et leur suivi.
Réponds en français, de façon claire et bienveillante. Utilise ce contexte si pertinent :
${contexteTexte || '(aucun contexte spécifique trouvé)'}`, 700);
    await supabase_1.supabaseAdmin.from('messages').insert({ conversation_id: convId, role: 'assistant', contenu: reponse });
    return { conversationId: convId, reponse };
}

async function historiqueConversation(conversationId) {
    const { data } = await supabase_1.supabaseAdmin
        .from('messages')
        .select('role, contenu, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
    return data ?? [];
}