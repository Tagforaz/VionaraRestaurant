import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, CalendarDays, Star, QrCode, LogOut, Menu, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/auth';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { cn } from '@/lib/utils';

interface ModeratorLayoutProps {
  children: React.ReactNode;
}

export const ModeratorLayout: React.FC<ModeratorLayoutProps> = ({ children }) => {
  const { t } = useTranslation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { path: '/moderator', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/moderator/orders', label: 'Sifarişlər', icon: ShoppingBag },
    { path: '/moderator/reservations', label: 'Rezervasiyalar', icon: CalendarDays },
    { path: '/moderator/reviews', label: 'Rəylər', icon: Star },
    { path: '/moderator/qr-codes', label: 'QR Kodlar', icon: QrCode },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 hidden h-screen border-r border-border bg-sidebar transition-all duration-300 lg:block',
          sidebarCollapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="font-display text-xl font-bold">
                  <span className="text-amber-600">V</span>
                  <span className="text-sidebar-foreground">ionara</span>
                </div>
              </Link>
              <div className="ml-auto flex items-center gap-1">
                <LanguageSwitcher />
                <ThemeToggle className="p-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent" />
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-sidebar-foreground"
          >
            <ChevronLeft
              className={cn('h-5 w-5 transition-transform', sidebarCollapsed && 'rotate-180')}
            />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-4">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-sidebar-border p-4">
          <Link 
            to="/profile"
            className="flex items-center gap-3 rounded-lg p-2 hover:bg-sidebar-accent transition-colors mb-2"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sidebar-accent">
              <span className="text-sm font-medium text-sidebar-foreground">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </span>
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="truncate text-xs text-muted-foreground">Moderator</p>
              </div>
            )}
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="w-full text-sidebar-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {!sidebarCollapsed && "Çıxış"}
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <aside
            className="fixed left-0 top-0 h-screen w-64 border-r border-border bg-sidebar"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
              <Link to="/moderator" className="font-display text-xl font-bold">
                <span className="text-amber-600">V</span>
                <span className="text-sidebar-foreground">ionara</span>
              </Link>
            </div>
            <nav className="flex flex-col gap-1 p-4">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    location.pathname === item.path
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent'
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
            <div className="absolute bottom-0 w-full border-t border-sidebar-border p-4">
              {user && (
                <div className="mb-3 rounded-lg bg-sidebar-accent p-3">
                  <p className="text-sm font-medium text-sidebar-foreground">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-sidebar-foreground/70">Moderator</p>
                </div>
              )}
              <Button
                variant="ghost"
                className="w-full justify-start text-sidebar-foreground"
                onClick={logout}
              >
                <LogOut className="h-5 w-5" />
                <span className="ml-3">Çıxış</span>
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className={cn('flex-1 transition-all duration-300', sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64')}>
        {/* Desktop Header */}
        <header className="sticky top-0 z-30 hidden h-16 items-center justify-between border-b border-border bg-background px-6 lg:flex">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Moderator Paneli</h2>
          </div>
          
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>

        {/* Mobile Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setMobileSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-2">
            <Link to="/" className="font-display text-xl font-bold hover:opacity-80 transition-opacity">
              <span className="text-amber-600">V</span>ionara
            </Link>
            <span className="text-muted-foreground text-sm hidden sm:inline">/ Moderator</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/profile">
              <Button variant="ghost" size="icon">
                <span className="text-sm font-medium">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
              </Button>
            </Link>
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};
