import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UtensilsCrossed, Lock, KeyRound, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import ThemeToggle from '@/components/ThemeToggle';
import * as authApi from '@/api/dev/authDev';

const ResetPasswordPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: location.state?.email || '',
    code: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);

  useEffect(() => {
    if (!formData.email) {
      toast.error('Email tapılmadı', {
        description: 'Zəhmət olmasa əvvəlcə email ünvanınızı daxil edin',
      });
      navigate('/forgot-password');
    }
  }, [formData.email, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleVerifyCode = async () => {
    if (!formData.code || formData.code.length !== 4) {
      toast.error('Kod düzgün deyil', {
        description: '4 rəqəmli kodu daxil edin',
      });
      return;
    }

    setIsVerifying(true);

    try {
      const response = await authApi.verifyResetCode({
        email: formData.email,
        code: formData.code,
      });
      
      toast.success('Kod təsdiqləndi!', {
        description: response.message,
      });
      
      setCodeVerified(true);
    } catch (error: any) {
      console.error('❌ Verify code error:', error);
      
      const errorData = error.response?.data;
      let errorMessage = 'Kod yanlışdır və ya vaxtı keçib';
      
      if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (errorData?.title) {
        errorMessage = errorData.title;
      }
      
      toast.error('Təsdiqləmə uğursuz', {
        description: errorMessage,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!codeVerified) {
      toast.error('Əvvəlcə kodu təsdiqləyin');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Şifrələr üst-üstə düşmür');
      return;
    }

    if (formData.newPassword.length < 8) {
      toast.error('Şifrə çox qısadır', {
        description: 'Şifrə ən azı 8 simvoldan ibarət olmalıdır',
      });
      return;
    }

    setIsLoading(true);

    try {
      await authApi.resetPassword({
        email: formData.email,
        code: formData.code,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });
      
      toast.success('Şifrə dəyişdirildi!', {
        description: 'İndi yeni şifrənizlə daxil ola bilərsiniz',
      });
      
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (error: any) {
      console.error('❌ Reset password error:', error);
      
      const errorData = error.response?.data;
      let errorMessage = 'Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.';
      
      if (errorData?.errors && typeof errorData.errors === 'object') {
        const errorMessages = Object.values(errorData.errors).flat();
        errorMessage = errorMessages.join(', ');
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (errorData?.title) {
        errorMessage = errorData.title;
      }
      
      toast.error('Şifrə dəyişdirilmədi', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Reset Password Form */}
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
            Yeni şifrə təyin et
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Email-ə göndərilən 4 rəqəmli kodu daxil edin
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Code Input */}
            <div>
              <Label htmlFor="code">Bərpa kodu</Label>
              <div className="mt-2 relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <KeyRound className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input
                  id="code"
                  name="code"
                  type="text"
                  maxLength={4}
                  pattern="[0-9]{4}"
                  required
                  className="pl-10 text-center text-2xl tracking-widest font-mono"
                  placeholder="****"
                  value={formData.code}
                  onChange={handleChange}
                  disabled={isLoading || codeVerified}
                />
              </div>
              {!codeVerified && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={handleVerifyCode}
                  disabled={isVerifying || formData.code.length !== 4}
                >
                  {isVerifying ? 'Yoxlanılır...' : 'Kodu təsdiqlə'}
                </Button>
              )}
              {codeVerified && (
                <p className="text-sm text-green-600 mt-2">✓ Kod təsdiqləndi</p>
              )}
            </div>

            {/* New Password */}
            <div>
              <Label htmlFor="newPassword">Yeni şifrə</Label>
              <div className="mt-2 relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className="pl-10 pr-10"
                  placeholder="••••••••"
                  value={formData.newPassword}
                  onChange={handleChange}
                  disabled={isLoading || !codeVerified}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                  disabled={isLoading || !codeVerified}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <Label htmlFor="confirmPassword">Şifrəni təsdiqlə</Label>
              <div className="mt-2 relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className="pl-10 pr-10"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading || !codeVerified}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                  disabled={isLoading || !codeVerified}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !codeVerified}
            >
              {isLoading ? 'Dəyişdirilir...' : 'Şifrəni dəyiş'}
            </Button>

            <div className="text-center">
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-primary hover:underline"
              >
                Kod almadınız? Yenidən göndər
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Right side - Image/Illustration */}
      <div className="hidden lg:block lg:w-1/2 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="flex h-full flex-col items-center justify-center p-12">
          <div className="max-w-md space-y-6 text-center">
            <h3 className="text-4xl font-bold">Yeni başlanğıc! 🔐</h3>
            <p className="text-lg text-muted-foreground">
              Güclü bir şifrə seçin. Şifrə ən azı 8 simvol, böyük və kiçik hərf,
              rəqəm və xüsusi simvol ehtiva etməlidir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
