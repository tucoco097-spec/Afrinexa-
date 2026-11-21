import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Currency } from "./money";

export type Product = {
  id: string;
  name: string;
  slug: string;
  reference: string;
  description: string | null;
  images: string[];
  video_url: string | null;
  price: number;
  currency: Currency;
  min_qty: number;
  stock: number | null;
  weight_kg: number | null;
  dimensions: string | null;
  origin: string | null;
  supplier: string | null;
  lead_time: string | null;
  category_id: string | null;
  popularity: number;
  published: boolean;
  created_at: string;
};
export type CartItem = {
  id: string;
  cart_id: string;
  product_id: string;
  name: string;
  reference: string;
  image: string | null;
  unit_price: number;
  currency: Currency;
  supplier: string | null;
  quantity: number;
  products?: { slug: string } | null;
};

const cache = new Map<string, string>();
/** Image paths in the private "products" bucket are turned into signed URLs; absolute URLs pass through. */
export function useImageUrl(path?: string | null) {
  const [resolved, setResolved] = useState<{
    path: string | null | undefined;
    url: string | undefined;
  }>({ path: undefined, url: undefined });
  const directUrl = path && /^(https?:|\/)/.test(path) ? path : undefined;
  const url =
    directUrl ??
    (path ? cache.get(path) : undefined) ??
    (resolved.path === path ? resolved.url : undefined);

  useEffect(() => {
    let active = true;
    if (!path) {
      setResolved({ path, url: undefined });
      return () => {
        active = false;
      };
    }

    if (/^(https?:|\/)/.test(path)) {
      setResolved({ path, url: path });
      return () => {
        active = false;
      };
    }

    const cachedUrl = cache.get(path);
    if (cachedUrl) {
      setResolved({ path, url: cachedUrl });
      return () => {
        active = false;
      };
    }

    setResolved({ path, url: undefined });
    supabase.storage
      .from("products")
      .createSignedUrl(path, 60 * 60 * 24)
      .then(({ data }) => {
        if (active && data?.signedUrl) {
          cache.set(path, data.signedUrl);
          setResolved({ path, url: data.signedUrl });
        }
      });

    return () => {
      active = false;
    };
  }, [path]);
  return url;
}

export function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const categoriesQuery = {
  queryKey: ["categories"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort")
      .order("name");
    if (error) throw error;
    return data ?? [];
  },
};

/** Current user's open cart and items (null when signed out). */
export function useCart(userId?: string) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["cart", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data: cart } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", userId!)
        .eq("status", "open")
        .maybeSingle();
      if (!cart) return { cartId: null as string | null, items: [] as CartItem[] };
      const { data } = await supabase
        .from("cart_items")
        .select("*, products(slug)")
        .eq("cart_id", cart.id)
        .order("created_at");
      return { cartId: cart.id as string | null, items: (data ?? []) as CartItem[] };
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["cart", userId] });
  return { ...q, refresh };
}

export async function addToCart(userId: string, productId: string, quantity: number) {
  let { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "open")
    .maybeSingle();
  if (!cart) {
    const ins = await supabase.from("carts").insert({ user_id: userId }).select("id").single();
    if (ins.error) throw ins.error;
    cart = ins.data;
  }
  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cart.id)
    .eq("product_id", productId)
    .maybeSingle();
  if (existing) {
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: existing.quantity + quantity })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    // name/price/image are overwritten server-side from the product
    const { error } = await supabase.from("cart_items").insert({
      cart_id: cart.id,
      product_id: productId,
      quantity,
      name: "",
      reference: "",
      unit_price: 0,
      currency: "XAF",
    });
    if (error) throw error;
  }
}
