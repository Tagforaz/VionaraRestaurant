import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, MapPin, Phone, Star, UtensilsCrossed, Calendar, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomerLayout } from '@/layouts';
import { ProductCard } from '@/components/ProductCard';
import { CategoryCard } from '@/components/CategoryCard';
import { Category, Product } from '@/types';
import { useCart } from '@/features/cart';
import { useTranslation } from 'react-i18next';
import heroImage from '@/assets/hero-restaurant.jpg';

// Demo data for display
const DEMO_CATEGORIES: Category[] = [
  { id: '1', name: 'menu.appetizers', description: 'Start your meal right', image: '', sortOrder: 1, isActive: true },
  { id: '2', name: 'menu.mainCourses', description: 'Hearty & delicious', image: '', sortOrder: 2, isActive: true },
  { id: '3', name: 'menu.pasta', description: 'Fresh & homemade', image: '', sortOrder: 3, isActive: true },
  { id: '4', name: 'menu.desserts', description: 'Sweet endings', image: '', sortOrder: 4, isActive: true },
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
    categoryId: '2',
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
];

const Index = () => {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const { t } = useTranslation();

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
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-warm">
                <ChefHat className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">{t('home.expertChefs')}</h3>
                <p className="text-sm text-muted-foreground">{t('home.expertChefsDesc')}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-warm">
                <Star className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">{t('home.rating')}</h3>
                <p className="text-sm text-muted-foreground">{t('home.ratingDesc')}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-warm">
                <Clock className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">{t('home.fastService')}</h3>
                <p className="text-sm text-muted-foreground">{t('home.fastServiceDesc')}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-warm">
                <MapPin className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">{t('home.primeLocation')}</h3>
                <p className="text-sm text-muted-foreground">{t('home.primeLocationDesc')}</p>
              </div>
            </div>
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
              <p className="text-muted-foreground">
                {t('home.browseCurated')}
              </p>
            </div>
            <Link to="/menu" className="hidden md:block">
              <Button variant="ghost">
                {t('home.viewAll')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DEMO_CATEGORIES.map((category, idx) => (
              <Link key={category.id} to={`/menu?category=${category.id}`}>
                <CategoryCard
                  category={category}
                  className={`animate-slide-up stagger-${idx + 1} opacity-0`}
                />
              </Link>
            ))}
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
            {DEMO_PRODUCTS.map((product, idx) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addItem}
                onClick={() => navigate(`/menu/${product.id}`)}
                className={`animate-slide-up stagger-${idx + 1} opacity-0`}
              />
            ))}
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
                <a href="tel:+1234567890">
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
