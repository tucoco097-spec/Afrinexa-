import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { MapPinned } from "lucide-react";

export type Coordinates = [number, number];

export type ShipmentMapPoint = {
  label: string;
  value: string;
  kind: "origin" | "destination" | "last-known";
  coordinates: Coordinates;
};

type Props = {
  origin: string;
  destination: string;
  lastLocation?: string | null;
  originCoordinates?: Coordinates | null;
  destinationCoordinates?: Coordinates | null;
  lastPosition?: { location: string | null; coordinates: Coordinates } | null;
  mode: "air" | "sea";
};

function pin(color: string) {
  return L.divIcon({
    className: "shipment-pin",
    html: `<span style="--pin-color:${color}"></span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function FitBounds({ points }: { points: ShipmentMapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points.map((point) => point.coordinates)), {
        padding: [36, 36],
      });
    } else if (points.length === 1) {
      const point = points[0];
      if (point) map.setView(point.coordinates, 4);
    }
  }, [map, points]);
  return null;
}

export function ShipmentMap({
  origin,
  destination,
  lastLocation,
  originCoordinates,
  destinationCoordinates,
  lastPosition,
  mode,
}: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const points = useMemo(() => {
    const result: ShipmentMapPoint[] = [];
    if (originCoordinates) {
      result.push({
        label: "Départ",
        value: origin,
        kind: "origin",
        coordinates: originCoordinates,
      });
    }
    if (
      lastPosition &&
      !result.some(
        (point) =>
          point.coordinates[0] === lastPosition.coordinates[0] &&
          point.coordinates[1] === lastPosition.coordinates[1],
      )
    ) {
      result.push({
        label: "Dernière position confirmée",
        value: lastPosition.location ?? "Position confirmée",
        kind: "last-known",
        coordinates: lastPosition.coordinates,
      });
    }
    if (
      destinationCoordinates &&
      !result.some(
        (point) =>
          point.coordinates[0] === destinationCoordinates[0] &&
          point.coordinates[1] === destinationCoordinates[1],
      )
    ) {
      result.push({
        label: "Destination",
        value: destination,
        kind: "destination",
        coordinates: destinationCoordinates,
      });
    }
    return result;
  }, [destination, destinationCoordinates, lastPosition, origin, originCoordinates]);

  const line = points.map((point) => point.coordinates);
  const center = points[0]?.coordinates;

  return (
    <section className="glass overflow-hidden rounded-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4 md:px-6">
        <div className="flex items-center gap-2">
          <MapPinned className="size-5 text-accent" />
          <div>
            <h2 className="font-bold">Itinéraire de votre expédition</h2>
            <p className="text-xs text-muted-foreground">Étapes avec coordonnées confirmées</p>
          </div>
        </div>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-accent">
          {mode === "air" ? "Fret aérien" : "Fret maritime"}
        </span>
      </div>
      {mounted && points.length > 0 && center ? (
        <div className="shipment-map h-[340px] w-full md:h-[430px]">
          <MapContainer center={center} zoom={3} scrollWheelZoom={false} className="size-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitBounds points={points} />
            {line.length > 1 && (
              <Polyline
                positions={line}
                pathOptions={{ color: "#22D3EE", weight: 4, dashArray: "10 8" }}
              />
            )}
            {points.map((point) => (
              <Marker
                key={`${point.kind}-${point.value}`}
                position={point.coordinates}
                icon={pin(
                  point.kind === "destination"
                    ? "#D6B477"
                    : point.kind === "last-known"
                      ? "#22D3EE"
                      : "#2563EB",
                )}
              >
                <Popup>
                  <strong>{point.label}</strong>
                  <br />
                  {point.value}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      ) : (
        <div className="grid h-[340px] place-items-center bg-secondary/40 p-8 text-center md:h-[430px]">
          <div className="max-w-sm">
            <MapPinned className="mx-auto size-10 text-muted-foreground" />
            <p className="mt-3 font-semibold">Carte en attente de coordonnées précises</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {lastLocation
                ? `Dernier lieu enregistré : ${lastLocation}. Il ne sera pas placé sur la carte sans coordonnées confirmées.`
                : "La timeline reste disponible. Aucune position n’est inventée en l’absence de coordonnées confirmées."}
            </p>
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-x-5 gap-y-2 px-5 py-4 text-xs text-muted-foreground md:px-6">
        <span>
          <i className="map-legend-dot bg-primary" /> Départ
        </span>
        <span>
          <i className="map-legend-dot bg-accent" /> Dernière position confirmée
        </span>
        <span>
          <i className="map-legend-dot bg-gold" /> Destination
        </span>
        <span className="ml-auto">Carte : OpenStreetMap</span>
      </div>
    </section>
  );
}
