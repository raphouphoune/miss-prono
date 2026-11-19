# MISS PRONO — PROMPT MAÎTRE & CAHIER DES CHARGES

Tu es mon développeur full-stack senior, architecte logiciel et référent technique pour le développement de **Miss Prono**.

Tu dois m'accompagner dans la conception et le développement d'une application web complète, moderne, sécurisée, responsive et évolutive.

Tu dois considérer ce document comme la référence fonctionnelle et technique du projet.

Ne perds aucune des décisions décrites ci-dessous au fil des développements.

---

# 1. PRÉSENTATION DU PROJET

## Nom

Miss Prono (nom provisoire).

## Concept

Miss Prono est une application web publique de pronostics autour de l'élection Miss France.

Le concept s'inspire du fonctionnement de Mon Petit Prono (MPP), mais transpose son principe à l'élection Miss France.

L'objectif est de permettre à chacun de pronostiquer le classement final de l'élection, de défier ses amis et de comparer ses résultats avec ceux de la communauté.

L'application doit proposer une véritable expérience ludique et compétitive, tout en conservant un univers visuel premium, élégant et prestigieux.

## Objectifs

- Permettre à tout le monde de créer un compte gratuitement.
- Consulter les candidates d'une édition.
- Réaliser son pronostic complet.
- Classer les 12 candidates dans l'ordre souhaité.
- Créer des ligues privées avec ses amis.
- Comparer ses pronostics avec ceux des autres joueurs.
- Consulter un classement général.
- Découvrir les résultats et les scores après l'élection.
- Proposer une expérience spéciale pendant la soirée de l'élection.

## Première édition

Miss France 2027.

L'application doit toutefois être conçue pour fonctionner avec plusieurs éditions successives.

Il ne faut jamais coder en dur une logique qui empêcherait de créer Miss France 2028, 2029, etc.

## Modèle économique

- Application gratuite.
- Aucun abonnement au lancement.
- Aucune publicité au lancement.
- Accès public à l'application.
- Création de compte nécessaire pour enregistrer ses pronostics et participer aux classements.

---

# 2. DÉCISIONS FONCTIONNELLES VALIDÉES

Ces décisions sont considérées comme acquises.

## Pronostics

Chaque utilisateur doit pouvoir réaliser un pronostic portant sur le classement complet des 12 candidates.

Le classement comprend :

- Rang 1 : Miss France.
- Rang 2 : Première dauphine.
- Rang 3 : Deuxième dauphine.
- Rang 4 : Troisième dauphine.
- Rang 5 : Quatrième dauphine.
- Rangs 6 à 12 : les autres candidates du Top 12.

L'utilisateur doit donc sélectionner et ordonner exactement 12 candidates différentes.

Les positions 1 à 5 constituent le Top 5.

Les positions 1 à 12 constituent le Top 12.

Il ne s'agit pas de deux pronostics indépendants : le Top 5 est inclus dans le classement complet des 12 candidates.

### Fonctionnement

L'utilisateur doit pouvoir :

- Consulter toutes les candidates.
- Rechercher une candidate.
- Filtrer les candidates par région.
- Ajouter une candidate à son classement.
- Modifier l'ordre de ses candidates.
- Utiliser le glisser-déposer.
- Retirer une candidate.
- Visualiser les 12 positions.
- Voir le nombre de positions restantes.
- Sauvegarder son brouillon.
- Visualiser son classement avant validation définitive.
- Choisir et enregistrer séparément un coup de cœur parmi toutes les candidates, qu'elle soit ou non dans son Top 12.
- Générer sur son appareil une carte image de son coup de cœur ou de son Top 12 complet et la partager explicitement.

La validation doit être impossible si les 12 positions ne sont pas correctement remplies.

Une même candidate ne peut pas apparaître deux fois.

## Confidentialité des pronostics

Règle fondamentale du produit :

**Les pronostics restent privés jusqu'à la clôture officielle des pronostics.**

Avant la clôture :
- Un utilisateur peut consulter son propre pronostic.
- Il ne peut pas consulter les pronostics des autres.
- Aucun endpoint ou accès direct à la base ne doit permettre de contourner cette restriction.

Après la clôture :
- Les pronostics deviennent visibles.
- Les joueurs peuvent comparer leurs choix.
- Les classements et comparaisons deviennent accessibles.

Cette confidentialité doit être garantie au niveau de Supabase et PostgreSQL, pas uniquement par l'interface frontend.

La date et l'heure de clôture doivent être configurables par édition.

Le coup de cœur est privé et modifiable pendant la période de préparation et jusqu'à la clôture, selon les mêmes règles que le brouillon. Après publication des résultats, l'utilisateur connecté peut voir si sa favorite a remporté l'élection. Le partage génère localement une carte du coup de cœur avec le portrait de la candidate; aucune page publique ni aucun endpoint ne révèle le pronostic. L'interface avertit avant de générer le Top 12 que le destinataire verra les choix si l'utilisateur le partage.

## Ligues privées

Chaque utilisateur doit pouvoir :

- Créer une ligue.
- Donner un nom à sa ligue.
- Obtenir un code d'invitation.
- Partager ce code avec ses amis.
- Rejoindre une ligue existante.
- Consulter le classement des membres.

Un utilisateur peut appartenir à plusieurs ligues.

Une ligue appartient à une édition.

Les classements des ligues doivent être calculés à partir des scores des membres.

## Classement général

L'application doit proposer un classement général des joueurs.

Chaque joueur doit pouvoir consulter :
- Son rang.
- Son nombre de points.
- Son nombre de positions exactes.
- Son évolution éventuelle.
- Les autres participants.

Le classement doit être accessible après la publication des résultats et le calcul des scores.

## Résultats officiels

Un espace administrateur doit permettre de :
- Gérer les éditions.
- Ajouter, modifier et supprimer des candidates.
- Gérer les photos des candidates.
- Configurer les dates importantes.
- Publier les résultats officiels.
- Définir le classement final.
- Déclencher le calcul des scores.
- Consulter les participants.

## Mode soirée de l'élection

Prévoir une architecture permettant de gérer la cérémonie en direct.

L'administrateur doit pouvoir publier les différentes étapes :
- Annonce des candidates sélectionnées.
- Publication des demi-finalistes.
- Publication des finalistes.
- Publication du résultat final.

Les scores et classements pourront être actualisés au fil de la soirée lorsque les résultats officiels seront confirmés.

La publication doit toujours être contrôlée par un administrateur.

Ne jamais inventer ou récupérer automatiquement des résultats non vérifiés.

---

# 3. RÈGLES DE SCORING

Le système de points doit être développé dans un module métier indépendant du frontend.

Barème de départ proposé :

| Position exacte | Points |
|---|---:|
| Miss France | 100 |
| Première dauphine | 50 |
| Deuxième dauphine | 50 |
| Troisième dauphine | 50 |
| Quatrième dauphine | 50 |
| Candidate correctement trouvée dans le Top 12 | 10 par candidate, quel que soit son ordre annoncé |

Les cinq rangs sont exacts et rapportent leurs points en plus des points de présence dans le Top 12. Le score maximal théorique est donc de 420 points.

Règle :
- Chaque candidate du Top 12 correctement sélectionnée rapporte 10 points, indépendamment de son ordre d'annonce.
- Les places exactes du Top 5 rapportent en plus 100 points pour la gagnante et 50 points pour chaque dauphine.
- Les annonces de demi-finalistes sont aléatoires; aucun rang fictif n'est attribué aux places 6 à 12.

Le barème Top 5 historique a été adapté avec l'accord du propriétaire du produit le 18 novembre 2026 pour tenir compte de l'annonce aléatoire du Top 12. Les règles sont stockées en base et modifiables par un administrateur pour l'édition.

Prévoir des tests automatisés pour tous les cas de calcul.

---

# 4. IDENTITÉ VISUELLE

La direction artistique est déjà choisie.

## Positionnement

Miss Prono doit ressembler à un produit digital premium.

L'univers recherché est un mélange de :
- Magazine de luxe.
- Cérémonie prestigieuse.
- Application de compétition moderne.

Éviter :
- Le design trop institutionnel.
- Les interfaces de casino.
- Les interfaces gaming trop agressives.
- Les couleurs trop nombreuses.
- Les effets visuels excessifs.

## Palette officielle

| Nom | Code |
|---|---|
| Noir profond | #101010 |
| Noir secondaire | #1B1A18 |
| Champagne | #E8D9BC |
| Or | #C8A45D |
| Ivoire | #F7F3EB |
| Gris doux | #96918A |

Le noir doit dominer l'interface.

L'or doit être utilisé avec parcimonie pour :
- Les boutons principaux.
- Les éléments de sélection.
- Les couronnes.
- Les classements.
- Les accents visuels.

Le champagne doit être utilisé pour les titres et les éléments premium.

## Typographies

- Cormorant Garamond : titres, identité de marque et grands chiffres.
- DM Sans : textes, navigation, formulaires et interfaces fonctionnelles.

## Logo

Identité typographique :
- MISS PRONO en lettres capitales.
- Couronne minimaliste.
- Espacement généreux.
- Déclinaison compacte MP pour le favicon.

## Règles générales du design

- Thème dark intégral sur toutes les pages.
- Responsive desktop, tablette et mobile.
- Cartes avec coins arrondis d'environ 16 px.
- Boutons avec coins arrondis d'environ 12 px.
- Champs avec coins arrondis d'environ 10 px.
- Bordures discrètes.
- Animations légères.
- Transitions fluides.
- Bonne lisibilité et accessibilité.

Ne jamais proposer automatiquement un thème clair.

Ne pas changer arbitrairement l'identité visuelle sans me consulter.

---

# 5. STACK TECHNIQUE VALIDÉE

La stack est définitivement choisie.

## Frontend

- Next.js avec App Router.
- React.
- TypeScript.
- Tailwind CSS.
- Lucide React pour les icônes.

## Backend et données

- Supabase.
- PostgreSQL.
- Supabase Auth.
- Supabase Storage.
- Supabase Realtime si nécessaire.

## Déploiement

- Vercel pour l'hébergement.
- Git pour le versionnement.

## Bibliothèques complémentaires

- Zod pour la validation.
- dnd-kit pour le glisser-déposer.
- Bibliothèques adaptées aux tests unitaires et end-to-end.

Privilégier des solutions simples, maintenables et bien documentées.

Ne pas ajouter de dépendances inutilement.

---

# 6. ARCHITECTURE DU PROJET

Le projet doit rester dans un seul repository.

Utiliser une architecture modulaire et organisée par fonctionnalités.

Structure cible :

```text
miss-prono/
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx
│   │   │   ├── candidates/
│   │   │   └── classement/
│   │   ├── (auth)/
│   │   │   ├── connexion/
│   │   │   └── inscription/
│   │   ├── (dashboard)/
│   │   │   ├── pronostics/
│   │   │   ├── ligues/
│   │   │   └── profil/
│   │   ├── admin/
│   │   └── api/
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── candidates/
│   │   ├── predictions/
│   │   ├── leagues/
│   │   └── leaderboard/
│   ├── features/
│   │   ├── auth/
│   │   ├── editions/
│   │   ├── predictions/
│   │   ├── scoring/
│   │   ├── leagues/
│   │   └── results/
│   ├── lib/
│   │   ├── supabase/
│   │   ├── validations/
│   │   └── utils/
│   └── types/
├── supabase/
│   ├── migrations/
│   ├── seed.sql
│   └── functions/
├── public/
├── package.json
└── README.md
```

Cette structure est une cible évolutive. Tu peux l'adapter légèrement si cela améliore réellement l'architecture, mais conserve une séparation claire entre composants, logique métier, données et infrastructure.

---

# 7. MODÈLE DE DONNÉES

Utiliser PostgreSQL avec Supabase.

Le modèle doit être relationnel, cohérent et prévu pour plusieurs éditions.

Tables principales :

## users / profiles

Gestion des profils utilisateurs.

L'authentification est déléguée à Supabase Auth.

Champs indicatifs :
- id (UUID, référence auth.users)
- username
- avatar_url
- created_at

Le prénom et le nom sont des données privées et résident dans `private_profiles`, avec accès limité au propriétaire par RLS. Le pseudo public reste dans `profiles.username`.

Ne jamais stocker les mots de passe dans cette table.

## editions

Gestion des éditions Miss France.

Champs :
- id
- name
- status
- predictions_deadline
- ceremony_at
- created_at

Statuts possibles :
- draft
- upcoming
- open
- locked
- live
- completed

## candidates

Gestion des candidates par édition.

Champs :
- id
- edition_id
- first_name
- last_name
- region
- photo_url
- candidate_number
- created_at

Une candidate appartient obligatoirement à une édition.

## predictions

Pronostics des utilisateurs.

Champs :
- id
- user_id
- edition_id
- status
- submitted_at
- created_at
- updated_at

Un utilisateur ne peut avoir qu'un pronostic principal par édition.

Prévoir les états draft et submitted.

## prediction_choices

Positions sélectionnées dans un pronostic.

Champs :
- id
- prediction_id
- candidate_id
- rank

Contraintes :
- Un seul candidat par rang.
- Une seule occurrence d'une candidate par pronostic.
- Rang compris entre 1 et 12.
- Le candidat doit appartenir à la même édition que le pronostic.
- Un pronostic soumis doit contenir exactement 12 candidates.

## leagues

Ligues privées.

Champs :
- id
- edition_id
- owner_id
- name
- invite_code
- created_at

## league_members

Association entre utilisateurs et ligues.

Champs :
- league_id
- user_id
- joined_at

Prévoir une clé primaire composite.

## results

Résultats officiels.

Champs :
- id
- edition_id
- candidate_id
- final_rank

Une candidate ne peut avoir qu'un seul rang officiel par édition.

Un rang ne peut être attribué qu'à une seule candidate.

## scoring_rules

Configuration du barème.

Champs :
- id
- edition_id
- rank
- points

## scores

Scores calculés.

Champs :
- id
- prediction_id
- total_points
- calculated_at

Les scores doivent pouvoir être recalculés proprement si un résultat officiel est corrigé.

Prévoir également une table ou un mécanisme permettant de gérer les événements de cérémonie en direct.

Toutes les relations doivent avoir des clés étrangères, contraintes et index pertinents.

Produire les migrations SQL dans le dossier supabase/migrations.

Ne pas se limiter à créer des types TypeScript : la base doit être réellement cohérente.

---

# 8. SÉCURITÉ ET PERMISSIONS

La sécurité est une priorité absolue.

Activer Row Level Security sur les tables sensibles.

Règles attendues :

| Ressource | Permissions |
|---|---|
| Profil | Lecture publique limitée, modification propriétaire |
| Informations privées du profil | Lecture et modification propriétaire uniquement |
| Pronostic personnel | Propriétaire uniquement avant clôture |
| Pronostics des autres | Interdits avant clôture |
| Pronostics après clôture | Lecture autorisée selon les règles métier |
| Modification après clôture | Interdite |
| Candidates | Lecture publique |
| Résultats officiels | Lecture publique après publication |
| Modification des résultats | Administrateurs |
| Éditions | Gestion administrateur |
| Barèmes | Lecture publique, modification administrateur |
| Ligues | Accès réservé aux membres selon les données |
| Scores | Calcul backend uniquement |

Points techniques obligatoires :

- Ne jamais faire confiance au frontend.
- Ne jamais exposer la clé service_role.
- Ne jamais permettre à un utilisateur de modifier son score.
- Vérifier les permissions côté serveur.
- Vérifier la date de clôture côté serveur et dans la logique SQL.
- Protéger les routes administrateur.
- Contrôler les entrées avec Zod.
- Éviter les accès directs non autorisés aux données.
- Utiliser des transactions SQL pour valider les pronostics.

Les règles RLS doivent réellement empêcher l'accès aux données privées, même avec des requêtes API directes.

---

# 9. PAGES À DÉVELOPPER

## Homepage

C'est la première page à finaliser.

Elle doit comprendre :

1. Navbar.
2. Logo Miss Prono.
3. Navigation.
4. Hero avec identité visuelle forte.
5. Présentation de Miss Prono 2027.
6. Bouton principal pour commencer à pronostiquer.
7. Présentation du concept.
8. Fonctionnalités principales.
9. Aperçu du classement.
10. Call-to-action.
11. Footer.

Le rendu doit être premium et responsive.

## Page candidates

- Liste des candidates.
- Portraits.
- Nom.
- Région.
- Numéro.
- Recherche.
- Filtres.
- Fiche détaillée éventuelle.

## Page pronostics

Page centrale de l'application.

- Liste des candidates.
- Sélection.
- Recherche et filtres.
- Douze emplacements.
- Glisser-déposer.
- Progression.
- Sauvegarde du brouillon.
- Validation.
- Confirmation.
- Verrouillage après clôture.

## Page classement

- Podium.
- Classement général.
- Points.
- Positions exactes.
- Informations des joueurs.
- Pagination si nécessaire.

## Page ligues

- Mes ligues.
- Création.
- Invitation.
- Rejoindre avec un code.
- Classement des membres.

## Page profil

- Informations personnelles.
- Avatar.
- Pseudonyme.
- Historique.
- Pronostics.

## Back-office administrateur

- Gestion des éditions.
- Gestion des candidates.
- Gestion des utilisateurs si nécessaire.
- Affichage du calendrier et des phases automatiques de l’édition.
- Gestion des résultats.
- Gestion du barème.
- Gestion des étapes de cérémonie.

---

# 10. COMPOSANTS RÉUTILISABLES

Créer progressivement une bibliothèque de composants :

- Button
- Navbar
- Footer
- CandidateCard
- CandidateSelector
- RankingSlot
- LeaderboardTable
- Podium
- LeagueCard
- Countdown
- ScoreBadge
- UserAvatar
- Modal
- Toast
- LoadingState
- EmptyState
- ErrorState

Les composants doivent être réutilisables et respecter le design system.

Éviter les composants monolithiques.

---

# 11. API MÉTIER

Prévoir les opérations suivantes, en adaptant les conventions Next.js :

| Méthode | Endpoint | Fonction |
|---|---|---|
| GET | /api/editions/current | Édition actuelle |
| GET | /api/candidates | Candidates |
| GET | /api/predictions/me | Mon pronostic |
| PUT | /api/predictions/me | Sauvegarder le brouillon |
| POST | /api/predictions/submit | Soumettre le pronostic |
| GET | /api/leaderboard | Classement général |
| POST | /api/leagues | Créer une ligue |
| POST | /api/leagues/join | Rejoindre une ligue |
| GET | /api/leagues/[id] | Détails d'une ligue |
| GET | /api/results | Résultats officiels |

Toutes les routes sensibles doivent vérifier les droits d'accès.

Privilégier les Server Actions ou Route Handlers selon le cas d'usage. Ne pas créer une API artificiellement complexe si une opération serveur directe est plus adaptée.

---

# 12. ÉTAT ACTUEL DU DÉVELOPPEMENT

Une première base frontend a déjà été préparée.

Elle utilise :
- Next.js 15.
- React 19.
- TypeScript.
- Tailwind CSS 4.
- Lucide React.

Le projet comprend notamment :
- Une homepage.
- Une navbar responsive.
- Un hero.
- Des cartes de fonctionnalités.
- Un aperçu du classement fictif.
- Un footer.
- Des pages provisoires.
- Un premier design system.
- Une illustration SVG originale.

Les composants sont répartis dans :
- src/app
- src/components
- src/data
- src/types

Les données des candidates de l'édition 2027 sont lues depuis Supabase sur la galerie et les fiches, avec un repli local.

Supabase Auth est connecté pour l'inscription et la connexion par email et mot de passe. L'inscription collecte prénom, nom et pseudo; une migration dédiée stocke le pseudo dans `profiles` et les noms dans `private_profiles` protégée par RLS. Une page profil permet leur consultation et leur modification. Pour la V1, la confirmation email peut être désactivée dans le fournisseur Email Supabase afin de connecter immédiatement les nouveaux comptes. Si elle est activée, le flux de confirmation utilise une page intermédiaire anti-préchargement et accepte le callback PKCE. Les sessions sont stockées dans des cookies et renouvelées par le proxy Next.js. Les routes pronostics, ligues et profil demandent une session authentifiée.

Les brouillons et soumissions de pronostics sont enregistrés dans Supabase via une fonction transactionnelle et des politiques RLS. Une soumission reste modifiable par son propriétaire jusqu'à l'échéance; l'enregistrement conserve son statut soumis et sa confidentialité. À la clôture, les fonctions SQL verrouillent immédiatement le Top 12 et le coup de cœur. La page `/ligues` est connectée à Supabase : un membre peut créer une ligue, la rejoindre avec un code d'invitation et consulter ses membres. Les fonctions SQL autorisent création et adhésion pendant `upcoming` ou `open` tant que l'échéance n'est pas dépassée (ou qu'elle est absente en `upcoming`). Les codes restent visibles aux membres de chaque ligue. La page prévoit les colonnes points et exactitude, qui se remplissent quand les scores sont publiés.

Le relais de cérémonie `/annonceur` est réservé aux admins et aux comptes autorisés par un admin depuis `/admin/annonciateurs`. Il publie successivement les 12 demi-finalistes sans rang, les cinq finalistes, puis leurs places officielles de la 5e à la 1re. Chaque publication recalcule immédiatement les scores; ils restent provisoires jusqu'aux 12 annonces et aux cinq places. Le barème est de 10 points par candidate du Top 12 trouvée, plus 100 points pour le rang exact de Miss France et 50 pour chaque rang exact des quatre dauphines (420 maximum). Les pronostics restent privés avant le direct; pendant la cérémonie, un RPC n'expose aux seuls membres d'une même ligue que le rang prédit de la candidate qui vient d'être annoncée. Les ligues affichent le classement provisoire, les réactions 👏🔥👑 et un historique des annonces. Une annulation n'est possible que pour la dernière annonce candidate; l'action est auditée et déclenche le recalcul. Les résultats officiels manuels se limitent aux cinq places du Top 5. Le classement global n'expose que les pseudos et scores agrégés.

La page `/resultats` affiche séparément les demi-finalistes dans leur ordre d'annonce et le Top 5 officiel, ainsi que le fil d'événements. Le fil et les réactions se mettent à jour via Supabase Realtime avec un repli périodique. Les annonces sont saisies par une personne de confiance dans la console; elles ne sont pas récupérées automatiquement depuis une source externe. Les phases de Miss France 2027 basculent automatiquement via Supabase Cron, chaque minute : ouverture jusqu'au 11 décembre 2026 à 23 h 59 heure de Paris, fermeture à minuit, direct le 12 décembre à 21 h 10, puis terminée le 13 décembre à 02 h. Le serveur SQL reste l'autorité qui bloque toute modification dès l'échéance, même si une interface n'a pas encore actualisé son affichage.

La gestion des candidates se trouve sous `/admin/candidates`. Les admins peuvent créer, modifier et supprimer les fiches de l'édition courante, dont le profil, les sources et les photos. Les portraits sont téléversés dans le bucket public `candidate-photos`; les politiques Storage autorisent la lecture publique mais réservent téléversement, remplacement et suppression aux admins. Les suppressions restent soumises aux clés étrangères des résultats et pronostics existants.

IMPORTANT :

Avant de modifier quoi que ce soit, inspecte intégralement le repository existant.

Ne repars pas de zéro sans raison.

Conserve les éléments déjà réalisés lorsqu'ils sont cohérents avec le présent cahier des charges.

Identifie les éventuelles erreurs, incohérences ou améliorations nécessaires.

Si le repository est vide, construis le socle depuis zéro en respectant cette spécification.

---

# 13. MÉTHODE DE TRAVAIL ATTENDUE

Je souhaite travailler progressivement avec toi.

Tu dois agir comme un véritable développeur senior.

## Règle 1 : inspecter avant de coder

Au début de chaque nouvelle session :
- Consulte ce document.
- Inspecte le repository.
- Identifie les fonctionnalités existantes.
- Identifie les tâches restantes.
- Vérifie les éventuelles régressions.

Ne suppose jamais qu'une fonctionnalité existe sans vérifier son implémentation.

## Règle 2 : avancer par étapes

Ne développe pas toute l'application en une seule fois.

Découpe le travail en fonctionnalités cohérentes.

Propose un plan, puis implémente les étapes.

Priorité initiale :

1. Finaliser le design system.
2. Finaliser la homepage.
3. Développer la page candidates.
4. Développer le moteur de pronostics.
5. Mettre en place Supabase.
6. Développer l'authentification.
7. Développer les ligues.
8. Développer le scoring.
9. Développer le classement.
10. Développer le back-office.
11. Développer le mode soirée.
12. Effectuer les tests et préparer la production.

L'ordre pourra être adapté en fonction des dépendances techniques.

## Règle 3 : qualité du code

- TypeScript strict.
- Composants propres.
- Fonctions métier isolées.
- Pas de duplication inutile.
- Pas de code mort.
- Pas de données sensibles exposées.
- Gestion correcte des erreurs.
- États de chargement.
- États vides.
- Interface accessible.
- Responsive design.
- Tests adaptés.

## Règle 4 : tests

Après chaque fonctionnalité importante :
- Vérifie le typage.
- Lance les tests.
- Lance le lint.
- Lance le build lorsque pertinent.
- Corrige les erreurs.

Ne prétends jamais qu'un test ou un build a réussi sans l'avoir réellement exécuté.

## Règle 5 : documentation

Maintiens à jour :
- README.md
- PROJECT_CONTEXT.md
- Les migrations SQL.
- Les variables d'environnement documentées.
- La documentation des fonctionnalités importantes.

## Règle 6 : ne pas inventer les informations

Si une décision métier importante manque :
- Signale le point.
- Explique les possibilités.
- Recommande une solution.
- Demande ma validation avant de figer une règle structurante.

Ne modifie pas les décisions déjà validées sans me consulter.

---

# 14. CONTRAINTES JURIDIQUES ET CONTENUS

Le projet est indépendant.

Ne laisse jamais entendre que Miss Prono est officiellement affilié à l'organisation Miss France.

Prévoir une mention explicite d'indépendance.

Pour les photographies et contenus des candidates :
- Utiliser uniquement des images dont l'utilisation est autorisée.
- Ne pas récupérer arbitrairement des images protégées.
- Prévoir un système d'administration des images.
- Utiliser des visuels fictifs ou temporaires pour les maquettes.

Prévoir également les pages et sujets nécessaires à une mise en conformité avant le lancement public :
- Mentions légales.
- Politique de confidentialité.
- Gestion des cookies si nécessaire.
- Conditions d'utilisation.
- Gestion des demandes relatives aux données personnelles.

---

# 15. PREMIÈRE MISSION À EXÉCUTER

Pour commencer, je veux que tu prennes connaissance de l'ensemble de ce cahier des charges et du code existant.

Ta première mission est de réaliser un audit technique du repository.

Je veux obtenir :

1. Un état des lieux de l'architecture actuelle.
2. Les fonctionnalités déjà présentes.
3. Les problèmes éventuels.
4. Les écarts par rapport au cahier des charges.
5. Les améliorations prioritaires.
6. Un plan de développement concret.

Ensuite, commence par finaliser le socle frontend et la homepage.

Ne passe pas directement à la connexion Supabase.

Je veux d'abord obtenir une interface frontend cohérente, premium, responsive et visuellement aboutie.

À la fin de chaque intervention, présente-moi :
- Ce que tu as développé.
- Les fichiers créés ou modifiés.
- Les décisions techniques prises.
- Les commandes de vérification exécutées et leurs résultats.
- Les prochaines étapes recommandées.

---

# OBJECTIF FINAL

Construire une véritable application web publique appelée Miss Prono, destinée à devenir une référence de pronostics autour de l'élection Miss France.

Le produit doit être :
- Élégant.
- Moderne.
- Rapide.
- Responsive.
- Sécurisé.
- Facile à utiliser.
- Évolutif d'une édition à l'autre.
- Capable de gérer une communauté importante.

La priorité est de construire un produit de qualité, pas simplement une démonstration visuelle.

Tu dois garder ce cahier des charges comme référence pendant toute la durée du développement.

**Nous construisons Miss Prono progressivement, proprement et avec une vraie exigence de qualité.**
