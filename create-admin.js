require('dotenv').config();

const bcrypt = require('bcryptjs');
const { transaction, pool } = require('./config/database');

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const nomAdmin = process.env.ADMIN_NOM || 'Administrateur IAI Horizon';

  if (!email || !password) {
    console.error(
      "Erreur: définis ADMIN_EMAIL et ADMIN_PASSWORD (variables d'environnement) avant d'exécuter ce script.\n" +
      'Exemple: ADMIN_EMAIL=admin@exemple.com ADMIN_PASSWORD="MotDePasseSolide123!" node create-admin.js'
    );
    process.exitCode = 1;
    return;
  }
  if (password.length < 8) {
    console.error('Erreur: ADMIN_PASSWORD doit contenir au moins 8 caractères.');
    process.exitCode = 1;
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  const user = await transaction(async (client) => {
    const created = await client.query(
      `INSERT INTO users(email, password_hash, role, email_verifie)
       VALUES($1, $2, 'administrateur', true) RETURNING id, email`,
      [email, password_hash],
    );
    await client.query('INSERT INTO administrateurs(user_id, nom) VALUES($1, $2)', [created.rows[0].id, nomAdmin]);
    return created.rows[0];
  });

  console.log('✅ Compte administrateur créé avec succès :', user.email);
}

main().catch((error) => { console.error('Erreur création administrateur:', error.message); process.exitCode = 1; })
  .finally(() => pool.end());
