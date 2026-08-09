# IAI Horizon — Plateforme etudiants / entreprises

Structure du projet :

```
iai-horizon/
  backend/     -> API Node.js / Express + Supabase (a ouvrir dans VS Code)
  frontend/    -> App Flutter (a ouvrir dans Android Studio)
```

## Backend (VS Code)

```bash
cd backend
npm install
cp .env.example .env   # puis renseignez SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET, ANTHROPIC_API_KEY
npm run dev            # demarre sur http://localhost:3000
```

- `database/schema_reference.sql` : schema de reference utilise par le code. **Vous avez deja votre propre
  base Supabase** — comparez les noms de tables/colonnes avec les votres. S'ils different, adaptez soit ce
  fichier (pour recreer les tables a l'identique), soit les requetes dans `src/controllers/*.js` (pour coller
  a votre schema existant). Dites-moi les noms exacts de vos tables/colonnes si vous voulez que j'aligne le
  code precisement.
- Toutes les routes sont prefixees par `/api` (ex: `POST /api/auth/login`).
- L'authentification se fait par JWT (`Authorization: Bearer <token>`), genere a l'inscription/connexion.
- Le matching automatique etudiant/offre et le score de compatibilite passent par l'API Claude
  (`src/services/ai.service.js`) — necessite une cle `ANTHROPIC_API_KEY`.

## Frontend (Android Studio)

```bash
cd frontend
flutter pub get
flutter run
```

- `lib/core/services/api_service.dart` : URL du backend a adapter selon l'environnement
  (`10.0.2.2` pour l'emulateur Android, IP locale pour un telephone physique, domaine en production).
- `lib/screens/home/splash_screen.dart` : ecran de lancement avec logo qui tourne sur fond degrade vert,
  comme demande, avant d'afficher la page d'accueil (`home_screen.dart`, votre design d'origine).
- Espaces separes selon le role : `screens/student/`, `screens/company/`, `screens/admin/`.

## Ce qui est deja fonctionnel

- Inscription / connexion (etudiant, entreprise), validation admin des comptes entreprise
- Profil etudiant (filiere, niveau, centres d'interet, objectifs), notes, competences
- Test d'orientation -> score de compatibilite + explication (IA)
- Recommandations personnalisees (technologies, certifications, formations, metiers)
- Chatbot assistant IA
- Publication d'offres (entreprise), matching automatique etudiants <-> offre (IA)
- Candidature, suivi, acceptation/refus
- Recherche manuelle de profils etudiants (entreprise)
- Statistiques globales + gestion des comptes (admin)

## Prochaines etapes suggerees

1. Me communiquer le schema exact de votre base Supabase pour aligner les requetes a 100%.
2. Brancher `flutter_secure_storage`/upload de fichiers pour le CV (actuellement un simple champ URL).
3. Ajouter les notifications (email ou push) lors de l'acceptation/refus d'une candidature.
4. Ecrire les regles RLS (Row Level Security) Supabase correspondant aux roles.
