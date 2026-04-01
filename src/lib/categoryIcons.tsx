import {
  Palette,
  Music,
  PersonStanding,
  Scissors,
  Camera,
  Book,
  Mic,
  BookOpen,
  Pen,
  FlaskConical,
  Calculator,
  Code,
  Bot,
  ChefHat,
  Leaf,
  Landmark,
  Lightbulb,
  Star,
  Box,
  Megaphone,
  UserPlus,
  FileText,
  Calendar,
  Award,
  CreditCard,
  Building2,
  Sparkles,
} from "lucide-react";
import React from "react";

export const CATEGORY_ICONS: Record<string, React.ElementType> = {
  art: Palette,
  music: Music,
  dance: PersonStanding,
  scissors: Scissors,
  camera: Camera,
  book: Book,
  mic: Mic,
  "book-open": BookOpen,
  pen: Pen,
  flask: FlaskConical,
  calculator: Calculator,
  code: Code,
  robot: Bot,
  run: PersonStanding,
  yoga: PersonStanding,
  cooking: ChefHat,
  leaf: Leaf,
  landmark: Landmark,
  lightbulb: Lightbulb,
  star: Star,
  box: Box,
  megaphone: Megaphone,
  userplus: UserPlus,
  filetext: FileText,
  calendar: Calendar,
  award: Award,
  creditcard: CreditCard,
  building2: Building2,
};

export function DynamicCategoryIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const key = (name || "").toLowerCase().replace(/[-_ ]/g, "");
  const IconComponent = CATEGORY_ICONS[name] || CATEGORY_ICONS[key];
  if (!IconComponent) return <Sparkles className={className} />;
  return <IconComponent className={className} />;
}
