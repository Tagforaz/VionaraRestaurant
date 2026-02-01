import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2, Lock, Shield, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { userService } from '@/api/services/userService';

export const ProfileSecurity = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword.length < 6) {
      toast({
        title: 'Xəta',
        description: 'Yeni şifrə ən azı 6 simvol olmalıdır',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Xəta',
        description: 'Şifrələr uyğun gəlmir',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      await userService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      toast({
        title: 'Uğurlu',
        description: 'Şifrə uğurla dəyişdirildi',
      });
    } catch (error) {
      toast({
        title: 'Xəta',
        description: 'Şifrə dəyişdirilə bilmədi',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handle2FAToggle = async (enabled: boolean) => {
    try {
      setLoading(true);
      await userService.toggle2FA(enabled);
      setTwoFactorEnabled(enabled);
      toast({
        title: 'Uğurlu',
        description: enabled ? '2FA aktivləşdirildi' : '2FA deaktivləşdirildi',
      });
    } catch (error) {
      toast({
        title: 'Xəta',
        description: '2FA dəyişdirilə bilmədi',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Təhlükəsizlik</h1>
        <p className="text-muted-foreground mt-2">
          Hesabınızın təhlükəsizliyini idarə edin
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Şifrə dəyişikliyi
          </CardTitle>
          <CardDescription>Yeni şifrə təyin edin</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mövcud şifrə</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                placeholder="Mövcud şifrənizi daxil edin"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Yeni şifrə</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Yeni şifrənizi daxil edin"
              />
              <p className="text-sm text-muted-foreground">Ən azı 6 simvol</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Şifrə təkrarı</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Yeni şifrənizi təkrar edin"
              />
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Şifrəni dəyişdir
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            İki faktorlu autentifikasiya (2FA)
          </CardTitle>
          <CardDescription>
            Hesabınızın təhlükəsizliyini artırın
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="2fa">İki faktorlu autentifikasiya</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Giriş zamanı əlavə təhlükəsizlik kodu tələb olunur
              </p>
            </div>
            <Switch
              id="2fa"
              checked={twoFactorEnabled}
              onCheckedChange={handle2FAToggle}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Təhlükə zonası</CardTitle>
          <CardDescription>
            Diqqət: Bu əməliyyatlar geri qaytarıla bilməz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Hesabı sil</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Hesabınızı və bütün məlumatlarınızı həmişəlik silin
              </p>
              <Button variant="destructive" size="sm">
                Hesabı sil
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
