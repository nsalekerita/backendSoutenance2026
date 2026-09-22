# IAI Horizon — Backend (JavaScript pur, Node.js/Express + Supabase)

Ceci est la version **JavaScript** (pas TypeScript) du backend — même code, même logique,
directement exécutable avec `node`, sans étape de compilation.

## Démarrage

```bash
cd backend
npm install
cp .env.example .env   # puis renseigne SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET, GEMINI_API_KEY...
npm start               # ou : node server.js
npm test                # exécute la suite de tests (jest)
```

Le serveur démarre sur le port `4000` et écoute sur toutes les interfaces réseau
(route de test : `GET /health`). Pour le frontend, l'URL dépend de l'appareil :

- navigateur sur le même PC : `http://localhost:4000`
- émulateur Android Studio : `http://10.0.2.2:4000`
- téléphone Android réel connecté au même Wi-Fi : `http://ADRESSE_IP_DU_PC:4000`

Sur Android, si l'API est encore en HTTP, ajoute `android:usesCleartextTraffic="true"`
dans la balise `<application>` de `android/app/src/main/AndroidManifest.xml`, et
ajoute la permission `<uses-permission android:name="android.permission.INTERNET" />`.

## Avant de démarrer

1. Crée un projet sur https://supabase.com
2. Exécute `db/migration.sql` puis `db/migration_rls.sql` dans le SQL editor de ton projet Supabase
   (le second active la Row Level Security en défense en profondeur — voir le fichier pour le détail).
3. Crée les buckets Storage `cvs`, `lettres-motivation`, `recommandations`,
   `photos` et `notes-bulletins`. Les trois premiers doivent être configurés
   selon la politique de diffusion souhaitée pour les pièces de candidature.
4. Récupère tes clés dans Project Settings > API et remplis le fichier `.env`.
5. Récupère une clé API Gemini (aistudio.google.com/apikey) pour les fonctionnalités IA
   (recommandation, chatbot, aide contextuelle).
6. En production, renseigne `CORS_ALLOWED_ORIGINS` avec le(s) domaine(s) exact(s) du front —
   sans cette variable, en environnement `NODE_ENV=development` toutes les origines sont acceptées.

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
|   |-- recommendation.service.js    -> appel Gemini, rédaction de la recommandation
|   |-- chatbot.service.js           -> appel Gemini + RAG (contexte étudiant + base_connaissances)
|   |-- aide-contextuelle.service.js -> appel Gemini (réponses courtes)
|   `-- gemini.client.js             -> client de l'API Google Gemini
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

Ce code a été compilé depuis la version TypeScript (qui passait `tsc --noEmit` sans erreur),
puis lancé avec `node server.js` : le serveur démarre et répond correctement sur `/health`.

## Limite connue

- **Recherche vectorielle RAG** (`ia/chatbot.service.js`) : utilise une recherche texte simple ;
  la colonne `embedding` et l'index `ivfflat` sont déjà en base pour brancher une vraie recherche
  par similarité une fois un pipeline d'embeddings en place.

## Sécurité

- Toutes les routes `entreprise` (candidatures, offres) vérifient que la ressource appartient bien
  à l'entreprise authentifiée avant lecture/écriture (protection IDOR).
- La création d'offre utilise une liste blanche de champs (protection contre le mass-assignment).
- Rate limiting sur `/api/auth/login` et `/api/auth/register/*` (20 requêtes / 15 min / IP).
- CORS restreint via `CORS_ALLOWED_ORIGINS` en production.
- Les erreurs 500 ne renvoient jamais leur message brut au client en production
  (`middleware/error.middleware.js`).
- En production, le serveur refuse de démarrer si `SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY` ou `JWT_SECRET` manque.
- `db/migration_rls.sql` active la Row Level Security sur toutes les tables (défense en profondeur ;
  le backend utilise la clé service role qui contourne la RLS, donc les vérifications applicatives
  restent la protection principale).
- Blocage de compte administrateur (`admin/admin.service.js`, `bloquerCompte`/`debloquerCompte`) :
  utilise la colonne `users.actif` (ajoutée dans `db/migration.sql`), vérifiée aussi au login.
