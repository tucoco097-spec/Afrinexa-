export const AIR_STATUSES = [
  "Colis annoncé",
  "Reçu à l'entrepôt",
  "Vérification",
  "Contrôle qualité",
  "Préparation",
  "En attente d'expédition",
  "Réservation effectuée",
  "Vol confirmé",
  "Départ de Chine",
  "En transit",
  "Arrivée à destination",
  "Formalités douanières",
  "Dédouanement terminé",
  "Disponible pour retrait",
  "En livraison",
  "Livré",
] as const;

export const SEA_STATUSES = [
  "Colis reçu en Chine",
  "Inspection",
  "Consolidation",
  "Préparation du chargement",
  "Conteneur réservé",
  "Chargement",
  "Départ du navire",
  "Transit maritime",
  "Escale éventuelle",
  "Arrivée au port",
  "Déchargement",
  "Formalités douanières",
  "Dédouanement terminé",
  "Disponible pour retrait",
  "Livraison locale",
  "Livré",
] as const;

export const INCIDENT_STATUSES = ["Retard", "Incident", "Bloqué"] as const;

export type Mode = "air" | "sea";

export function statusesFor(mode: Mode): readonly string[] {
  return mode === "air" ? AIR_STATUSES : SEA_STATUSES;
}

/** Progress 0..100 of a shipment according to its current status. Incidents keep last known progress (0 if unknown). */
export function progressFor(mode: Mode, status: string): number {
  const list = statusesFor(mode);
  const i = list.indexOf(status);
  if (i < 0) return 0;
  return Math.round(((i + 1) / list.length) * 100);
}

export const modeLabel = (m: string) => (m === "air" ? "Aérien" : "Maritime");
