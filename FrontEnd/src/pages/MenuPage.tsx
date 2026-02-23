import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Filter, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CustomerLayout } from '@/layouts';
import { ProductCard } from '@/components/ProductCard';
import { CategoryCard } from '@/components/CategoryCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/features/cart';
import { Category, Product } from '@/types';
import { getCategoriesForDropdown, getAllProducts, ProductDto } from '@/api/dev/menuDev';
import { cn } from '@/lib/utils';

const DEMO_CATEGORIES: Category[] = [
  { id: 'all', name: 'All', description: 'Everything we offer', image: '', sortOrder: 0, isActive: true }
];

const MenuPage = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>(DEMO_CATEGORIES);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { addItem } = useCart();
  const navigate = useNavigate();

  const selectedCategory = searchParams.get('category') || 'all';

  // ✅ trim() — boşluq axtarışa sayılmır
  const trimmedQuery = searchQuery.trim();

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory;
    const matchesSearch = !trimmedQuery ||
      product.name.toLowerCase().includes(trimmedQuery.toLowerCase()) ||
      (product.description || '').toLowerCase().includes(trimmedQuery.toLowerCase());
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

  useEffect(() => {
    (async () => {
      try {
        const cats = await getCategoriesForDropdown();
        const mapped = [{ id: 'all', name: 'All', description: 'Everything' }, ...cats.map(c => ({ id: c.id, name: c.name, description: '' }))];
        setCategories(mapped as Category[]);
      } catch (err: any) {
        console.error('Failed to load categories', err);
        setLoadError('Kategoriyalar yüklənmədi');
      }
    })();

    (async () => {
      try {
        const res = await getAllProducts(1, 100);
        const mapped = (res || []).map((p: ProductDto) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          image: p.imageUrl || undefined,
          categoryId: p.categoryId,
          isAvailable: p.isAvailable,
          isPopular: false,
          preparationTime: 0,
          averageRating: p.averageRating || 0,
          reviewCount: p.reviewCount || 0
        } as Product));
        setProducts(mapped);
      } catch (err: any) {
        console.error('Failed to load products', err);
        const status = err?.response?.status;
        const data = err?.response?.data;
        setLoadError(`Məhsullar yüklənmədi (${status || 'xətalı'}): ${data?.message || JSON.stringify(data)}`);
      }
    })();
  }, []);

  return (
    <CustomerLayout>
      <section className="border-b border-border bg-card py-8">
        <div className="container">
          <h1 className="mb-2 font-display text-3xl font-bold text-foreground md:text-4xl">
            {t('menu.title')}
          </h1>
          <p className="text-muted-foreground">{t('menu.subtitle')}</p>
        </div>
      </section>

      <div className="container py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar - Desktop */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-20 space-y-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('menu.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div>
                <h3 className="mb-4 font-semibold text-foreground">{t('menu.categories')}</h3>
                <nav className="flex flex-col gap-1">
                  {categories.map(category => (
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
                      {category.name && category.name.startsWith('menu.') ? t(category.name) : category.name}
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
                placeholder={t('menu.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-2 lg:hidden">
              {categories.map(category => (
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
                  {category.name && category.name.startsWith('menu.') ? t(category.name) : category.name}
                </button>
              ))}
            </div>
          )}

          {/* Products Grid */}
          <div className="flex-1">
            {/* ✅ Filter badge — yalnız trimmedQuery varsa göstər */}
            {(selectedCategory !== 'all' || trimmedQuery) && (
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Filters:</span>
                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                    {t(DEMO_CATEGORIES.find(c => c.id === selectedCategory)?.name || 'menu.allItems')}
                    <button onClick={() => handleCategoryChange('all')}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {/* ✅ trimmedQuery — boşluq badge göstərmir */}
                {trimmedQuery && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                    "{trimmedQuery}"
                    <button onClick={() => setSearchQuery('')}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            )}

            <p className="mb-6 text-sm text-muted-foreground">
              {filteredProducts.length} {t('menu.dishesFound')}
            </p>

            {filteredProducts.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={addItem}
                    onClick={() => navigate(`/menu/${product.id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <p className="text-lg font-medium text-foreground">No dishes found</p>
                <p className="mt-2 text-muted-foreground">Try adjusting your search or filters</p>
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