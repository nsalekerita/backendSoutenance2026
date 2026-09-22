"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envoyerMessage = envoyerMessage;
exports.historiqueConversation = historiqueConversation;
exports.construireContexteProfil = construireContexteProfil;
const supabase_1 = require("../config/supabase");
const gemini_client_1 = require("./gemini.client");

const MAX_PIECE_JOINTE_BYTES = 5 * 1024 * 1024;

async function rechercherContexte(question) {
    const { data } = await supabase_1.supabaseAdmin
        .from('base_connaissances')
        .select('type, contenu')
        .textSearch('contenu', question.split(' ').slice(0, 6).join(' | '), { type: 'websearch' })
        .limit(5);
    return data ?? [];
}

async function construireContexteProfil(etudiantId) {
    const [{ data: etudiant }, { data: competences }, { data: interets }, { data: wizard }, { data: notes }, { data: offres }, { data: scores }] = await Promise.all([
        supabase_1.supabaseAdmin
            .from('etudiants')
            .select('nom, prenom, niveau, filiere, specialite')
            .eq('id', etudiantId)
            .single(),
        supabase_1.supabaseAdmin.from('etudiant_competences').select('competence_nom, niveau').eq('etudiant_id', etudiantId),
        supabase_1.supabaseAdmin.from('etudiant_interets').select('domaine').eq('etudiant_id', etudiantId),
        supabase_1.supabaseAdmin.from('wizard_reponses').select('question_id, reponse, profils_wizard!inner(etudiant_id)').eq('profils_wizard.etudiant_id', etudiantId),
        supabase_1.supabaseAdmin.from('etudiant_notes').select('nom_fichier, semestre, chemin_fichier, url').eq('etudiant_id', etudiantId).order('created_at', { ascending: false }).limit(5),
        supabase_1.supabaseAdmin.from('offres').select('id, titre, description, type, competences_requises, filieres_ciblees, localisation, date_limite').eq('statut', 'validee').order('created_at', { ascending: false }).limit(10),
        supabase_1.supabaseAdmin.from('recommandations').select('scores_filieres(filiere_id, score, filieres(nom))').eq('etudiant_id', etudiantId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (!etudiant)
        return { texte: '(profil introuvable)', piecesJointes: [] };
    const lignes = [
        `Nom: ${etudiant.prenom ?? ''} ${etudiant.nom ?? ''}`.trim(),
        `Niveau: ${etudiant.niveau ?? 'non renseigné'}`,
        `Filière: ${etudiant.filiere ?? 'non renseignée'}${etudiant.specialite ? ` (${etudiant.specialite})` : ''}`,
        `Compétences: ${(competences ?? []).map((c) => `${c.competence_nom}${c.niveau ? ` (${c.niveau})` : ''}`).join(', ') || 'aucune renseignée'}`,
        `Centres d'intérêt: ${(interets ?? []).map((i) => i.domaine).join(', ') || 'aucun renseigné'}`,
        `Réponses au test d'orientation: ${(wizard ?? []).map((r) => `${r.question_id}: ${JSON.stringify(r.reponse)}`).join(' | ') || 'aucune réponse enregistrée'}`,
        `Dernière recommandation: ${(scores?.scores_filieres ?? []).map((s) => `${s.filieres?.nom ?? s.filiere_id} (${s.score}%)`).join(', ') || 'aucune recommandation générée'}`,
        `CV: ${etudiant.cv_nom_fichier ?? 'non fourni'}`,
        `Bulletins disponibles: ${(notes ?? []).map((n) => `${n.nom_fichier ?? 'fichier sans nom'}${n.semestre ? ` (${n.semestre})` : ''}`).join(', ') || 'aucun bulletin fourni'}`,
        `Offres validées disponibles: ${(offres ?? []).map((o) => `${o.titre} [${o.type}]${o.localisation ? ` - ${o.localisation}` : ''}`).join(' | ') || 'aucune offre disponible'}`,
    ];
    const piecesJointes = await chargerPiecesJointes(etudiant, notes ?? []);
    return { texte: lignes.join('\n'), piecesJointes };
}

async function chargerPiecesJointes(etudiant, notes) {
    const fichiers = [];
    if (etudiant.cv_chemin)
        fichiers.push({ bucket: 'cvs', chemin: etudiant.cv_chemin });
    for (const note of notes)
        if (note.chemin_fichier)
            fichiers.push({ bucket: 'notes-bulletins', chemin: note.chemin_fichier });

    const pieces = await Promise.all(fichiers.map((fichier) => chargerPieceJointe(fichier.bucket, fichier.chemin)));
    return pieces.filter(Boolean);
}

async function chargerPieceJointe(bucket, chemin) {
    const mimeType = mimeTypePour(chemin);
    if (!mimeType)
        return null;
    const { data, error } = await supabase_1.supabaseAdmin.storage.from(bucket).download(chemin);
    if (error || !data)
        return null;
    const contenu = Buffer.from(await data.arrayBuffer());
    if (contenu.length > MAX_PIECE_JOINTE_BYTES)
        return null;
    return { mimeType, data: contenu.toString('base64') };
}

function mimeTypePour(chemin) {
    const extension = chemin.toLowerCase().split('.').pop();
    return {
        pdf: 'application/pdf',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
    }[extension] ?? null;
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
    else {
        await verifierConversation(convId, etudiantId);
    }
    await supabase_1.supabaseAdmin.from('messages').insert({ conversation_id: convId, role: 'user', contenu });
    const { data: historique } = await supabase_1.supabaseAdmin
        .from('messages')
        .select('role, contenu')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })
        .limit(20);
    const [contexte, contexteProfil] = await Promise.all([
        rechercherContexte(contenu),
        construireContexteProfil(etudiantId),
    ]);
    const contexteTexte = contexte.map((c) => `[${c.type}] ${c.contenu}`).join('\n');
    const messages = (historique ?? []).map((m, index, messages) => ({
        role: m.role,
        content: m.contenu,
        attachments: index === messages.length - 1 ? contexteProfil.piecesJointes : [],
    }));
    const reponse = await (0, gemini_client_1.callGemini)(messages, `Tu es l'assistant IA de la plateforme IAI Horizon (Institut Africain d'Informatique, Cameroun).
Tu aides les étudiants sur leur orientation, les filières, les stages/emplois et leur suivi.
Réponds en français, de façon claire et bienveillante.
Analyse les pièces jointes du CV et des bulletins quand elles sont présentes. Ne fabrique jamais une note, une compétence, une formation ou une offre qui n'apparaît pas dans le profil ou le contexte fourni. Pour une recommandation, explique brièvement les éléments du profil utilisés et propose en priorité les offres réellement listées ci-dessous.
Voici le profil de l'étudiant à qui tu parles, appuie-toi dessus pour personnaliser tes réponses et tes recommandations :
${contexteProfil.texte}

Contexte documentaire additionnel si pertinent :
${contexteTexte || '(aucun contexte spécifique trouvé)'}`, 700);
    await supabase_1.supabaseAdmin.from('messages').insert({ conversation_id: convId, role: 'assistant', contenu: reponse });
    return { conversationId: convId, reponse };
}

async function verifierConversation(conversationId, etudiantId) {
    const { data } = await supabase_1.supabaseAdmin
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('etudiant_id', etudiantId)
        .maybeSingle();
    if (!data) {
        const err = new Error('Conversation introuvable ou non autorisée');
        err.status = 404;
        throw err;
    }
}

async function historiqueConversation(conversationId, etudiantId) {
    await verifierConversation(conversationId, etudiantId);
    const { data } = await supabase_1.supabaseAdmin
        .from('messages')
        .select('role, contenu, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
    return data ?? [];
}