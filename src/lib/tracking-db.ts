import { supabase } from "@/integrations/supabase/client";

// Le fichier Supabase `types.ts` est généré et ne doit pas être modifié à la main.
// Ces types locaux décrivent uniquement les colonnes/tables ajoutées par la migration
// `afrinexa_tracking_coordinates_zones`; ils pourront être remplacés après régénération.
export type ShipmentCoordinates = {
  origin_latitude: number | null;
  origin_longitude: number | null;
  origin_coordinates_confirmed_at: string | null;
  origin_coordinates_confirmed_by: string | null;
  destination_latitude: number | null;
  destination_longitude: number | null;
  destination_coordinates_confirmed_at: string | null;
  destination_coordinates_confirmed_by: string | null;
};

export type ShipmentCoordinatesUpdate = Pick<
  ShipmentCoordinates,
  "origin_latitude" | "origin_longitude" | "destination_latitude" | "destination_longitude"
>;

export type ShipmentEventCoordinates = {
  latitude: number | null;
  longitude: number | null;
  coordinates_confirmed_at: string | null;
  coordinates_confirmed_by: string | null;
};

export type ShipmentEventCoordinateInsert = {
  shipment_id: string;
  status: string;
  location: string | null;
  public_note: string | null;
  internal_note: string | null;
  occurred_at: string;
  latitude: number | null;
  longitude: number | null;
};

export type ShipmentZoneType = "stop" | "escalation";
export type ShipmentZoneRole = "super_admin" | "admin" | "logistique" | "support";

export type ShipmentZone = {
  id: string;
  name: string;
  zone_type: ShipmentZoneType;
  center_latitude: number;
  center_longitude: number;
  radius_m: number;
  escalation_after_minutes: number | null;
  escalate_to_role: ShipmentZoneRole | null;
  active: boolean;
  created_by: string;
  created_at: string;
};

export type ShipmentZoneInsert = Pick<
  ShipmentZone,
  | "name"
  | "zone_type"
  | "center_latitude"
  | "center_longitude"
  | "radius_m"
  | "escalation_after_minutes"
  | "escalate_to_role"
>;

type DatabaseError = { message: string };
type DatabaseResult<T> = { data: T | null; error: DatabaseError | null };
type DatabaseThenable<T> = PromiseLike<DatabaseResult<T>>;

// Limite l'échappement de typage aux nouvelles tables/champs connus, au lieu de
// modifier manuellement la définition TypeScript générée par Supabase.
type TrackingDataPort = {
  from(table: "shipments"): {
    update(values: ShipmentCoordinatesUpdate): {
      eq(column: "id", value: string): DatabaseThenable<null>;
    };
  };
  from(table: "shipment_events"): {
    insert(values: ShipmentEventCoordinateInsert): DatabaseThenable<null>;
  };
  from(table: "shipment_zones"): {
    select(columns: "*"): {
      order(
        column: "created_at",
        options: { ascending: boolean },
      ): DatabaseThenable<ShipmentZone[]>;
    };
    insert(values: ShipmentZoneInsert): DatabaseThenable<null>;
  };
};

export const trackingDb = supabase as unknown as TrackingDataPort;
