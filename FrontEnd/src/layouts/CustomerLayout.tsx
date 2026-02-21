import { Link, useLocation } from 'react-router-dom';
import { Home, UtensilsCrossed, Calendar, ShoppingCart, User, LogOut, Menu, X, Info } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/auth';
import { useCart } from '@/features/cart';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { cn } from '@/lib/utils';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7156';

interface WorkingHour {
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface RestaurantSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  workingHours: WorkingHour[];
}

interface CustomerLayoutProps {
  children: React.ReactNode;
}

const fmt = (t: string) => t?.substring(0, 5) ?? '';

export const CustomerLayout: React.FC<CustomerLayoutProps> = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const { t } = useTranslation();

  const [settings, setSettings] = useState<RestaurantSettings | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/restaurantsettings`)
      .then(r => r.json())
      .then(data => setSettings(data))
      .catch(() => {});
  }, []);

  const navItems = [
    { path: '/', label: t('nav.home'), icon: Home },
    { path: '/menu', label: t('nav.menu'), icon: UtensilsCrossed },
    { path: '/reservations', label: t('nav.reservations'), icon: Calendar },
    { path: '/about', label: t('nav.about'), icon: Info },
  ];

  const weekdays = settings?.workingHours?.filter(w => w.isOpen && w.dayOfWeek >= 1 && w.dayOfWeek <= 5) ?? [];
  const weekend = settings?.workingHours?.filter(w => w.isOpen && (w.dayOfWeek === 0 || w.dayOfWeek === 6)) ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* Top info bar */}
      <div className="site-topbar hidden md:block">
        <div className="container py-1 text-sm flex items-center justify-between">
          <div className="flex items-center gap-4 text-[13px]">
            <span>{settings?.email || t('brand.email')}</span>
            <span>{settings?.address || t('brand.address')}</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="site-header sticky top-0 z-50 border-b border-border">
        <div className="container flex h-20 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="font-display text-3xl font-bold">
              <span className="text-amber-600">V</span>
              <span className="text-foreground">ionara</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-4 md:flex">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'nav-link flex items-center gap-2',
                  location.pathname === item.path
                    ? 'bg-primary/10 text-primary'
                    : 'text-card-foreground/90 hover:bg-primary/5 hover:text-primary'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle className="hidden md:inline-flex p-2 rounded-md text-card-foreground/90 hover:bg-secondary" />
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                    {itemCount}
                  </span>
                )}
              </Button>
            </Link>

            {isAuthenticated ? (
              <div className="hidden items-center gap-2 md:flex">
                <Link to="/profile">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    {user?.firstName}
                  </Button>
                </Link>
                {user?.role === 'admin' && (
                  <Link to="/admin"><Button variant="outline" size="sm">{t('admin.panel')}</Button></Link>
                )}
                {user?.role === 'chef' && (
                  <Link to="/chef"><Button variant="outline" size="sm">{t('chef.panel')}</Button></Link>
                )}
                {user?.role === 'waiter' && (
                  <Link to="/waiter"><Button variant="outline" size="sm">{t('waiter.panel')}</Button></Link>
                )}
                {user?.role === 'courier' && (
                  <Link to="/courier"><Button variant="outline" size="sm">{t('courier.panel')}</Button></Link>
                )}
                {user?.role === 'moderator' && (
                  <Link to="/moderator"><Button variant="outline" size="sm">Moderator Paneli</Button></Link>
                )}
                <Button variant="ghost" size="icon" onClick={logout} title={t('nav.logout')}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="hidden gap-2 md:flex">
                <Link to="/login"><Button variant="ghost" size="sm">{t('nav.login')}</Button></Link>
                <Link to="/register"><Button size="sm">{t('nav.register')}</Button></Link>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-border bg-background md:hidden">
            <nav className="container flex flex-col gap-1 py-4">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                    location.pathname === item.path
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-secondary'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
              <div className="my-2 border-t border-border" />
              <div className="flex items-center justify-center gap-2 py-2">
                <LanguageSwitcher />
              </div>
              <div className="my-2 border-t border-border" />
              {isAuthenticated ? (
                <>
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary">
                    <User className="h-5 w-5" />{user?.firstName}
                  </Link>
                  {user?.role === 'admin' && (
                    <Link to="/admin" onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10">
                      {t('admin.panel')}
                    </Link>
                  )}
                  {user?.role === 'chef' && (
                    <Link to="/chef" onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10">
                      {t('chef.panel')}
                    </Link>
                  )}
                  {user?.role === 'waiter' && (
                    <Link to="/waiter" onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10">
                      {t('waiter.panel')}
                    </Link>
                  )}
                  {user?.role === 'courier' && (
                    <Link to="/courier" onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10">
                      {t('courier.panel')}
                    </Link>
                  )}
                  {user?.role === 'moderator' && (
                    <Link to="/moderator" onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10">
                      Moderator Paneli
                    </Link>
                  )}
                  <button onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10">
                    <LogOut className="h-5 w-5" />{t('nav.logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary">
                    {t('nav.login')}
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary">
                    {t('nav.register')}
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="animate-fade-in">{children}</main>

      {/* Footer */}
      <footer className="site-footer border-t border-border">
        <div className="container py-12">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <div>
              <div className="mb-4">
                <div className="font-display text-2xl font-bold mb-2">
                  <span className="text-amber-600">V</span>
                  <span className="text-foreground">ionara</span>
                </div>
                <p className="text-sm text-muted-foreground">{t('brand.slogan')}</p>
              </div>
            </div>

            {/* İş saatları — API-dən */}
            <div>
              <h4 className="mb-3 text-sm font-medium text-gold-light">{t('footer.openingTime')}</h4>
              {settings ? (
                <>
                  {weekdays.length > 0 && (
                    <p className="text-sm text-card-foreground/80">
                      Baz.e - Cüm : {fmt(weekdays[0].openTime)} - {fmt(weekdays[0].closeTime)}
                    </p>
                  )}
                  {weekend.length > 0 && (
                    <p className="text-sm text-card-foreground/80">
                      Şənbə - Bazar : {fmt(weekend[0].openTime)} - {fmt(weekend[0].closeTime)}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm text-card-foreground/80">{t('footer.monFri')}</p>
                  <p className="text-sm text-card-foreground/80">{t('footer.satSun')}</p>
                </>
              )}
            </div>

            {/* Ünvan — API-dən */}
            <div>
              <h4 className="mb-3 text-sm font-medium text-gold-light">{t('footer.location')}</h4>
              <p className="text-sm text-card-foreground/80">
                {settings?.address || t('brand.address')}
              </p>
            </div>

            {/* Əlaqə — API-dən */}
            <div>
              <h4 className="mb-3 text-sm font-medium text-gold-light">{t('footer.contactUs')}</h4>
              <p className="text-sm text-card-foreground/80">
                {settings?.phone || '978-212-8600'}
              </p>
              {settings?.email && (
                <p className="text-sm text-card-foreground/80 mt-1">{settings.email}</p>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CustomerLayout;