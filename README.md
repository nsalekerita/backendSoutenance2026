# IAI Horizon — Backend AWS (Node.js/Express + PostgreSQL RDS + S3/CloudFront)

Ceci est la version **JavaScript** (pas TypeScript) du backend — même code, même logique,
directement exécutable avec `node`, sans étape de compilation.

## Démarrage

```bash
cd backend
npm install
cp .env.example .env   # puis renseigne DATABASE_URL, JWT_SECRET, GEMINI_API_KEY...
npm run migrate        # applique db/postgres/*.sql sur RDS
npm start              # ou : node server.js
npm test               # exécute la suite de tests (jest)
```

Le serveur démarre sur http://localhost:4000 (route de test : GET /health).

## Avant de démarrer

1. Crée une base PostgreSQL et un rôle applicatif dédiés sur AWS RDS.
2. Renseigne `DATABASE_URL`, puis lance `npm run migrate`.
3. Le bucket privé `kerita-media` reçoit tous les fichiers sous des préfixes
   (`cvs/`, `photos/`, `notes-bulletins/`, etc.). Les uploads utilisent des URL
   S3 présignées et les lectures passent par CloudFront/OAC.
4. Récupère une clé API Gemini (aistudio.google.com/apikey) pour les fonctionnalités IA
   (recommandation, chatbot, aide contextuelle).
6. En production, renseigne `CORS_ALLOWED_ORIGINS` avec le(s) domaine(s) exact(s) du front —
   sans cette variable, en environnement `NODE_ENV=development` toutes les origines sont acceptées.

## Structure (identique au découpage demandé)

```
backend/
|-- server.js                 -> point d'entrée (démarre le serveur)
|-- app.js                    -> configuration Express + montage des routes
|-- config/                   -> env.js, database.js, storage.js
|-- middleware/                -> auth.middleware.js, error.middleware.js
|-- utils/                     -> jwt.js, password.js, response.js, asyncHandler.js
|-- auth/                      -> authentification etudiant / administrateur / entreprise
|-- profils/                    -> wizard, profil étudiant, gestion de la progression
|-- scoring/                    -> moteur de scoring (logique pure, sans IA)
|-- ia/
|   |-- recommendation.service.js    -> appel Gemini, rédaction de la recommandation
|   |-- chatbot.service.js           -> appel Gemini + RAG (contexte étudiant + base_connaissances)
|   |-- aide-contextuelle.service.js -> appel Gemini (réponses courtes)
|   `-- gemini.client.js             -> client de l'API Google Gemini
|-- offres/                     -> CRUD offres, matching, validation administrateur
|-- candidatures/
|-- filieres/                    -> fiches filières + critères de scoring
|-- admin/
|-- infrastructure/             -> CloudFormation, Nginx, PM2 et déploiement
`-- db/postgres/                -> migrations PostgreSQL AWS RDS
```

## Points d'entrée API (résumé)

- `POST /api/auth/register/etudiant` / `/register/entreprise` / `/login` / `/google`
- `GET  /api/auth/me`
- `GET/PATCH /api/profils/moi`, `/moi/competences`, `/moi/interets`, `/moi/wizard/*`, `/moi/cv/upload-url`
- `GET  /api/offres`, `GET /api/offres/:id`, `POST /api/offres` (entreprise)
- `POST /api/candidatures`, upload des pièces, `GET /api/candidatures/moi|tous`,
  `PATCH /api/candidatures/:id/accepter|refuser`
- `GET/POST /api/messages` pour la messagerie entreprise–étudiant
- `GET  /api/filieres`, `POST /api/filieres` (administrateur)
- `GET  /api/admin/stats`, `/admin/comptes`, `/admin/offres`, `PATCH /admin/offres/:id/statut`
- `POST /api/ia/recommandations/generer`, `GET /api/ia/recommandations/derniere`
- `POST /api/ia/chat`, `GET /api/ia/chat/:conversationId`
- `POST /api/ia/aide-contextuelle`

## Vérification de l'e-mail

L'OTP d'inscription est demandé uniquement juste après la création d'un
compte classique. Une connexion ultérieure par e-mail/mot de passe n'est pas
bloquée par `email_verifie`. La réinitialisation de mot de passe conserve son
propre OTP distinct.

## Testé

La suite Jest couvre les utilitaires, les protections d'accès et les services critiques.

## Limite connue

- **Recherche vectorielle RAG** (`ia/chatbot.service.js`) : utilise une recherche texte simple ;
  `embedding` est conservé en JSONB en attendant un pipeline pgvector dédié.

## Sécurité

- Toutes les routes `entreprise` (candidatures, offres) vérifient que la ressource appartient bien
  à l'entreprise authentifiée avant lecture/écriture (protection IDOR).
- La création d'offre utilise une liste blanche de champs (protection contre le mass-assignment).
- Rate limiting sur `/api/auth/login` et `/api/auth/register/*` (20 requêtes / 15 min / IP).
- CORS restreint via `CORS_ALLOWED_ORIGINS` en production.
- Les erreurs 500 ne renvoient jamais leur message brut au client en production
  (`middleware/error.middleware.js`).
- En production, le serveur refuse de démarrer si `DATABASE_URL` ou `JWT_SECRET` manque.
- Le bucket S3 bloque tout accès public. CloudFront est le seul lecteur public,
  via une Origin Access Control limitée à la distribution Kerita.
- Blocage de compte administrateur (`admin/admin.service.js`, `bloquerCompte`/`debloquerCompte`) :
  utilise la colonne `users.actif` (ajoutée dans `db/migration.sql`), vérifiée aussi au login.
