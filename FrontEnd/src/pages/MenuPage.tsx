import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, X } from 'lucide-react';
import { CustomerLayout } from '@/layouts';
import { ProductCard } from '@/components/ProductCard';
import { CategoryCard } from '@/components/CategoryCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/features/cart';
import { Category, Product } from '@/types';
import { cn } from '@/lib/utils';

// Demo data
const DEMO_CATEGORIES: Category[] = [
  { id: 'all', name: 'All Items', description: 'Everything we offer', image: '', sortOrder: 0, isActive: true },
  { id: '1', name: 'Appetizers', description: 'Start your meal right', image: '', sortOrder: 1, isActive: true },
  { id: '2', name: 'Main Courses', description: 'Hearty & delicious', image: '', sortOrder: 2, isActive: true },
  { id: '3', name: 'Pasta', description: 'Fresh & homemade', image: '', sortOrder: 3, isActive: true },
  { id: '4', name: 'Seafood', description: 'Fresh from the ocean', image: '', sortOrder: 4, isActive: true },
  { id: '5', name: 'Desserts', description: 'Sweet endings', image: '', sortOrder: 5, isActive: true },
  { id: '6', name: 'Beverages', description: 'Refresh yourself', image: '', sortOrder: 6, isActive: true },
];

const DEMO_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Grilled Ribeye Steak',
    description: 'Premium 12oz ribeye with herb butter, roasted vegetables, and truffle mashed potatoes',
    price: 42.99,
    categoryId: '2',
    isAvailable: true,
    isPopular: true,
    preparationTime: 25,
    averageRating: 4.8,
    reviewCount: 124,
  },
  {
    id: '2',
    name: 'Seafood Risotto',
    description: 'Creamy arborio rice with shrimp, mussels, calamari, and fresh herbs',
    price: 28.99,
    categoryId: '4',
    isAvailable: true,
    isPopular: true,
    preparationTime: 20,
    averageRating: 4.7,
    reviewCount: 89,
  },
  {
    id: '3',
    name: 'Truffle Burrata',
    description: 'Fresh burrata with black truffle, heirloom tomatoes, and aged balsamic',
    price: 18.99,
    categoryId: '1',
    isAvailable: true,
    isPopular: false,
    preparationTime: 10,
    averageRating: 4.9,
    reviewCount: 67,
  },
  {
    id: '4',
    name: 'Lobster Linguine',
    description: 'Maine lobster tail with fresh linguine in a light tomato cream sauce',
    price: 38.99,
    categoryId: '3',
    isAvailable: true,
    isPopular: true,
    preparationTime: 22,
    averageRating: 4.6,
    reviewCount: 52,
  },
  {
    id: '5',
    name: 'Caesar Salad',
    description: 'Crisp romaine lettuce, parmesan, croutons, and house-made Caesar dressing',
    price: 14.99,
    categoryId: '1',
    isAvailable: true,
    isPopular: false,
    preparationTime: 8,
    averageRating: 4.5,
    reviewCount: 98,
  },
  {
    id: '6',
    name: 'Tiramisu',
    description: 'Classic Italian dessert with espresso-soaked ladyfingers and mascarpone cream',
    price: 12.99,
    categoryId: '5',
    isAvailable: true,
    isPopular: true,
    preparationTime: 5,
    averageRating: 4.9,
    reviewCount: 156,
  },
  {
    id: '7',
    name: 'Grilled Salmon',
    description: 'Atlantic salmon with lemon dill sauce, asparagus, and wild rice',
    price: 32.99,
    categoryId: '4',
    isAvailable: true,
    isPopular: false,
    preparationTime: 18,
    averageRating: 4.7,
    reviewCount: 73,
  },
  {
    id: '8',
    name: 'Beef Tenderloin',
    description: 'Prime beef tenderloin with red wine reduction and seasonal vegetables',
    price: 48.99,
    categoryId: '2',
    isAvailable: true,
    isPopular: true,
    preparationTime: 30,
    averageRating: 4.8,
    reviewCount: 112,
  },
];

const MenuPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { addItem } = useCart();

  const selectedCategory = searchParams.get('category') || 'all';

  const filteredProducts = DEMO_PRODUCTS.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCategoryChange = (categoryId: string) => {
    if (categoryId === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', categoryId);
    }
    setSearchParams(searchParams);
  };

  return (
    <CustomerLayout>
      {/* Header */}
      <section className="border-b border-border bg-card py-8">
        <div className="container">
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground md:text-4xl">
            Our Menu
          </h1>
          <p className="text-muted-foreground">
            Explore our carefully crafted selection of dishes
          </p>
        </div>
      </section>

      <div className="container py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar - Desktop */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-20 space-y-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search dishes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Categories */}
              <div>
                <h3 className="mb-4 font-semibold text-foreground">Categories</h3>
                <nav className="flex flex-col gap-1">
                  {DEMO_CATEGORIES.map(category => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryChange(category.id)}
                      className={cn(
                        'rounded-lg px-4 py-2.5 text-left text-sm font-medium transition-colors',
                        selectedCategory === category.id
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-secondary'
                      )}
                    >
                      {category.name}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </aside>

          {/* Mobile Filters */}
          <div className="flex items-center gap-4 lg:hidden">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Category Chips */}
          {showFilters && (
            <div className="flex flex-wrap gap-2 lg:hidden">
              {DEMO_CATEGORIES.map(category => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    selectedCategory === category.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  )}
                >
                  {category.name}
                </button>
              ))}
            </div>
          )}

          {/* Products Grid */}
          <div className="flex-1">
            {/* Active Filters */}
            {(selectedCategory !== 'all' || searchQuery) && (
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Filters:</span>
                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                    {DEMO_CATEGORIES.find(c => c.id === selectedCategory)?.name}
                    <button onClick={() => handleCategoryChange('all')}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                    "{searchQuery}"
                    <button onClick={() => setSearchQuery('')}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Results Count */}
            <p className="mb-6 text-sm text-muted-foreground">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'dish' : 'dishes'} found
            </p>

            {/* Grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={addItem}
                  />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <p className="text-lg font-medium text-foreground">No dishes found</p>
                <p className="mt-2 text-muted-foreground">
                  Try adjusting your search or filters
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery('');
                    handleCategoryChange('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default MenuPage;
