# Plan de refonte Afrinexa

## Objectif et contraintes

Continuer le site existant dans son dépôt et conserver ses routes, son identité et son déploiement Vercel. La priorité actuelle est l’intégration du cahier des charges « Premium Authentication System »; le sujet du suivi international des marchandises reste en attente. Les éléments des missions antérieures de fret, catalogue et administration restent l’historique du projet.

Les migrations `0000` à `0005` définissent déjà le schéma utilisé par le projet; ne pas modifier ni appliquer de migration pour cette priorité d’authentification. L’inscription publique attribue le rôle `client` par le déclencheur `handle_new_user`; les rôles privilégiés restent contrôlés côté serveur et ne doivent jamais venir des champs du formulaire ou de `user_metadata`. Ne pas utiliser les identifiants partagés dans la conversation. Google OAuth reste désactivé sans configuration OAuth Google; ne pas prétendre que le fournisseur fonctionne avant son activation.

## Approche d’implémentation

- Retirer uniquement la bande d’annonce « Chine → Afrique → Europe · Livraison selon devis » de `SiteHeader`; conserver les informations utiles dans le contenu des pages et le pied de page.
- Faire évoluer `TrackingSlideshow` en composant réutilisable avec une variante `air`, `sea` et `all`. Les images maritimes proviendront uniquement des images fournies qui montrent directement une scène de navire, de port ou de conteneurs. La sélection fournie ne contient pas de photo de fret aérien assez certaine; produire des illustrations génériques clairement présentées comme illustratives, sans logos, itinéraires ou promesses opérationnelles.
- Ajouter à chacune des pages transport un bloc de suivi partagé `TrackForm`, puis son diaporama dédié, tout en conservant la route `/suivi` comme résultat de recherche et suivi global.
- Réorganiser l’admin autour d’un rail latéral responsive et d’une zone de travail inspirée du Reel. La recherche, les filtres, les cartes produits et les alertes doivent dériver des données réellement reçues. Signaler les erreurs de schéma/API; ne jamais convertir une erreur en zéro, liste vide ou stock inventé. Une alerte de réapprovisionnement ne peut reposer que sur un stock explicitement égal à zéro, car aucun seuil de réapprovisionnement n’est défini.
- Ajouter le démarrage OAuth Google avec Supabase Auth et un message d’état utile si le fournisseur n’est pas activé. Les URL de redirection et secrets OAuth restent à configurer dans Supabase par un canal sécurisé; le parcours email existant reste disponible.
- Traiter les vulnérabilités npm avec des mises à jour compatibles et ajouter les en-têtes HTTP sûrs applicables à Vercel. Ne pas imposer de CSP sans tester les scripts SSR/hydratation, la carte et les redirections OAuth.
- Préserver les pages et données existantes; aucun faux catalogue, prix, stock, statistique ou trajet ne sera ajouté.
- Dynamiser `/boutique/` en reprenant seulement les motifs confirmés de la référence AfroSino Express (catégories vedettes et cartes de produits, https://afrosinoexpress.novextracking.com/index.php). Renforcer la hiérarchie du titre et des filtres, animer l’entrée des cartes et le réagencement après filtrage, et conserver la recherche, le tri, les devises, les catégories, la pagination et les images actuels.
- Rapprocher visuellement l’accueil et le shell global de la référence : en-tête navy à deux bandes, hero ample avec transitions de texte, catégories en cartes, bande de services, encart sur les modalités de paiement, produits vedettes, parcours, footer et navigation mobile compacte. Ne changer ni API, schéma, données, authentification, routes ou flux de commande. Réutiliser les images Afrinexa existantes; n’emprunter aucun visuel/propos tiers ni créer de faux témoignage, tarif ou condition commerciale. Comme aucun avis Afrinexa ni système de dépôt d’avis n’est actuellement présent, ne pas afficher de témoignage ni d’action « Laisser un avis » non fonctionnelle. Cette contrainte concernait l’étape précédente accueil/catalogue; la priorité actuelle autorise uniquement les changements d’authentification décrits dans le complément ci-dessous.

## Structure du projet

- `src/routes/` conserve les routes TanStack du site, dont `/transport-aerien`, `/transport-maritime`, `/suivi`, `/auth` et les routes admin authentifiées.
- `src/components/site/` contient les composants réutilisables du site, notamment l’en-tête, le formulaire de suivi et le diaporama.
- `src/routes/_authenticated/admin/` contient le shell d’administration, le tableau de bord et la gestion de produits existants.
- `src/lib/` héberge les requêtes de catalogue, les types et les helpers de données.
- `src/integrations/supabase/` reste le client Supabase; aucune clé secrète ne doit être intégrée au bundle navigateur.
- `public/chipment/` contient les images fournies et les nouveaux visuels illustratifs nécessaires au fret aérien; `manifest.json` reste la référence des images d’origine.
- `public/manus-routes.json` décrit les routes; il sera maintenu si l’ensemble change.
- `drizzle/migrations/` reste inchangé conformément au refus explicite de modifier la base.
- `vercel.json` portera les en-têtes HTTP additionnels si la configuration actuelle ne les fournit pas.

## Design

- **Mouvement** : interface de logistique premium, entre centre de contrôle contemporain et commerce B2B, en s’inspirant de la hiérarchie du Reel sans en copier l’apparence.
- **Principes** : informations véridiques; navigation admin lisible; contrastes forts; commandes simples et accessibles.
- **Philosophie couleur** : garder le bleu nuit pour les barres de navigation, l’or/ambre pour les appels à l’action et repères commerciaux, le fond clair pour les sections de catalogue, le cyan restant un accent Afrinexa.
- **Paradigme de mise en page** : accueil et boutique sur fond clair à sections commerciales empilées, en-tête navy partagé et navigation compacte sur mobile; pages transport en séquence verticale héros → saisie de suivi → diaporama → étapes.
- **Éléments distinctifs** : rail sombre; cartes produits sobres avec badge de stock réel; contrôles de carrousel discrets et accessibles.
- **Interactions** : recherche instantanée, filtres explicites, navigation clavier, états de chargement/erreur visibles et aucun faux état vide.
- **Animations** : transitions courtes et mesurées; dans le catalogue, révélation en cascade, réagencement doux des cartes, indicateur de catégorie actif et survol discret; conserver la prise en charge de `prefers-reduced-motion`.
- **Typographie** : Manrope pour le texte fonctionnel et Sora pour les titres, comme dans le site existant.
- **Essence de marque** : sourcing et logistique entre la Chine, l’Afrique et l’Europe; claire, fiable et professionnelle.
- **Voix** : directe et informative. Exemples : « Où est votre marchandise ? » et « Stock déclaré : 0 — à réapprovisionner ».
- **Logotype** : conserver la marque actuelle « A » dans son médaillon circulaire; aucune nouvelle identité n’est nécessaire.
- **Couleur signature** : cyan électrique, utilisé pour les repères d’action et de suivi.

## Complément — priorité authentification premium (23 novembre 2026)

- **Périmètre** : refondre `/auth`, ajouter les parcours de récupération et de réinitialisation, compléter le profil et le changement de mot de passe dans l’espace client. Ne pas reprendre le chantier de suivi international et ne pas changer les migrations ni les fichiers Supabase générés.
- **Architecture** : React, TanStack Router, Supabase Auth et Motion sont déjà utilisés ou installés. Garder l’authentification réelle avec le client Supabase existant, ses sessions persistantes et les gardes de routes actuelles. Ne jamais stocker le mot de passe dans l’application. Les inscriptions publiques restent `client`; aucune valeur de formulaire ni métadonnée ne peut attribuer un rôle staff.
- **Direction artistique** : écran plein cadre noir profond et or, marque AFRINEXA avec « GLOBAL LOGISTICS & CARGO TRACKING » et « Connecting the World. Delivering Trust. », panneau de verre fumé bordé d’or. La référence image n’étant pas disponible dans les fichiers du projet, construire les sphères métalliques par CSS (dégradés spéculaires, ombres et couches de profondeur) plutôt que d’ajouter une scène WebGL coûteuse. Employer des mouvements lents, indépendants et décoratifs, des particules sobres, une transition Login/Sign up par fondu et déplacement horizontal, et respecter `prefers-reduced-motion` avec un contrôle manuel.
- **Parcours** : conserver Login et Sign up dans `/auth`. Login comprend email, mot de passe visible/masqué, indicateur de chargement, erreurs neutres, option « Remember Me » et lien « Forgot Password? ». Sign up comprend nom complet, email, téléphone, pays, mot de passe, confirmation, indicateur de robustesse, validations et consentement aux conditions. Le texte ne doit pas inventer de conditions commerciales ou de politique juridique absentes.
- **Récupération** : les routes de demande et de réinitialisation utilisent `resetPasswordForEmail` et `updateUser` de Supabase Auth avec des redirections `/reset-password` autorisées. Le projet doit avoir son URL de site et de redirection correctement allowlistée, ainsi qu’un SMTP de production si l’envoi par défaut ne suffit pas; le code ne doit pas annoncer la livraison d’un email sans vérification de configuration.
- **Espace client et accès** : ajouter l’édition des champs déjà présents dans `profiles` et le changement de mot de passe via la session Supabase. Conserver commandes, numéros de suivi, expéditions, historique et déconnexion. Garder `/admin` derrière la garde staff/RLS existante; les changements n’élargissent pas le périmètre de gestion admin.
- **Persistance Remember Me** : le client généré, à conserver sans modification, persiste actuellement les sessions. L’option du formulaire mémorisera l’adresse email seulement, jamais le mot de passe, et l’interface l’indiquera clairement; elle ne devra pas laisser croire qu’elle modifie la durée de session Supabase.
- **Fichiers concernés** : `src/routes/auth.tsx`, nouveaux composants d’authentification dans `src/components/auth/`, routes publiques de récupération/réinitialisation, `src/routes/_authenticated/espace.tsx`, affichage du shell dans `src/routes/__root.tsx`, et `public/manus-routes.json`. `src/routeTree.gen.ts`, `src/integrations/supabase/client.ts` et `previewAuthStorage.ts` sont générés et ne sont pas édités manuellement.
