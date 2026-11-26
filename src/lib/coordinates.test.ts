import { describe, expect, it } from "vitest";
import { parseCoordinatePair } from "./coordinates";

describe("parseCoordinatePair", () => {
  it("accepte une paire de coordonnées valide", () => {
    expect(parseCoordinatePair("4.0511", "9.7679")).toEqual({
      ok: true,
      value: { latitude: 4.0511, longitude: 9.7679 },
    });
  });

  it("accepte l’absence complète de coordonnées sans inventer de point", () => {
    expect(parseCoordinatePair("", " ")).toEqual({
      ok: true,
      value: { latitude: null, longitude: null },
    });
  });

  it("refuse une paire incomplète", () => {
    expect(parseCoordinatePair("4.05", "")).toMatchObject({ ok: false });
  });

  it("refuse les valeurs qui ne sont pas numériques", () => {
    expect(parseCoordinatePair("nord", "9.7")).toMatchObject({ ok: false });
  });

  it("refuse les coordonnées hors limites géographiques", () => {
    expect(parseCoordinatePair("91", "181")).toMatchObject({ ok: false });
  });
});
