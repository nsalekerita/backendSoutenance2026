"use strict";
const { query } = require('../config/database');

async function assertRelation(entrepriseId, etudiantId) {
  const { rows } = await query(`SELECT c.id FROM candidatures c JOIN offres o ON o.id=c.offre_id
    WHERE c.etudiant_id=$1 AND o.entreprise_id=$2 LIMIT 1`, [etudiantId, entrepriseId]);
  if (!rows.length) { const err = new Error('Aucune candidature ne relie cet étudiant à votre entreprise'); err.status = 403; throw err; }
}

async function getOrCreateConversation(entrepriseId, etudiantId) {
  await assertRelation(entrepriseId, etudiantId);
  const { rows } = await query(
    `SELECT id FROM entreprise_conversations WHERE entreprise_id = $1 AND etudiant_id = $2`,
    [entrepriseId, etudiantId]
  );
  if (rows[0]) return rows[0].id;
  const { rows: created } = await query(
    `INSERT INTO entreprise_conversations (entreprise_id, etudiant_id) VALUES ($1, $2) RETURNING id`,
    [entrepriseId, etudiantId]
  );
  return created[0].id;
}

async function historique(entrepriseId, etudiantId) {
  const conversationId = await getOrCreateConversation(entrepriseId, etudiantId);
  const { rows } = await query(
    `SELECT * FROM entreprise_messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
    [conversationId]
  );
  return rows.map((m) => ({ ...m, is_mine: m.expediteur_type === 'entreprise' }));
}

async function envoyer(entrepriseId, etudiantId, contenu) {
  const conversationId = await getOrCreateConversation(entrepriseId, etudiantId);
  const { rows } = await query(
    `INSERT INTO entreprise_messages (conversation_id, expediteur_type, expediteur_id, contenu)
     VALUES ($1, 'entreprise', $2, $3) RETURNING *`,
    [conversationId, entrepriseId, contenu]
  );
  return rows[0];
}
module.exports = { historique, envoyer };
