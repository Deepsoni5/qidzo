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

export async function getCategories() {
  return getOrSetCache<Category[]>(
    "categories:all",
    async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error fetching categories:", error);
        return [];
      }

      return data as Category[];
    },
    3600 // 1 hour cache
  );
}
