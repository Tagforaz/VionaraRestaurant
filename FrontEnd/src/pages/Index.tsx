import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowRight, Clock, MapPin, Phone, Star, Calendar, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomerLayout } from '@/layouts';
import { ProductCard } from '@/components/ProductCard';
import { CategoryCard } from '@/components/CategoryCard';
import { Category, Product } from '@/types';
import { useCart } from '@/features/cart';
import { useTranslation } from 'react-i18next';
import heroImage from '@/assets/hero-restaurant.jpg';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7200';

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Backend DTO → Frontend Category type
interface ApiCategory {
  id: string;
  name: string;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  productCount: number;
}

// Backend DTO → Frontend Product type
interface ApiProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  categoryId: string;
  categoryName: string;
  isAvailable: boolean;
  averageRating: number;
  reviewCount: number;
  createdAt: string;
}

// Restaurant Settings DTO
interface ApiRestaurantSettings {
  phone: string;
}

const Index = () => {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [categories, setCategories] = useState<Category[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [prodLoading, setProdLoading] = useState(true);
  const [restaurantPhone, setRestaurantPhone] = useState<string>('');

  // Kateqoriyaları yüklə
  useEffect(() => {
    apiFetch<ApiCategory[]>('/api/categories?page=1&take=4')
      .then(data => {
        const mapped: Category[] = data
          .filter(c => c.isActive)
          .slice(0, 4)
          .map(c => ({
            id: c.id,
            name: c.name,
            description: '',
            image: c.imageUrl ?? '',
            sortOrder: c.sortOrder,
            isActive: c.isActive,
          }));
        setCategories(mapped);
      })
      .catch(() => setCategories([]))
      .finally(() => setCatLoading(false));
  }, []);

  // Populyar məhsulları yüklə — reytinqə görə sırala, ilk 4-ü götür
  useEffect(() => {
    apiFetch<ApiProduct[]>('/api/products?page=1&take=100')
      .then(data => {
        const mapped: Product[] = data
          .filter(p => p.isAvailable)
          .sort((a, b) => b.averageRating - a.averageRating)
          .slice(0, 4)
          .map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            image: p.imageUrl ?? undefined,
            imageUrl: p.imageUrl ?? undefined,
            categoryId: p.categoryId,
            isAvailable: p.isAvailable,
            isPopular: true,
            preparationTime: 0,
            averageRating: p.averageRating,
            reviewCount: p.reviewCount,
          }));
        setPopularProducts(mapped);
      })
      .catch(() => setPopularProducts([]))
      .finally(() => setProdLoading(false));
  }, []);

  // Restoran telefon nömrəsini yüklə
  useEffect(() => {
    apiFetch<ApiRestaurantSettings>('/api/restaurantsettings')
      .then(data => setRestaurantPhone(data.phone ?? ''))
      .catch(() => {});
  }, []);

  return (
    <CustomerLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Restaurant ambiance"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/70 to-foreground/40" />
        </div>

        <div className="container relative z-10 py-24 md:py-32 lg:py-40">
          <div className="max-w-2xl animate-slide-up">
            <span className="mb-4 inline-block rounded-full bg-primary/20 px-4 py-1.5 text-sm font-medium text-primary-foreground backdrop-blur-sm">
              {t('home.awardWinning')}
            </span>
            <h1 className="mb-6 font-display text-4xl font-bold tracking-tight text-background sm:text-5xl lg:text-6xl">
              {t('home.hero')}
            </h1>
            <p className="mb-8 text-lg text-background/80 md:text-xl">
              {t('home.heroSubtitle')}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/menu">
                <Button variant="hero" size="xl">
                  {t('about.viewMenu')}
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/reservations">
                <Button variant="outline" size="xl" className="border-background/30 bg-background/10 text-background backdrop-blur-sm hover:bg-background/20">
                  <Calendar className="h-5 w-5" />
                  {t('home.bookTable')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-border bg-card py-12">
        <div className="container">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: <ChefHat className="h-6 w-6 text-primary-foreground" />, title: t('home.expertChefs'), desc: t('home.expertChefsDesc') },
              { icon: <Star className="h-6 w-6 text-primary-foreground" />, title: t('home.rating'), desc: t('home.ratingDesc') },
              { icon: <Clock className="h-6 w-6 text-primary-foreground" />, title: t('home.fastService'), desc: t('home.fastServiceDesc') },
              { icon: <MapPin className="h-6 w-6 text-primary-foreground" />, title: t('home.primeLocation'), desc: t('home.primeLocationDesc') },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-warm">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="mb-2 font-display text-3xl font-bold text-foreground md:text-4xl">
                {t('home.exploreMenu')}
              </h2>
              <p className="text-muted-foreground">{t('home.browseCurated')}</p>
            </div>
            <Link to="/menu" className="hidden md:block">
              <Button variant="ghost">
                {t('home.viewAll')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {catLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
              ))
            ) : categories.length > 0 ? (
              categories.map((category, idx) => (
                <Link key={category.id} to={`/menu?category=${category.id}`}>
                  <CategoryCard
                    category={category}
                    className={`animate-slide-up stagger-${idx + 1} opacity-0`}
                  />
                </Link>
              ))
            ) : (
              <p className="col-span-4 text-center text-muted-foreground">Kateqoriya tapılmadı</p>
            )}
          </div>
        </div>
      </section>

      {/* Popular Dishes */}
      <section className="bg-secondary/50 py-16 md:py-24">
        <div className="container">
          <div className="mb-10 text-center">
            <span className="mb-3 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              {t('home.popularDishes')}
            </span>
            <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
              {t('home.popularDishes')}
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              {t('home.lovedByThousands')} {t('home.savoriaOffer')}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {prodLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
              ))
            ) : popularProducts.length > 0 ? (
              popularProducts.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addItem}
                  onClick={() => navigate(`/menu/${product.id}`)}
                  className={`animate-slide-up stagger-${idx + 1} opacity-0`}
                />
              ))
            ) : (
              <p className="col-span-4 text-center text-muted-foreground">Məhsul tapılmadı</p>
            )}
          </div>

          <div className="mt-10 text-center">
            <Link to="/menu">
              <Button variant="hero" size="lg">
                {t('home.exploreFullMenu')}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="overflow-hidden rounded-2xl bg-gradient-warm p-8 md:p-12 lg:p-16">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="mb-4 font-display text-3xl font-bold text-primary-foreground md:text-4xl">
                {t('home.reserveTonight')}
              </h2>
              <p className="mb-8 text-lg text-primary-foreground/80">
                {t('home.reserveTonightDesc')}
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Link to="/reservations">
                  <Button size="xl" className="w-full bg-background text-foreground hover:bg-background/90 sm:w-auto">
                    <Calendar className="h-5 w-5" />
                    {t('home.makeReservation')}
                  </Button>
                </Link>
                <a href={restaurantPhone ? `tel:${restaurantPhone}` : '#'}>
                  <Button size="xl" className="w-full bg-background text-foreground hover:bg-background/90 sm:w-auto">
                    <Phone className="h-5 w-5" />
                    {t('home.callUs')}
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </CustomerLayout>
  );
};

export default Index;
