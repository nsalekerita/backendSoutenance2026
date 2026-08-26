# IAI Horizon — Backend (JavaScript pur, Node.js/Express + Supabase)

Ceci est la version **JavaScript** (pas TypeScript) du backend — même code, même logique,
directement exécutable avec `node`, sans étape de compilation.

## Démarrage

```bash
cd backend
npm install
cp .env.example .env   # puis renseigne SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET, ANTHROPIC_API_KEY...
npm start               # ou : node server.js
```

Le serveur démarre sur http://localhost:4000 (route de test : GET /health).

## Avant de démarrer

1. Crée un projet sur https://supabase.com
2. Exécute `db/migration.sql` dans le SQL editor de ton projet Supabase.
3. Crée un bucket Storage privé nommé `cvs` (Storage > New bucket) pour l'upload des CV.
4. Récupère tes clés dans Project Settings > API et remplis le fichier `.env`.
5. Récupère une clé API Anthropic (console.anthropic.com) pour les fonctionnalités IA
   (recommandation, chatbot, aide contextuelle).

## Structure (identique au découpage demandé)

```
backend/
|-- server.js                 -> point d'entrée (démarre le serveur)
|-- app.js                    -> configuration Express + montage des routes
|-- config/                   -> env.js, supabase.js
|-- middleware/                -> auth.middleware.js, error.middleware.js
|-- utils/                     -> jwt.js, password.js, response.js, asyncHandler.js
|-- auth/                      -> authentification etudiant / administrateur / entreprise
|-- profils/                    -> wizard, profil étudiant, gestion de la progression
|-- scoring/                    -> moteur de scoring (logique pure, sans IA)
|-- ia/
|   |-- recommendation.service.js    -> appel Claude, rédaction de la recommandation
|   |-- chatbot.service.js           -> appel Claude + RAG (contexte étudiant + base_connaissances)
|   |-- aide-contextuelle.service.js -> appel Claude (réponses courtes)
|   `-- claude.client.js             -> wrapper autour de l'API Anthropic
|-- offres/                     -> CRUD offres, matching, validation administrateur
|-- candidatures/
|-- filieres/                    -> fiches filières + critères de scoring
|-- admin/
`-- db/migration.sql            -> ta migration SQL (schéma complet Supabase)
```

## Points d'entrée API (résumé)

- `POST /api/auth/register/etudiant` / `/register/entreprise` / `/login` / `/google`
- `GET  /api/auth/me`
- `GET/PATCH /api/profils/moi`, `/moi/competences`, `/moi/interets`, `/moi/wizard/*`, `/moi/cv/upload-url`
- `GET  /api/offres`, `GET /api/offres/:id`, `POST /api/offres` (entreprise)
- `POST /api/candidatures`, `GET /api/candidatures/moi`, `PATCH /api/candidatures/:id/accepter|refuser`
- `GET  /api/filieres`, `POST /api/filieres` (administrateur)
- `GET  /api/admin/stats`, `/admin/comptes`, `/admin/offres`, `PATCH /admin/offres/:id/statut`
- `POST /api/ia/recommandations/generer`, `GET /api/ia/recommandations/derniere`
- `POST /api/ia/chat`, `GET /api/ia/chat/:conversationId`
- `POST /api/ia/aide-contextuelle`

## Testé

Ce code a été compilé depuis la version TypeScript (qui passait `tsc --noEmit` sans erreur),
puis lancé avec `node server.js` : le serveur démarre et répond correctement sur `/health`.

## Reste à finaliser (voir commentaires dans le code)

- **Google OAuth** (`auth/auth.service.js`, fonction `loginOrRegisterWithGoogle`) : à connecter
  avec la vérification du `id_token` Google côté serveur.
- **Recherche vectorielle RAG** (`ia/chatbot.service.js`) : utilise une recherche texte simple ;
  la colonne `embedding` et l'index `ivfflat` sont déjà en base pour brancher une vraie recherche
  par similarité une fois un pipeline d'embeddings en place.
- **Blocage de compte administrateur** (`admin/admin.service.js`, fonction `bloquerCompte`) : nécessite la
  colonne `users.actif` (déjà ajoutée à la fin de `db/migration.sql`).
