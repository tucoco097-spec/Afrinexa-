# Finalisation Afrinexa

## Modifications réalisées

- Positionnement harmonisé sur **Chine → Afrique → Europe** dans les métadonnées et l’accueil.
- Ajout d’appels à l’action vers la boutique et le sourcing depuis le hero.
- Ajout d’une sélection de visuels catalogue sur la page d’accueil en réutilisant les assets présents.
- Ajout d’une vraie carte interactive Leaflet sur le résultat de tracking.
- Carte alimentée par les lieux connus et les données de départ, destination et dernière position confirmée disponibles dans l’expédition.
- Attribution OpenStreetMap intégrée.
- Aucun trajet ou mouvement n’est inventé lorsque les coordonnées précises ne sont pas disponibles.
- Ajout des styles de marqueurs, légende et états de carte.
- Ajout de `public/manus-routes.json`.
- Ajout des dépendances `leaflet` et `react-leaflet`.

## Vérifications

- `bun run build` : réussi.
- `bun run test` : réussi, 3 fichiers de tests et 8 tests.
- Les erreurs de lint historiques du projet n’ont pas été réécrites globalement ; les fichiers modifiés ont été formatés.

## À configurer côté Lovable/Supabase

- Renseigner les coordonnées précises des aéroports et ports dans les événements d’expédition pour obtenir une carte exacte pour chaque trajet.
- Importer la base mondiale d’aéroports et de ports selon la structure Supabase souhaitée.
- Configurer les clés ou le fournisseur de tuiles cartographiques si le trafic dépasse les limites du serveur public OpenStreetMap.
- Ajouter les données commerciales réelles : produits, prix, stock, devises, transporteurs et coordonnées de contact.
