-- ============================================================
-- SCHEMA DE REFERENCE utilise par le code backend fourni.
-- Vous avez deja votre propre base Supabase : comparez les noms
-- de tables/colonnes ci-dessous et ajustez soit ce schema, soit
-- les requetes dans src/controllers/*.js pour qu'ils correspondent.
-- ============================================================

create table utilisateurs (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  nom text not null,
  role text not null check (role in ('etudiant','entreprise','admin')),
  statut text not null default 'actif' check (statut in ('actif','en_attente','suspendu')),
  created_at timestamptz default now()
);

create table etudiants (
  id uuid primary key default gen_random_uuid(),
  utilisateur_id uuid references utilisateurs(id) on delete cascade,
  photo_url text,
  filiere text,
  niveau text,
  centres_interet text,
  objectifs_professionnels text
);

create table notes (
  id uuid primary key default gen_random_uuid(),
  etudiant_id uuid references etudiants(id) on delete cascade,
  matiere text not null,
  note numeric not null,
  unique (etudiant_id, matiere)
);

create table competences (
  id uuid primary key default gen_random_uuid(),
  nom text unique not null
);

create table competences_etudiant (
  id uuid primary key default gen_random_uuid(),
  etudiant_id uuid references etudiants(id) on delete cascade,
  competence_id uuid references competences(id),
  niveau text not null,
  unique (etudiant_id, competence_id)
);

create table tests_orientation (
  id uuid primary key default gen_random_uuid(),
  etudiant_id uuid references etudiants(id) on delete cascade,
  reponses jsonb not null,
  created_at timestamptz default now()
);

create table specialisations (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  description text
);

create table recommandations (
  id uuid primary key default gen_random_uuid(),
  etudiant_id uuid references etudiants(id) on delete cascade,
  specialisation_id uuid references specialisations(id),
  score int not null,
  explication text,
  created_at timestamptz default now(),
  unique (etudiant_id, specialisation_id)
);

create table entreprises (
  id uuid primary key default gen_random_uuid(),
  utilisateur_id uuid references utilisateurs(id) on delete cascade,
  nom_entreprise text not null,
  secteur text,
  ville text,
  logo_url text,
  description text
);

create table offres (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid references entreprises(id) on delete cascade,
  titre text not null,
  description text,
  type text not null check (type in ('stage','emploi')),
  ville text,
  filiere_cible text,
  competences_requises text,
  statut text not null default 'publiee' check (statut in ('publiee','fermee')),
  created_at timestamptz default now()
);

create table candidatures (
  id uuid primary key default gen_random_uuid(),
  offre_id uuid references offres(id) on delete cascade,
  etudiant_id uuid references etudiants(id) on delete cascade,
  cv_url text,
  statut text not null default 'en_attente' check (statut in ('en_attente','acceptee','refusee')),
  created_at timestamptz default now(),
  unique (offre_id, etudiant_id)
);

create table matchs (
  id uuid primary key default gen_random_uuid(),
  offre_id uuid references offres(id) on delete cascade,
  etudiant_id uuid references etudiants(id) on delete cascade,
  score int not null,
  raison text,
  created_at timestamptz default now(),
  unique (offre_id, etudiant_id)
);

create table messages_chatbot (
  id uuid primary key default gen_random_uuid(),
  etudiant_id uuid references etudiants(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  contenu text not null,
  created_at timestamptz default now()
);
