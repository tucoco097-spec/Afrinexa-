# Plan de refonte Afrinexa

## Objectif et contraintes

Continuer le site existant dans son dépôt et conserver ses routes, son identité et son déploiement Vercel. Les pages de fret aérien et maritime auront chacune un formulaire de suivi suivi immédiatement d’un diaporama adapté. Le panneau d’administration reprendra les principes observés dans le Reel Facebook fourni (rail sombre, zone de travail produits claire, recherche, catégories, ajout et signalement de stock), sans inventer de métriques. L’espace client gardera l’inscription/connexion par email et ajoutera le parcours Google côté application.

Le schéma Supabase de production est vide et l’utilisateur a refusé toute modification de schéma ou de migration. Ne pas modifier ni appliquer les fichiers `drizzle/migrations/*.sql`, ne pas écrire dans Supabase, ne pas utiliser les identifiants partagés dans la conversation et ne pas contourner le contrôle de rôle. Google OAuth est désactivé dans Supabase et ne peut être activé sans configuration OAuth Google; le code devra expliquer cette dépendance et ne pas prétendre que le fournisseur fonctionne avant son activation.

## Approche d’implémentation

- Retirer uniquement la bande d’annonce « Chine → Afrique → Europe · Livraison selon devis » de `SiteHeader`; conserver les informations utiles dans le contenu des pages et le pied de page.
- Faire évoluer `TrackingSlideshow` en composant réutilisable avec une variante `air`, `sea` et `all`. Les images maritimes proviendront uniquement des images fournies qui montrent directement une scène de navire, de port ou de conteneurs. La sélection fournie ne contient pas de photo de fret aérien assez certaine; produire des illustrations génériques clairement présentées comme illustratives, sans logos, itinéraires ou promesses opérationnelles.
- Ajouter à chacune des pages transport un bloc de suivi partagé `TrackForm`, puis son diaporama dédié, tout en conservant la route `/suivi` comme résultat de recherche et suivi global.
- Réorganiser l’admin autour d’un rail latéral responsive et d’une zone de travail inspirée du Reel. La recherche, les filtres, les cartes produits et les alertes doivent dériver des données réellement reçues. Signaler les erreurs de schéma/API; ne jamais convertir une erreur en zéro, liste vide ou stock inventé. Une alerte de réapprovisionnement ne peut reposer que sur un stock explicitement égal à zéro, car aucun seuil de réapprovisionnement n’est défini.
- Ajouter le démarrage OAuth Google avec Supabase Auth et un message d’état utile si le fournisseur n’est pas activé. Les URL de redirection et secrets OAuth restent à configurer dans Supabase par un canal sécurisé; le parcours email existant reste disponible.
- Traiter les vulnérabilités npm avec des mises à jour compatibles et ajouter les en-têtes HTTP sûrs applicables à Vercel. Ne pas imposer de CSP sans tester les scripts SSR/hydratation, la carte et les redirections OAuth.
- Préserver les pages et données existantes; aucun faux catalogue, prix, stock, statistique ou trajet ne sera ajouté.

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
- **Philosophie couleur** : conserver le bleu nuit et le bleu royal de la marque; le cyan signale l’action et le suivi, l’or reste une ponctuation premium.
- **Paradigme de mise en page** : rail latéral fixe sur grand écran et navigation compacte sur mobile, avec espace de travail principal indépendant; pages transport en séquence verticale héros → saisie de suivi → diaporama → étapes.
- **Éléments distinctifs** : rail sombre; cartes produits sobres avec badge de stock réel; contrôles de carrousel discrets et accessibles.
- **Interactions** : recherche instantanée, filtres explicites, navigation clavier, états de chargement/erreur visibles et aucun faux état vide.
- **Animations** : transitions courtes et mesurées; conserver la prise en charge de `prefers-reduced-motion`.
- **Typographie** : Manrope pour le texte fonctionnel et Sora pour les titres, comme dans le site existant.
- **Essence de marque** : sourcing et logistique entre la Chine, l’Afrique et l’Europe; claire, fiable et professionnelle.
- **Voix** : directe et informative. Exemples : « Où est votre marchandise ? » et « Stock déclaré : 0 — à réapprovisionner ».
- **Logotype** : conserver la marque actuelle « A » dans son médaillon circulaire; aucune nouvelle identité n’est nécessaire.
- **Couleur signature** : cyan électrique, utilisé pour les repères d’action et de suivi.
