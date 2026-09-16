CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text UNIQUE NOT NULL,
  password_hash text NOT NULL, role text NOT NULL CHECK (role IN ('etudiant','administrateur','entreprise')),
  actif boolean NOT NULL DEFAULT true, email_verifie boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE filieres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nom text NOT NULL, description text,
  debouches text, niveau_requis text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE etudiants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nom text NOT NULL, prenom text NOT NULL, niveau text, filiere_actuelle_id uuid REFERENCES filieres(id) ON DELETE SET NULL,
  filiere text, specialite text, photo_url text, cv_chemin text, cv_nom_fichier text
);
CREATE TABLE entreprises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nom text NOT NULL, secteur text, statut_verification text DEFAULT 'en_attente', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE administrateurs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE, nom text
);
CREATE TABLE filiere_criteres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), filiere_id uuid NOT NULL REFERENCES filieres(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('competence','interet','matiere')), nom text NOT NULL, poids numeric NOT NULL DEFAULT 1
);
CREATE TABLE profils_wizard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), etudiant_id uuid UNIQUE NOT NULL REFERENCES etudiants(id) ON DELETE CASCADE,
  statut text NOT NULL DEFAULT 'en_cours', etape_courante int NOT NULL DEFAULT 0, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE wizard_reponses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), profil_wizard_id uuid NOT NULL REFERENCES profils_wizard(id) ON DELETE CASCADE,
  etape int NOT NULL, question_id text NOT NULL, reponse jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE etudiant_competences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), etudiant_id uuid NOT NULL REFERENCES etudiants(id) ON DELETE CASCADE,
  competence_nom text NOT NULL, niveau text NOT NULL CHECK (niveau IN ('debutant','intermediaire','avance'))
);
CREATE TABLE etudiant_interets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), etudiant_id uuid NOT NULL REFERENCES etudiants(id) ON DELETE CASCADE, domaine text NOT NULL
);
CREATE TABLE etudiant_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), etudiant_id uuid NOT NULL REFERENCES etudiants(id) ON DELETE CASCADE,
  chemin_fichier text NOT NULL, nom_fichier text, url text NOT NULL, semestre text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE recommandations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), etudiant_id uuid NOT NULL REFERENCES etudiants(id) ON DELETE CASCADE,
  justification_texte text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE scores_filieres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), recommandation_id uuid NOT NULL REFERENCES recommandations(id) ON DELETE CASCADE,
  filiere_id uuid NOT NULL REFERENCES filieres(id) ON DELETE CASCADE, score numeric NOT NULL
);
CREATE TABLE offres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), entreprise_id uuid NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  titre text NOT NULL, description text, type text NOT NULL CHECK (type IN ('stage','emploi')),
  competences_requises jsonb, filieres_ciblees uuid[] DEFAULT '{}', localisation text, date_limite date,
  statut text NOT NULL DEFAULT 'en_attente', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE candidatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), offre_id uuid NOT NULL REFERENCES offres(id) ON DELETE CASCADE,
  etudiant_id uuid NOT NULL REFERENCES etudiants(id) ON DELETE CASCADE, cv_url text, message text,
  email_contact text, telephone_contact text, localisation text, lettre_motivation_url text, lettre_recommandation_url text,
  statut text NOT NULL DEFAULT 'envoyee', created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(offre_id, etudiant_id)
);
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), etudiant_id uuid NOT NULL REFERENCES etudiants(id) ON DELETE CASCADE,
  type text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant')), contenu text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE base_connaissances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), type text NOT NULL, contenu text NOT NULL,
  embedding jsonb, source_id uuid, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL, code_hash text NOT NULL,
  purpose text NOT NULL CHECK (purpose IN ('inscription','reinitialisation')), expires_at timestamptz NOT NULL,
  consumed_at timestamptz, tentatives int NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token text NOT NULL, plateforme text, created_at timestamptz NOT NULL DEFAULT now(), last_used_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, token)
);
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  titre text NOT NULL, corps text, type text, data jsonb, lue boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE entreprise_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), entreprise_id uuid NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  etudiant_id uuid NOT NULL REFERENCES etudiants(id) ON DELETE CASCADE, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(entreprise_id, etudiant_id)
);
CREATE TABLE entreprise_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), conversation_id uuid NOT NULL REFERENCES entreprise_conversations(id) ON DELETE CASCADE,
  expediteur_type text NOT NULL CHECK (expediteur_type IN ('entreprise','etudiant')),
  expediteur_id uuid NOT NULL, contenu text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_etudiants_user ON etudiants(user_id);
CREATE INDEX idx_entreprises_user ON entreprises(user_id);
CREATE INDEX idx_offres_entreprise ON offres(entreprise_id);
CREATE INDEX idx_candidatures_offre ON candidatures(offre_id);
CREATE INDEX idx_candidatures_etudiant ON candidatures(etudiant_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_entreprise_messages_conversation ON entreprise_messages(conversation_id, created_at);
CREATE INDEX idx_base_connaissances_search ON base_connaissances USING gin(to_tsvector('french', contenu));
