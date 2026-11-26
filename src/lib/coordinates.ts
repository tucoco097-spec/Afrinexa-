export type CoordinatePair = {
  latitude: number | null;
  longitude: number | null;
};

export type CoordinatePairParseResult =
  { ok: true; value: CoordinatePair } | { ok: false; error: string };

export function parseCoordinatePair(
  latitudeInput: string,
  longitudeInput: string,
): CoordinatePairParseResult {
  const latitudeText = latitudeInput.trim();
  const longitudeText = longitudeInput.trim();

  if (!latitudeText && !longitudeText) {
    return { ok: true, value: { latitude: null, longitude: null } };
  }

  if (!latitudeText || !longitudeText) {
    return {
      ok: false,
      error: "Saisissez la latitude et la longitude, ou laissez les deux champs vides.",
    };
  }

  const latitude = Number(latitudeText);
  const longitude = Number(longitudeText);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { ok: false, error: "Les coordonnées doivent être des nombres valides." };
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return {
      ok: false,
      error: "Latitude : de −90 à 90; longitude : de −180 à 180.",
    };
  }

  return { ok: true, value: { latitude, longitude } };
}
