import { getCategories } from "@/actions/categories";
import CategorySelector from "./CategorySelector";

export default async function CategoryBar() {
  const categories = await getCategories();

  return (
    <div className="sticky top-16 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto overflow-x-auto pb-3 pt-3 px-4 sm:px-6 lg:px-8 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 transition-colors">
        <CategorySelector categories={categories} />
      </div>
    </div>
  );
}
