import { Link } from 'react-router-dom';
import { ArrowRight, Clock, MapPin, Phone, Star, UtensilsCrossed, Calendar, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomerLayout } from '@/layouts';
import { ProductCard } from '@/components/ProductCard';
import { CategoryCard } from '@/components/CategoryCard';
import { Category, Product } from '@/types';
import { useCart } from '@/features/cart';
import heroImage from '@/assets/hero-restaurant.jpg';

// Demo data for display
const DEMO_CATEGORIES: Category[] = [
  { id: '1', name: 'Appetizers', description: 'Start your meal right', image: '', sortOrder: 1, isActive: true },
  { id: '2', name: 'Main Courses', description: 'Hearty & delicious', image: '', sortOrder: 2, isActive: true },
  { id: '3', name: 'Pasta', description: 'Fresh & homemade', image: '', sortOrder: 3, isActive: true },
  { id: '4', name: 'Desserts', description: 'Sweet endings', image: '', sortOrder: 4, isActive: true },
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
              Award-Winning Cuisine
            </span>
            <h1 className="mb-6 font-display text-4xl font-bold tracking-tight text-background sm:text-5xl lg:text-6xl">
              Experience Fine Dining at{' '}
              <span className="text-gradient">Savoria</span>
            </h1>
            <p className="mb-8 text-lg text-background/80 md:text-xl">
              Discover culinary excellence with our carefully crafted dishes, made with the freshest ingredients and served in an unforgettable atmosphere.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/menu">
                <Button variant="hero" size="xl">
                  View Our Menu
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/reservations">
                <Button variant="outline" size="xl" className="border-background/30 bg-background/10 text-background backdrop-blur-sm hover:bg-background/20">
                  <Calendar className="h-5 w-5" />
                  Reserve a Table
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
              { icon: ChefHat, title: 'Expert Chefs', desc: 'World-class culinary team' },
              { icon: Star, title: '4.9 Rating', desc: 'Based on 2,000+ reviews' },
              { icon: Clock, title: 'Fast Service', desc: 'Quality without the wait' },
              { icon: MapPin, title: 'Prime Location', desc: 'Downtown city center' },
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-warm">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
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
                Explore Our Menu
              </h2>
              <p className="text-muted-foreground">
                Browse our carefully curated categories
              </p>
            </div>
            <Link to="/menu" className="hidden md:block">
              <Button variant="ghost">
                View All
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
              Customer Favorites
            </span>
            <h2 className="mb-4 font-display text-3xl font-bold text-foreground md:text-4xl">
              Popular Dishes
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Loved by thousands of guests, these signature dishes represent the best of what Savoria has to offer
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {DEMO_PRODUCTS.map((product, idx) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addItem}
                className={`animate-slide-up stagger-${idx + 1} opacity-0`}
              />
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link to="/menu">
              <Button variant="hero" size="lg">
                Explore Full Menu
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
                Reserve Your Table Tonight
              </h2>
              <p className="mb-8 text-lg text-primary-foreground/80">
                Experience an unforgettable evening of exquisite flavors and impeccable service. Book your reservation now.
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Link to="/reservations">
                  <Button size="xl" className="w-full bg-background text-foreground hover:bg-background/90 sm:w-auto">
                    <Calendar className="h-5 w-5" />
                    Make a Reservation
                  </Button>
                </Link>
                <a href="tel:+1234567890">
                  <Button variant="outline" size="xl" className="w-full border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 sm:w-auto">
                    <Phone className="h-5 w-5" />
                    Call Us
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="border-t border-border py-16">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center md:text-left">
              <h3 className="mb-4 font-display text-xl font-semibold text-foreground">Location</h3>
              <p className="text-muted-foreground">
                123 Gourmet Street<br />
                Downtown, NY 10001
              </p>
            </div>
            <div className="text-center">
              <h3 className="mb-4 font-display text-xl font-semibold text-foreground">Hours</h3>
              <p className="text-muted-foreground">
                Mon - Thu: 11am - 10pm<br />
                Fri - Sun: 11am - 11pm
              </p>
            </div>
            <div className="text-center md:text-right">
              <h3 className="mb-4 font-display text-xl font-semibold text-foreground">Contact</h3>
              <p className="text-muted-foreground">
                +1 (234) 567-890<br />
                info@savoria.com
              </p>
            </div>
          </div>
        </div>
      </section>
    </CustomerLayout>
  );
};

export default Index;
