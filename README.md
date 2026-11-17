# Miss Prono — Frontend starter

Socle frontend de Miss Prono : application de pronostics autour de l'élection Miss France.

## Stack

- Next.js 16 App Router
- React + TypeScript
- Tailwind CSS v4
- Lucide React
- Données de démonstration locales

## Prérequis

- Node.js 20.9 ou supérieur
- npm

## Installation

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:3000.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run check:production
```

`npm run check:production` valide la présence des identifiants publics Supabase, de l’URL canonique HTTPS et des informations nécessaires aux pages légales. Il ne lit et n’affiche aucune clé secrète.

## Structure

```text
src/
  app/                 Routes Next.js, layouts et styles globaux
    (public)/          Accueil, candidates et classement public
    (auth)/            Connexion et inscription
    (dashboard)/       Pronostics et routes prévues pour l'espace connecté
  components/
    layout/            Navigation et pied de page
    home/              Sections de la homepage
    candidates/        Galerie et cartes de candidates
    ui/                Composants génériques
  data/                Candidates 2027 et données de démonstration
  types/               Types TypeScript partagés
supabase/
  migrations/          Schéma relationnel, contraintes et politiques RLS
  seed.sql             Édition 2027 et candidates (généré depuis les données frontend)
```

Les groupes de routes entre parenthèses organisent les pages sans ajouter ces noms aux URL. Les URL incluent `/`, `/candidates`, `/pronostics`, `/resultats`, `/classement`, `/connexion`, `/inscription`, `/profil`, `/ligues`, `/admin` et `/admin/candidates`. Les pages pronostics, profil et ligues demandent une session; `/admin` et ses sous-pages exigent en plus une appartenance à `public.app_admins`.

## Écrans inclus

- Homepage responsive
- Galerie responsive des 31 candidates Miss France 2027 avec portraits, recherche et filtre par région
- Fiches détaillées : âge, taille, ville, élection régionale, études, métier, passions, engagements, parcours et Instagram lorsqu'ils sont publiés
- Composeur Top 12 connecté à Supabase : brouillons privés, validation atomique et verrouillage à la clôture
- Ligues privées connectées à Supabase : création, adhésion par code, liste des membres et partage du code
- Page résultats officielle et fil des annonces de cérémonie avec mises à jour en direct pendant l'édition live
- Back-office admin : gestion du Top 12 officiel, barème, annonces de soirée et calcul des scores
- Gestion admin des fiches candidates et des portraits via Supabase Storage
- Navigation desktop et mobile
- Hero Miss Prono
- Aperçu du classement
- Présentation des fonctionnalités
- CTA d'inscription / création de pronostics (visuels de démonstration)

## Important

Les comptes email/mot de passe Supabase utilisent des sessions sécurisées par cookies; la confirmation de l'adresse est configurable dans le tableau de bord. Le formulaire recueille prénom, nom et pseudo, avec les noms protégés dans une table privée. Les brouillons et confirmations de pronostic sont enregistrés dans Supabase. Les ligues permettent de créer un groupe, de le rejoindre avec un code et de consulter ses membres. Le moteur de score utilise les règles enregistrées pour une édition; la page `/classement` publie le tableau uniquement après clôture, publication des 12 résultats et calcul par un administrateur dans `/admin`. Le barème V1 approuvé est 100 points au rang 1, 50 aux rangs 2 à 5 et 10 aux rangs 6 à 12. Le back-office `/admin` permet de gérer la phase et les dates de l'édition, saisir et publier le classement officiel, modifier le barème, publier les annonces de soirée et recalculer les scores. La gestion des candidates sur `/admin/candidates` permet de créer, modifier et supprimer les fiches, ainsi que de téléverser les portraits vers un bucket public dont l’écriture est réservée aux admins. Toute modification des résultats ou du barème invalide les scores précédents. La page publique `/resultats` affiche les rangs publiés et un fil de soirée actualisé en direct à partir des annonces vérifiées par un admin. La galerie et les fiches candidates lisent les données publiques de Supabase lorsqu'elles sont configurées; elles conservent les données locales comme repli.

## Fondation Supabase

Le schéma se trouve dans `supabase/migrations/`. Il comprend les éditions, profils, candidates, pronostics, choix, ligues, résultats, règles de scoring, scores et événements de cérémonie. Les brouillons sont privés et modifiables pendant la préparation et la période ouverte; la confirmation finale n'est permise que lorsque l'édition est `open` avec une date limite future. Les ligues peuvent être créées et rejointes pendant `upcoming` ou `open`, jusqu'à la date limite. Le seed initialise Miss France 2027 en état `upcoming`, visible dans le catalogue public mais sans date limite : les brouillons et ligues peuvent être enregistrés, mais la confirmation reste fermée. Une migration configure le barème V1 approuvé pour 2027. Le classement public est lu depuis une vue qui n'expose que les pseudos et scores après publication des 12 résultats. La page `/resultats` affiche le Top 12 officiel et les annonces publiées en direct.

Après avoir configuré le projet Supabase et copié ses identifiants dans `.env.local`, on peut démarrer la base locale avec `supabase start`, puis appliquer le schéma et les données avec `supabase db reset`.

### Authentification et profil

Pour la V1, dans **Authentication → Sign In / Providers → Email**, garde l'inscription Email activée et désactive **Confirm email**. Le compte pourra alors se connecter directement après son inscription. Cela accepte des adresses non vérifiées : réactive la confirmation avant une ouverture publique ou l'ajout de fonctions sensibles à la propriété de l'adresse.

L'inscription demande prénom, nom, pseudo, email et mot de passe. Le pseudo est stocké dans `public.profiles`; prénom et nom sont stockés dans `public.private_profiles`, lisible et modifiable uniquement par le propriétaire via RLS. La page `/profil` permet de modifier ces trois champs, y compris pour les comptes créés avant la migration. Applique les migrations au projet Supabase avec `npx supabase db push`.

Si la confirmation email est réactivée plus tard, configure l'URL du site et les redirections `/confirmation-email` dans **Authentication → URL Configuration**. Dans **Authentication → Email Templates → Confirm signup**, utilise le lien intermédiaire `<a href="{{ .RedirectTo }}&amp;token_hash={{ .TokenHash }}&amp;type=email">Confirmer mon adresse email</a>`. L'utilisateur devra cliquer une seconde fois sur le site pour valider le jeton, ce qui évite que certains scanners de messagerie le consomment automatiquement.

### Préparation de production

- Le domaine gratuit `*.vercel.app` suffit pour commencer. Importer le dépôt Git dans Vercel, conserver le framework Next.js détecté automatiquement, puis ajouter `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` dans les variables Production (et Preview si les aperçus doivent fonctionner). Ne jamais mettre une clé `service_role` dans une variable `NEXT_PUBLIC_*`.
- Après le premier déploiement, choisir le domaine de production Vercel affiché dans **Settings → Domains** et définir `NEXT_PUBLIC_SITE_URL` avec son URL HTTPS complète. Vercel fournit aussi les URL système; elles servent de secours au démarrage et pour les aperçus. Redéployer après toute modification de variable.
- Dans Supabase Auth → URL Configuration, régler **Site URL** sur le domaine de production `https://…vercel.app`, et ajouter `https://…vercel.app/**` ainsi que `http://localhost:3000/**` aux URL de redirection. Ne pas autoriser toutes les URL de prévisualisation avec un joker large sans en avoir besoin. Pour une ouverture publique, activer la confirmation email et configurer un expéditeur SMTP fiable; le mode sans vérification est réservé à la V1 de test.
- Choisir si les déploiements Preview Vercel doivent utiliser la base Supabase de production. Par défaut, ne leur ajouter aucune variable Supabase de production : cela évite qu’un aperçu Git modifie les données réelles. Si les aperçus doivent être testés, utiliser un projet/base Supabase séparé.
- Exécuter `npm run check:production` avec les variables de production configurées, puis `npm run lint` et `npm run build`.
- Compléter les variables `LEGAL_*`, faire valider les pages légales, vérifier les droits sur chaque photo et renseigner les dates de l’édition dans `/admin`.
- Appliquer les migrations avec `npx supabase db push`, vérifier l’admin dans `public.app_admins`, puis contrôler une inscription, un pronostic, une ligue, le flux de confirmation et les droits RLS avec des comptes de test distincts.

Les pages de l’application s’appuient sur les variables système de Vercel pour établir une URL temporaire si `NEXT_PUBLIC_SITE_URL` n’est pas encore définie. La valeur explicite reste recommandée pour stabiliser les liens d’authentification, le sitemap et les métadonnées du domaine public.

Les pages légales affichent volontairement un bandeau de préparation si les informations d’éditeur, de contact, de conservation ou de localisation des données manquent. Ce bandeau doit disparaître avant l’ouverture publique.

Après une modification des données source des candidates, régénérer le seed avec `npm run supabase:seed:generate`.

Les administrateurs sont affectés manuellement par un opérateur de confiance dans `public.app_admins`, après vérification de leur identifiant Auth. Cette table n'est pas lisible depuis les rôles navigateur.

Les données et portraits proviennent de publications de presse du 16 novembre 2026. Les portraits individuels sont rangés dans `public/images/candidates/`; consultez le fichier README de ce dossier pour les crédits et la provenance.
