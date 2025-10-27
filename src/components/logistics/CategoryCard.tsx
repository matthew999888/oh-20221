import { Category } from '@/types/logistics';

interface CategoryCardProps {
  category: Category;
  totalItems: number;
  inUse: number;
  onClick: () => void;
}

export const CategoryCard = ({ category, totalItems, inUse, onClick }: CategoryCardProps) => {
  return (
    <button
      onClick={onClick}
      className="bg-card rounded-lg shadow-md p-6 hover:shadow-lg transition-all text-left border-2 border-transparent hover:border-primary/30 w-full"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-4xl">{category.icon}</span>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">{totalItems}</p>
          <p className="text-sm text-muted-foreground">{inUse} in use</p>
        </div>
      </div>
      <h3 className="font-semibold text-foreground">{category.name}</h3>
    </button>
  );
};
