import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, UtensilsCrossed, Mail, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/auth';
import { toast } from '@/hooks/use-toast';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import ThemeToggle from '@/components/ThemeToggle';
import { getRoleDashboardPath } from '@/lib/rolePermissions';

const LoginPage = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      
      // Always redirect to home page after login
      const redirectPath = '/';
      
      toast({
        title: t('auth.welcomeBack'),
        description: t('auth.loginSuccess'),
      });
      navigate(redirectPath, { replace: true });
    } catch (error) {
      toast({
        title: t('auth.loginFailed'),
        description: error instanceof Error ? error.message : t('auth.invalidCredentials'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Form */}
      <div className="flex w-full flex-col justify-center px-4 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          {/* Language & Theme Switchers */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>

          {/* Logo */}
          <Link to="/" className="mb-8 flex items-center gap-2">
            <div className="font-display text-2xl font-bold">
              <span className="text-amber-600">V</span>
              <span className="text-foreground">ionara</span>
            </div>
          </Link>

          <h1 className="mb-2 font-display text-3xl font-bold text-foreground">
            {t('auth.welcomeBack')}
          </h1>
          <p className="mb-8 text-muted-foreground">
            {t('auth.signInDescription')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email">{t('auth.email')}</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">{t('auth.password')}</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-input" />
                <span className="text-sm text-muted-foreground">{t('auth.rememberMe')}</span>
              </label>
              <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                {t('auth.forgotPassword')}
              </Link>
            </div>

            <Button type="submit" variant="hero" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? t('auth.signingIn') : t('auth.signIn')}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 rounded-lg border border-border bg-muted/50 p-4">
            <p className="mb-3 text-sm font-semibold text-foreground">🔑 Demo Hesablar</p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between rounded bg-background p-2 hover:bg-accent cursor-pointer" onClick={() => { setEmail('admin@demo.com'); setPassword('admin123'); }}>
                <span className="font-medium">👨‍💼 Admin</span>
                <span className="text-muted-foreground">admin@demo.com / admin123</span>
              </div>
              <div className="flex items-center justify-between rounded bg-background p-2 hover:bg-accent cursor-pointer" onClick={() => { setEmail('chef@demo.com'); setPassword('chef123'); }}>
                <span className="font-medium">👨‍🍳 Aşbaz</span>
                <span className="text-muted-foreground">chef@demo.com / chef123</span>
              </div>
              <div className="flex items-center justify-between rounded bg-background p-2 hover:bg-accent cursor-pointer" onClick={() => { setEmail('waiter@demo.com'); setPassword('waiter123'); }}>
                <span className="font-medium">👔 Ofisant</span>
                <span className="text-muted-foreground">waiter@demo.com / waiter123</span>
              </div>
              <div className="flex items-center justify-between rounded bg-background p-2 hover:bg-accent cursor-pointer" onClick={() => { setEmail('moderator@demo.com'); setPassword('moderator123'); }}>
                <span className="font-medium">🛡️ Moderator</span>
                <span className="text-muted-foreground">moderator@demo.com / moderator123</span>
              </div>
              <div className="flex items-center justify-between rounded bg-background p-2 hover:bg-accent cursor-pointer" onClick={() => { setEmail('courier@demo.com'); setPassword('courier123'); }}>
                <span className="font-medium">🚴 Kuryer</span>
                <span className="text-muted-foreground">courier@demo.com / courier123</span>
              </div>
              <div className="flex items-center justify-between rounded bg-background p-2 hover:bg-accent cursor-pointer" onClick={() => { setEmail('customer@demo.com'); setPassword('demo123'); }}>
                <span className="font-medium">👤 Müştəri</span>
                <span className="text-muted-foreground">customer@demo.com / demo123</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground italic">💡 Tıklayın və avtomatik doldursun</p>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">
              {t('auth.signUp')}
            </Link>
          </p>
        </div>
      </div>

      {/* Right Panel - Image */}
      <div className="hidden bg-gradient-warm lg:block lg:w-1/2">
        <div className="flex h-full flex-col items-center justify-center p-16 text-center text-primary-foreground">
          <UtensilsCrossed className="mb-6 h-16 w-16" />
          <h2 className="mb-4 font-display text-4xl font-bold">
            {t('auth.culinaryExcellence')}
          </h2>
          <p className="max-w-md text-lg text-primary-foreground/80">
            {t('auth.culinaryDescription')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
