import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export type SiteSettings = {
  company_name: string;
  slogan: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address_china: string | null;
  address_cameroon: string | null;
  tracking_prefix: string;
  rate_usd_xaf: number | null;
  rate_eur_xaf: number | null;
  rates_updated_at: string | null;
};

export const settingsQuery = queryOptions({
  queryKey: ["site_settings"],
  queryFn: async (): Promise<SiteSettings> => {
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw error;
    return (
      (data as SiteSettings) ?? {
        company_name: "Afrinexa",
        slogan: null,
        phone: null,
        whatsapp: null,
        email: null,
        address_china: null,
        address_cameroon: null,
        tracking_prefix: "AFX",
        rate_usd_xaf: null,
        rate_eur_xaf: null,
        rates_updated_at: null,
      }
    );
  },
  staleTime: 60_000,
});

export function useSettings() {
  return useQuery(settingsQuery).data;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  return { user, ready };
}

export function useRoles(userId: string | undefined) {
  return useQuery({
    queryKey: ["roles", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId!);
      return (data ?? []).map((r) => r.role as string);
    },
  });
}

export const STAFF = [
  "super_admin",
  "admin",
  "commercial",
  "logistique",
  "support",
  "sourcing",
  "finance",
];
export const isStaff = (roles?: string[]) => !!roles?.some((r) => STAFF.includes(r));

export const fmtDate = (d?: string | null) =>
  d
    ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
    : "—";
export const fmtDateTime = (d?: string | null) =>
  d
    ? new Date(d).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
