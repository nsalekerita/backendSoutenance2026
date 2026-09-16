-- =========================================================
-- MIGRATION SUPABASE — Plateforme IAI Orientation & Entreprises
-- (copie exacte de la migration fournie, à exécuter dans le SQL editor Supabase)
-- =========================================================
create extension if not exists "pgcrypto";
create extension if not exists "vector";

create type user_role as enum ('etudiant', 'administrateur', 'entreprise');
create type niveau_etudiant as enum ('I', 'II', 'III');
create type critere_type as enum ('competence', 'interet', 'matiere');
create type wizard_statut as enum ('en_cours', 'termine');
create type competence_niveau as enum ('debutant', 'intermediaire', 'avance');
create type offre_type as enum ('stage', 'emploi');
create type offre_statut as enum ('en_attente', 'validee', 'rejetee', 'cloturee');
create type candidature_statut as enum ('envoyee', 'vue', 'acceptee', 'refusee');
create type conversation_type as enum ('aide_contextuelle', 'chatbot_suivi');
create type message_role as enum ('user', 'assistant');
create type connaissance_type as enum ('filiere', 'debouche', 'faq', 'offre');

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  role user_role not null,
  created_at timestamptz not null default now()
);

create table filieres (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  description text,
  debouches text,
  niveau_requis text,
  created_at timestamptz not null default now()
);

create table etudiants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  nom text not null,
  prenom text not null,
  niveau niveau_etudiant,
  filiere_actuelle_id uuid references filieres(id) on delete set null
);

create table entreprises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  nom text not null,
  secteur text,
  statut_verification text default 'en_attente',
  created_at timestamptz not null default now()
);

create table administrateurs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  nom text
);

create table filiere_criteres (
  id uuid primary key default gen_random_uuid(),
  filiere_id uuid not null references filieres(id) on delete cascade,
  type critere_type not null,
  nom text not null,
  poids numeric not null default 1
);

create table profils_wizard (
  id uuid primary key default gen_random_uuid(),
  etudiant_id uuid not null references etudiants(id) on delete cascade,
  statut wizard_statut not null default 'en_cours',
  etape_courante int not null default 0,
  updated_at timestamptz not null default now()
);
create trigger trg_profils_wizard_updated_at
before update on profils_wizard
for each row execute function set_updated_at();

create table wizard_reponses (
  id uuid primary key default gen_random_uuid(),
  profil_wizard_id uuid not null references profils_wizard(id) on delete cascade,
  etape int not null,
  question_id text not null,
  reponse jsonb not null,
  created_at timestamptz not null default now()
);

create table etudiant_competences (
  id uuid primary key default gen_random_uuid(),
  etudiant_id uuid not null references etudiants(id) on delete cascade,
  competence_nom text not null,
  niveau competence_niveau not null
);

create table etudiant_interets (
  id uuid primary key default gen_random_uuid(),
  etudiant_id uuid not null references etudiants(id) on delete cascade,
  domaine text not null
);

create table recommandations (
  id uuid primary key default gen_random_uuid(),
  etudiant_id uuid not null references etudiants(id) on delete cascade,
  justification_texte text,
  created_at timestamptz not null default now()
);

create table scores_filieres (
  id uuid primary key default gen_random_uuid(),
  recommandation_id uuid not null references recommandations(id) on delete cascade,
  filiere_id uuid not null references filieres(id) on delete cascade,
  score numeric not null
);

create table offres (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references entreprises(id) on delete cascade,
  titre text not null,
  description text,
  type offre_type not null,
  competences_requises jsonb,
  filieres_ciblees uuid[] default '{}',
  localisation text,
  date_limite date,
  statut offre_statut not null default 'en_attente',
  created_at timestamptz not null default now()
);

create table candidatures (
  id uuid primary key default gen_random_uuid(),
  offre_id uuid not null references offres(id) on delete cascade,
  etudiant_id uuid not null references etudiants(id) on delete cascade,
  cv_url text,
  message text,
  statut candidature_statut not null default 'envoyee',
  created_at timestamptz not null default now()
);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  etudiant_id uuid not null references etudiants(id) on delete cascade,
  type conversation_type not null,
  created_at timestamptz not null default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role message_role not null,
  contenu text not null,
  created_at timestamptz not null default now()
);

create table base_connaissances (
  id uuid primary key default gen_random_uuid(),
  type connaissance_type not null,
  contenu text not null,
  embedding vector(1024),
  source_id uuid,
  updated_at timestamptz not null default now()
);
create trigger trg_base_connaissances_updated_at
before update on base_connaissances
for each row execute function set_updated_at();

create index on base_connaissances using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create index idx_etudiants_user_id on etudiants(user_id);
create index idx_etudiants_filiere_actuelle_id on etudiants(filiere_actuelle_id);
create index idx_entreprises_user_id on entreprises(user_id);
create index idx_administrateurs_user_id on administrateurs(user_id);
create index idx_filiere_criteres_filiere_id on filiere_criteres(filiere_id);
create index idx_profils_wizard_etudiant_id on profils_wizard(etudiant_id);
create index idx_wizard_reponses_profil_wizard_id on wizard_reponses(profil_wizard_id);
create index idx_etudiant_competences_etudiant_id on etudiant_competences(etudiant_id);
create index idx_etudiant_interets_etudiant_id on etudiant_interets(etudiant_id);
create index idx_recommandations_etudiant_id on recommandations(etudiant_id);
create index idx_scores_filieres_recommandation_id on scores_filieres(recommandation_id);
create index idx_scores_filieres_filiere_id on scores_filieres(filiere_id);
create index idx_offres_entreprise_id on offres(entreprise_id);
create index idx_candidatures_offre_id on candidatures(offre_id);
create index idx_candidatures_etudiant_id on candidatures(etudiant_id);
create index idx_conversations_etudiant_id on conversations(etudiant_id);
create index idx_messages_conversation_id on messages(conversation_id);

-- =========================================================
-- AJOUT NÉCESSAIRE POUR LE BACKEND (non présent dans la migration d'origine) :
-- colonne pour bloquer/débloquer un compte (cas d'utilisation "Gérer les comptes")
-- =========================================================
alter table users add column if not exists actif boolean not null default true;

-- =========================================================
-- AJOUT NÉCESSAIRE POUR LE BACKEND : vérification d'e-mail par code OTP
-- (inscription) et réinitialisation du mot de passe par code OTP.
-- =========================================================
alter table users add column if not exists email_verifie boolean not null default false;

-- Colonnes du profil et des candidatures utilisées par l'application Flutter.
alter table etudiants add column if not exists filiere text;
alter table etudiants add column if not exists specialite text;
alter table etudiants add column if not exists photo_url text;
alter table etudiants add column if not exists cv_chemin text;
alter table etudiants add column if not exists cv_nom_fichier text;
alter table candidatures add column if not exists email_contact text;
alter table candidatures add column if not exists telephone_contact text;
alter table candidatures add column if not exists localisation text;
alter table candidatures add column if not exists lettre_motivation_url text;
alter table candidatures add column if not exists lettre_recommandation_url text;

create table if not exists etudiant_notes (
  id uuid primary key default gen_random_uuid(),
  etudiant_id uuid not null references etudiants(id) on delete cascade,
  chemin_fichier text not null,
  nom_fichier text,
  url text not null,
  semestre text,
  created_at timestamptz not null default now()
);
create index if not exists idx_etudiant_notes_etudiant_id on etudiant_notes(etudiant_id);

create table if not exists entreprise_conversations (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references entreprises(id) on delete cascade,
  etudiant_id uuid not null references etudiants(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (entreprise_id, etudiant_id)
);
create table if not exists entreprise_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references entreprise_conversations(id) on delete cascade,
  expediteur_type text not null check (expediteur_type in ('entreprise', 'etudiant')),
  expediteur_id uuid not null,
  contenu text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_entreprise_messages_conversation on entreprise_messages(conversation_id);

do $$ begin
  create type otp_purpose as enum ('inscription', 'reinitialisation');
exception
  when duplicate_object then null;
end $$;

create table if not exists otp_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  purpose otp_purpose not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  tentatives int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_otp_codes_email_purpose on otp_codes(email, purpose);

-- =========================================================
-- AJOUT NÉCESSAIRE POUR LE BACKEND : notifications push (Firebase Cloud
-- Messaging). Un même utilisateur peut avoir plusieurs appareils, donc un
-- token par (user_id, token) ; upsert du last_used_at à chaque enregistrement.
-- =========================================================
create table if not exists device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token text not null,
  plateforme text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now(),
  unique (user_id, token)
);
create index if not exists idx_device_tokens_user_id on device_tokens(user_id);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  titre text not null,
  corps text,
  type text,
  data jsonb,
  lue boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_user_id on notifications(user_id);

-- Bucket Storage pour les CV (à créer aussi depuis l'UI Supabase > Storage si cette
-- commande n'est pas disponible dans votre plan) :
-- insert into storage.buckets (id, name, public) values ('cvs', 'cvs', false);
