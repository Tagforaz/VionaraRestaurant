import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  CalendarDays,
  Star,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/auth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/menu', label: 'Menu Management', icon: UtensilsCrossed },
  { path: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { path: '/admin/reservations', label: 'Reservations', icon: CalendarDays },
  { path: '/admin/reviews', label: 'Reviews', icon: Star },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

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
            <Link to="/admin" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-warm">
                <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-display text-lg font-semibold text-sidebar-foreground">
                  Savoria
                </span>
                <span className="text-xs text-muted-foreground">Admin Panel</span>
              </div>
            </Link>
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
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                location.pathname === item.path
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
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
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="shrink-0 text-sidebar-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Link to="/admin" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-warm">
            <UtensilsCrossed className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-semibold">Savoria Admin</span>
        </Link>
        <Link to="/">
          <Button variant="outline" size="sm">
            View Site
          </Button>
        </Link>
      </header>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-foreground/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <aside
            className="absolute left-0 top-0 h-full w-64 bg-sidebar"
            onClick={e => e.stopPropagation()}
          >
            {/* Same content as desktop sidebar */}
            <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
              <Link to="/admin" className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-warm">
                  <UtensilsCrossed className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-display text-lg font-semibold text-sidebar-foreground">
                  Savoria
                </span>
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
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main
        className={cn(
          'flex-1 pt-16 transition-all duration-300 lg:pt-0',
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        )}
      >
        <div className="container animate-fade-in py-6">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
