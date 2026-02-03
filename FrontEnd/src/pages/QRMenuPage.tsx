import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, X, QrCode } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ProductCard } from '@/components/ProductCard';
import { CategoryCard } from '@/components/CategoryCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Category, Product } from '@/types';
import { cn } from '@/lib/utils';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import ThemeToggle from '@/components/ThemeToggle';

// Demo data
const DEMO_CATEGORIES: Category[] = [
  { id: 'all', name: 'menu.allItems', description: 'Everything we offer', image: '', sortOrder: 0, isActive: true },
  { id: '1', name: 'menu.appetizers', description: 'Start your meal right', image: '', sortOrder: 1, isActive: true },
  { id: '2', name: 'menu.mainCourses', description: 'Hearty & delicious', image: '', sortOrder: 2, isActive: true },
  { id: '3', name: 'menu.pasta', description: 'Fresh & homemade', image: '', sortOrder: 3, isActive: true },
  { id: '4', name: 'menu.seafood', description: 'Fresh from the ocean', image: '', sortOrder: 4, isActive: true },
  { id: '5', name: 'menu.desserts', description: 'Sweet endings', image: '', sortOrder: 5, isActive: true },
  { id: '6', name: 'menu.beverages', description: 'Refresh yourself', image: '', sortOrder: 6, isActive: true },
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
    name: 'Bruschetta Trio',
    description: 'Three varieties: classic tomato, mushroom pâté, and roasted pepper',
    price: 12.99,
    categoryId: '1',
    isAvailable: true,
    isPopular: false,
    preparationTime: 10,
    averageRating: 4.6,
    reviewCount: 56,
  },
  {
    id: '4',
    name: 'Truffle Fettuccine',
    description: 'Fresh pasta in creamy truffle sauce with parmesan and wild mushrooms',
    price: 24.99,
    categoryId: '3',
    isAvailable: true,
    isPopular: true,
    preparationTime: 18,
    averageRating: 4.9,
    reviewCount: 201,
  },
  {
    id: '5',
    name: 'Tiramisu',
    description: 'Classic Italian dessert with espresso-soaked ladyfingers and mascarpone',
    price: 8.99,
    categoryId: '5',
    isAvailable: true,
    isPopular: true,
    preparationTime: 5,
    averageRating: 4.8,
    reviewCount: 145,
  },
  {
    id: '6',
    name: 'Fresh Lemonade',
    description: 'Homemade lemonade with mint and fresh lemon juice',
    price: 4.99,
    categoryId: '6',
    isAvailable: true,
    isPopular: false,
    preparationTime: 5,
    averageRating: 4.5,
    reviewCount: 78,
  },
];

export default function QRMenuPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  
  const categoryParam = searchParams.get('category') || 'all';

  const filteredProducts = DEMO_PRODUCTS.filter(product => {
    const matchesCategory = categoryParam === 'all' || product.categoryId === categoryParam;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCategoryChange = (categoryId: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('category', categoryId);
    setSearchParams(newParams);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <QrCode className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-bold">DineEasy QR Menu</h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-2">
            {t('menu.welcomeQR', 'Welcome to Our Digital Menu')}
          </h2>
          <p className="text-muted-foreground">
            {t('menu.qrDescription', 'Browse our menu and place your order directly from your phone')}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 relative max-w-xl mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('menu.searchPlaceholder', 'Search menu items...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 h-12"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Categories */}
        <div className="mb-8">
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
            {DEMO_CATEGORIES.map((category) => (
              <Button
                key={category.id}
                variant={categoryParam === category.id ? 'default' : 'outline'}
                onClick={() => handleCategoryChange(category.id)}
                className="whitespace-nowrap"
              >
                {t(category.name)}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Link to={`/qr-menu/${product.id}`} key={product.id}>
                <ProductCard product={product} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {t('menu.noResults', 'No items found')}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>{t('menu.qrFooter', 'Call a waiter for assistance')}</p>
        </div>
      </main>
    </div>
  );
}
