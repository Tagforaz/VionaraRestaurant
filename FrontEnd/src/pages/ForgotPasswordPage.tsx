import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Mail, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import ThemeToggle from '@/components/ThemeToggle';
import * as authApi from '@/api/dev/authDev';

const ForgotPasswordPage = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Email daxil edin');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.forgotPassword({ email });
      
      toast.success('Kod göndərildi!', {
        description: response.message,
      });
      
      // Redirect to reset password page with email
      navigate('/reset-password', { state: { email } });
    } catch (error: any) {
      console.error('❌ Forgot password error:', error);
      
      const errorData = error.response?.data;
      let errorMessage = 'Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.';
      
      if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (errorData?.title) {
        errorMessage = errorData.title;
        if (errorData.detail) {
          errorMessage += ': ' + errorData.detail;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error('Uğursuz', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Forgot Password Form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-8">
        <div className="absolute right-4 top-4 flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Link to="/" className="flex justify-center">
            <UtensilsCrossed className="h-12 w-12 text-primary" />
          </Link>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight">
            Şifrəni bərpa et
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Email ünvanınızı daxil edin və sizə bərpa kodu göndərəcəyik
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="mt-2 relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="pl-10"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Göndərilir...' : 'Kod göndər'}
            </Button>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Girişə qayıt
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Right side - Image/Illustration */}
      <div className="hidden lg:block lg:w-1/2 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="flex h-full flex-col items-center justify-center p-12">
          <div className="max-w-md space-y-6 text-center">
            <h3 className="text-4xl font-bold">Narahat olmayın! 🔐</h3>
            <p className="text-lg text-muted-foreground">
              Biz sizə email vasitəsilə 4 rəqəmli bərpa kodu göndərəcəyik.
              Kod 5 dəqiqə ərzində etibarlıdır.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
