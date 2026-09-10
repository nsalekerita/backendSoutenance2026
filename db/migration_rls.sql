-- =========================================================
-- ROW LEVEL SECURITY — défense en profondeur
-- =========================================================
-- Le backend utilise exclusivement la clé "service role" (voir
-- config/supabase.js), qui CONTOURNE la RLS quel que soit son état.
-- Activer la RLS ici ne remplace donc pas les vérifications applicatives
-- déjà en place (voir candidatures.service.js / offres.service.js) : c'est
-- un filet de sécurité supplémentaire qui empêche toute lecture/écriture
-- directe depuis un client utilisant la clé "anon" (ex: si elle fuite, ou
-- si un jour une partie du code appelle Supabase depuis le front avec
-- SUPABASE_ANON_KEY). Sans policy explicite, RLS activée = accès refusé
-- par défaut pour les rôles "anon" et "authenticated".
-- À exécuter dans le SQL editor Supabase après db/migration.sql.
-- =========================================================

alter table users enable row level security;
alter table filieres enable row level security;
alter table etudiants enable row level security;
alter table entreprises enable row level security;
alter table administrateurs enable row level security;
alter table filiere_criteres enable row level security;
alter table profils_wizard enable row level security;
alter table wizard_reponses enable row level security;
alter table etudiant_competences enable row level security;
alter table etudiant_interets enable row level security;
alter table recommandations enable row level security;
alter table scores_filieres enable row level security;
alter table offres enable row level security;
alter table candidatures enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table base_connaissances enable row level security;
alter table otp_codes enable row level security;
alter table device_tokens enable row level security;
alter table notifications enable row level security;

-- etudiant_notes est créée hors migration.sql (voir profils.service.js) ;
-- protège-la de la même façon si tu la crées via une migration séparée :
-- alter table etudiant_notes enable row level security;

-- Aucune policy n'est créée : par conception, seul le backend (clé
-- service role) doit accéder à ces données. Si un usage futur nécessite un
-- accès direct depuis le client (ex: lecture publique des offres validées),
-- ajoute une policy ciblée, par exemple :
--
-- create policy "offres_validees_lecture_publique"
--   on offres for select
--   to anon, authenticated
--   using (statut = 'validee');
