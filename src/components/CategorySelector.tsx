"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import { 
  Palette, 
  BookOpen, 
  Music, 
  Trophy, 
  FlaskConical, 
  Gamepad2, 
  Globe2, 
  Code, 
  Utensils, 
  Scissors, 
  Zap, 
  Leaf, 
  Star, 
  Landmark,
  LayoutGrid,
  LucideIcon
} from "lucide-react";
import type { Category } from "@/actions/categories";

const IconMap: Record<string, LucideIcon> = {
  "art": Palette,
  "stories": BookOpen,
  "music": Music,
  "sports": Trophy,
  "science": FlaskConical,
  "puzzles": Gamepad2,
  "general": Globe2,
  "code": Code,
  "cooking": Utensils,
  "scissors": Scissors,
  "dance": Music,
  "leaf": Leaf,
  "star": Star,
  "landmark": Landmark,
  "zap": Zap,
};

export default function CategorySelector({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedCategories = searchParams.get("categories")?.split(",").filter(Boolean) || [];

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
          params.set(name, value);
      } else {
          params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  const toggleCategory = (categoryId: string) => {
    const currentSelected = new Set(selectedCategories);
    if (currentSelected.has(categoryId)) {
      currentSelected.delete(categoryId);
    } else {
      currentSelected.add(categoryId);
    }

    const newValue = Array.from(currentSelected).join(",");
    router.replace(pathname + "?" + createQueryString("categories", newValue), { scroll: false });
  };

  return (
    <div className="flex gap-3 min-w-max mx-auto">
      {categories.map((cat) => {
         const isSelected = selectedCategories.includes(cat.category_id);
         
         // Handle color: check if it's a hex code or a tailwind class
         const isHex = cat.color.startsWith('#');
         
         // Base style (always white text, rounded, transition)
         const baseClass = "flex items-center gap-2 px-4 py-2.5 rounded-xl font-nunito font-black text-xs shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all border-2 whitespace-nowrap group cursor-pointer select-none";
         
         let className = baseClass;
         let style: React.CSSProperties | undefined = undefined;

         if (isSelected) {
            // Selected State
            if (isHex) {
                style = { backgroundColor: cat.color, borderColor: 'white' };
                className += " text-white ring-2 ring-offset-2 ring-brand-purple/20";
            } else {
                className += ` ${cat.color} text-white border-white ring-2 ring-offset-2 ring-brand-purple/20`;
            }
         } else {
            // Unselected State
            if (isHex) {
                style = { color: cat.color, borderColor: `${cat.color}33`, backgroundColor: 'white' }; // 33 is approx 20% hex opacity
                className += " hover:bg-gray-50";
            } else {
                // Extract color name (e.g. "bg-hot-pink" -> "hot-pink")
                const colorName = cat.color.replace('bg-', '');
                className += ` bg-white text-${colorName} border-${colorName}/20 hover:bg-${colorName}/5`;
            }
         }

         // Resolve Icon
         const iconKey = cat.icon.toLowerCase().replace(/\s+/g, '-');
         const IconComponent = IconMap[iconKey] || LayoutGrid;

         return (
          <button
            key={cat.id}
            className={className}
            style={style}
            onClick={() => toggleCategory(cat.category_id)}
          >
            <IconComponent className={`w-4 h-4 transition-transform ${isSelected ? 'group-hover:scale-110' : ''}`} />
            <span>{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
}