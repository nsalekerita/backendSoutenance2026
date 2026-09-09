require('dotenv').config();

const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

  const { data: user, error: userErr } = await supabase
    .from('users')
    .insert({ email, password_hash, role: 'administrateur' })
    .select('id, email')
    .single();

  if (userErr) {
    console.error('Erreur création user:', userErr.message);
    process.exitCode = 1;
    return;
  }

  const { error: adminErr } = await supabase
    .from('administrateurs')
    .insert({ user_id: user.id, nom: nomAdmin });

  if (adminErr) {
    console.error('Erreur création profil administrateur:', adminErr.message);
    process.exitCode = 1;
    return;
  }

  console.log('✅ Compte administrateur créé avec succès :', user.email);
}

main();
