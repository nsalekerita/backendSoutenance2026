"use strict";
const { supabaseAdmin } = require('../config/supabase');

async function assertRelation(entrepriseId, etudiantId) {
  const { data, error } = await supabaseAdmin.from('candidatures')
    .select('id, offres!inner(entreprise_id)').eq('etudiant_id', etudiantId)
    .eq('offres.entreprise_id', entrepriseId).limit(1);
  if (error) throw error;
  if (!data?.length) { const err = new Error('Aucune candidature ne relie cet étudiant à votre entreprise'); err.status = 403; throw err; }
}

async function getOrCreateConversation(entrepriseId, etudiantId) {
  await assertRelation(entrepriseId, etudiantId);
  let { data, error } = await supabaseAdmin.from('entreprise_conversations').select('id')
    .eq('entreprise_id', entrepriseId).eq('etudiant_id', etudiantId).maybeSingle();
  if (error) throw error;
  if (!data) {
    const result = await supabaseAdmin.from('entreprise_conversations')
      .insert({ entreprise_id: entrepriseId, etudiant_id: etudiantId }).select('id').single();
    if (result.error) throw result.error;
    data = result.data;
  }
  return data.id;
}

async function historique(entrepriseId, etudiantId) {
  const conversationId = await getOrCreateConversation(entrepriseId, etudiantId);
  const { data, error } = await supabaseAdmin.from('entreprise_messages').select('*')
    .eq('conversation_id', conversationId).order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((m) => ({ ...m, is_mine: m.expediteur_type === 'entreprise' }));
}

async function envoyer(entrepriseId, etudiantId, contenu) {
  const conversationId = await getOrCreateConversation(entrepriseId, etudiantId);
  const { data, error } = await supabaseAdmin.from('entreprise_messages').insert({
    conversation_id: conversationId, expediteur_type: 'entreprise', expediteur_id: entrepriseId, contenu,
  }).select().single();
  if (error) throw error;
  return data;
}
module.exports = { historique, envoyer };
