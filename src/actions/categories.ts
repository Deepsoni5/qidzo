"use server";

import { supabase } from "@/lib/supabaseClient";
import { getOrSetCache } from "@/lib/redis";

export interface Category {
  id: string;
  category_id: string;
  name: string;
  icon: string;
  color: string;
}

export async function getCategories(type: "CHILD" | "SCHOOL" = "CHILD") {
  const cacheKey = `categories:${type.toLowerCase()}:all`;
  
  return getOrSetCache<Category[]>(
    cacheKey,
    async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("category_type", type)
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) {
        console.error(`Error fetching ${type} categories:`, error);
        return [];
      }

      return data as Category[];
    },
    3600 // 1 hour cache
  );
}
