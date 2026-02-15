import React, { useState, useEffect } from 'react';
import { useAuth } from '@/auth';
import { useSearchParams } from 'react-router-dom';
import { AdminLayout, ChefLayout, WaiterLayout, CourierLayout, ModeratorLayout, CustomerLayout } from '@/layouts';
import { userService } from '@/api/services/userService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Lock, 
  Bell, 
  Camera, 
  Save,
  Calendar,
  Activity,
  TrendingUp,
  ShoppingBag,
  Star,
  Eye,
  EyeOff,
  LayoutDashboard,
  UtensilsCrossed,
  CalendarDays,
  Package,
  MessageSquare,
  QrCode,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/hooks/use-toast';
import * as authApi from '@/api/dev/authDev';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get active tab from URL or default to 'profile'
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
  
  // Update URL when tab changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };
  
  // Select layout based on user role
  const LayoutComponent = 
    user?.role === 'admin' ? AdminLayout :
    user?.role === 'chef' ? ChefLayout :
    user?.role === 'waiter' ? WaiterLayout :
    user?.role === 'courier' ? CourierLayout :
    user?.role === 'moderator' ? ModeratorLayout :
    CustomerLayout;
  
  // Profile Form State
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  
  // Update state when user changes
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAvatarUrl(user.avatarUrl || '');
      console.log('👤 User avatarUrl:', user.avatarUrl);
      console.log('👤 Valid URL (http ilə başlayır)?', user.avatarUrl?.startsWith('http'));
    }
  }, [user]);
  
  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  
  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [promotions, setPromotions] = useState(false);
  
  // Staff-specific notifications
  const [newOrderAlerts, setNewOrderAlerts] = useState(true);
  const [statusChangeAlerts, setStatusChangeAlerts] = useState(true);
  const [systemAlerts, setSystemAlerts] = useState(true);
  const [urgentNotifications, setUrgentNotifications] = useState(true);

  const handleProfileUpdate = async () => {
    if (!user) return;
    
    try {
      toast({
        title: "Profil yenilənir...",
        description: "Zəhmət olmasa gözləyin",
      });
      
      // Call backend API
      const response = await userService.updateProfile({
        firstName,
        lastName,
        phoneNumber: phone || undefined,
        fullAddress: user.address?.street || undefined,
      });
      
      // Update local context with response
      updateUser({
        ...user,
        firstName: response.firstName || firstName,
        lastName: response.lastName || lastName,
        phone: response.phoneNumber || phone,
        email: response.email || email,
        avatarUrl: response.avatarUrl || avatarUrl,
      });
      
      toast({
        title: "Profil yeniləndi",
        description: "Məlumatlarınız uğurla yadda saxlanıldı.",
      });
    } catch (error: any) {
      console.error('❌ Profile update error:', error);
      toast({
        title: "Xəta",
        description: error.response?.data?.message || "Profil yenilənərkən xəta baş verdi",
        variant: "destructive",
      });
    }
  };

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Xəta",
        description: "Yeni şifrələr uyğun gəlmir",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({
        title: "Xəta",
        description: "Şifrə ən azı 6 simvol olmalıdır",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Şifrə dəyişdirildi",
      description: "Şifrəniz uğurla yeniləndi.",
    });
    
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!user?.id) {
      toast({
        title: 'Xəta',
        description: 'İstifadəçi məlumatı tapılmadı',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Xəta',
        description: 'Yalnız şəkil faylları yükləyə bilərsiniz',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Xəta',
        description: 'Şəkil ölçüsü maksimum 5MB ola bilər',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Show preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Upload to backend
      toast({
        title: 'Yüklənir...',
        description: 'Avatar yüklənir, zəhmət olmasa gözləyin',
      });
      
      const uploadedUrl = await authApi.uploadAvatar(user.id, file);
      
      // Update user context
      if (user) {
        updateUser({
          ...user,
          avatarUrl: uploadedUrl,
        });
      }
      
      toast({
        title: 'Uğurlu!',
        description: 'Avatar uğurla yükləndi',
      });
    } catch (error: any) {
      console.error('❌ Avatar upload error:', error);
      
      const errorData = error.response?.data;
      let errorMessage = 'Avatar yükləmə zamanı xəta baş verdi';
      
      if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (errorData?.title) {
        errorMessage = errorData.title;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Xəta',
        description: errorMessage,
        variant: 'destructive',
      });
      
      // Revert to original avatar on error
      setAvatarUrl(user?.avatarUrl || '');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      chef: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      waiter: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      courier: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      moderator: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      customer: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    };
    return colors[role] || colors.customer;
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrator',
      chef: 'Aşbaz',
      waiter: 'Ofisant',
      courier: 'Kuryer',
      moderator: 'Moderator',
      customer: 'Müştəri',
    };
    return labels[role] || role;
  };

  // Mock statistics - bu real API-dan gələ bilər
  const statistics = {
    totalOrders: user?.role === 'customer' ? 24 : user?.role === 'chef' ? 156 : 89,
    completedOrders: user?.role === 'customer' ? 22 : user?.role === 'chef' ? 148 : 85,
    averageRating: 4.8,
    memberSince: new Date(user?.createdAt || '').toLocaleDateString('az-AZ', { 
      year: 'numeric', 
      month: 'long' 
    }),
  };

  if (!user) return null;

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard';
      case 'orders':
        return 'Sifarişlər';
      case 'profile':
        return 'Profil Parametrləri';
      case 'security':
        return 'Təhlükəsizlik';
      case 'notifications':
        return 'Bildirişlər';
      default:
        return 'Profil Parametrləri';
    }
  };

  const getPageDescription = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Ümumi məlumatlar və statistika';
      case 'orders':
        return 'Son sifarişləriniz və tapşırıqlar';
      case 'profile':
        return 'Hesab məlumatlarınızı idarə edin';
      case 'security':
        return 'Təhlükəsizlik parametrlərini təyin edin';
      case 'notifications':
        return 'Bildiriş parametrlərini idarə edin';
      default:
        return 'Hesab məlumatlarınızı idarə edin';
    }
  };

  return (
    <LayoutComponent>
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{getPageTitle()}</h1>
          <p className="text-muted-foreground">
            {getPageDescription()}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-12">
        {/* Profile Overview Card */}
        <div className="md:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Profil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-32 w-32">
                  {avatarUrl && avatarUrl.startsWith('http') ? (
                    <>
                      <AvatarImage 
                        src={avatarUrl}
                        alt={`${firstName} ${lastName}`}
                        onError={(e) => {
                          console.error('❌ Avatar yükləmə xətası - URL:', avatarUrl);
                          console.error('❌ Səbəb: Fayl tapılmadı və ya CORS xətası');
                          setAvatarUrl('');
                        }}
                      />
                      <AvatarFallback className="text-2xl">
                        {firstName.charAt(0)}{lastName.charAt(0)}
                      </AvatarFallback>
                    </>
                  ) : (
                    <AvatarFallback className="text-2xl">
                      {firstName.charAt(0)}{lastName.charAt(0)}
                    </AvatarFallback>
                  )}
                
                <div className="relative">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Camera className="h-4 w-4" />
                    Avatar Yüklə
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              <Separator />

              {/* User Info */}
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="font-semibold text-xl">{firstName} {lastName}</h3>
                  <p className="text-sm text-muted-foreground">{email}</p>
                </div>

                <div className="flex justify-center">
                  <Badge className={getRoleBadgeColor(user.role)}>
                    <Shield className="h-3 w-3 mr-1" />
                    {getRoleLabel(user.role)}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Üzv: {statistics.memberSince}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Activity className="h-4 w-4" />
                    <span>ID: {user.id}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Quick Stats */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Statistika</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Card className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <ShoppingBag className="h-4 w-4 text-primary" />
                      <span className="text-xs text-muted-foreground">
                        {user.role === 'customer' ? 'Sifarişlər' : 'İşlənib'}
                      </span>
                    </div>
                    <p className="text-2xl font-bold">{statistics.totalOrders}</p>
                  </Card>
                  <Card className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-muted-foreground">Tamamlanıb</span>
                    </div>
                    <p className="text-2xl font-bold">{statistics.completedOrders}</p>
                  </Card>
                  <Card className="p-3 col-span-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-xs text-muted-foreground">Orta Reytinq</span>
                    </div>
                    <p className="text-2xl font-bold">{statistics.averageRating} / 5.0</p>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="md:col-span-8">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6">
              {/* Work-related tabs for staff */}
              {user.role !== 'customer' && (
                <>
                  <TabsTrigger value="dashboard">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </TabsTrigger>
                  <TabsTrigger value="orders">
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Sifarişlər</span>
                  </TabsTrigger>
                </>
              )}
              
              {/* Profile tabs */}
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Profil</span>
              </TabsTrigger>
              <TabsTrigger value="security">
                <Lock className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Təhlükəsizlik</span>
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Bildirişlər</span>
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab - for staff only */}
            {user.role !== 'customer' && (
              <TabsContent value="dashboard" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Dashboard</CardTitle>
                    <CardDescription>
                      Ümumi məlumatlar və statistika
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Bugünkü Tapşırıqlar</CardTitle>
                          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{statistics.totalOrders}</div>
                          <p className="text-xs text-muted-foreground">Aktiv tapşırıqlar</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Tamamlanıb</CardTitle>
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{statistics.completedOrders}</div>
                          <p className="text-xs text-muted-foreground">Bu ay</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Performans</CardTitle>
                          <Star className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{statistics.averageRating}</div>
                          <p className="text-xs text-muted-foreground">Orta reytinq</p>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Orders Tab - for staff only */}
            {user.role !== 'customer' && (
              <TabsContent value="orders" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Sifarişlər</CardTitle>
                    <CardDescription>
                      Son sifarişləriniz və tapşırıqlar
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Ətraflı sifariş idarəetməsi üçün sol menyudan "Sifarişlər" bölməsinə keçin.
                      </p>
                      <Button variant="outline" className="w-full">
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Bütün Sifarişləri Gör
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Personal Information Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Şəxsi Məlumatlar</CardTitle>
                  <CardDescription>
                    Profil məlumatlarınızı yeniləyin
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Ad</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Soyad</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="lastName"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-poçt</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-9"
                        placeholder="+994 XX XXX XX XX"
                      />
                    </div>
                  </div>

                  {user.role === 'customer' && (
                    <div className="space-y-2">
                      <Label htmlFor="address">Ünvan</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="address"
                          value={user.address?.street || ''}
                          className="pl-9"
                          placeholder="Ünvanınızı daxil edin"
                        />
                      </div>
                    </div>
                  )}

                  <Button onClick={handleProfileUpdate} className="w-full gap-2">
                    <Save className="h-4 w-4" />
                    Dəyişiklikləri Yadda Saxla
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Şifrəni Dəyişdir</CardTitle>
                  <CardDescription>
                    Hesabınızın təhlükəsizliyini qoruyun
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Cari Şifrə</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="currentPassword"
                        type={showPasswords ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="pl-9 pr-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Yeni Şifrə</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type={showPasswords ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pl-9 pr-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Şifrəni Təsdiqlə</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showPasswords ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-9 pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(!showPasswords)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button onClick={handlePasswordChange} className="w-full">
                    Şifrəni Yenilə
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>İki Faktorlu Autentifikasiya</CardTitle>
                  <CardDescription>
                    Hesabınıza əlavə təhlükəsizlik qatı əlavə edin
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-medium">2FA Aktivləşdir</div>
                      <div className="text-sm text-muted-foreground">
                        Daxil olarkən SMS və ya e-poçtla kod tələb ediləcək
                      </div>
                    </div>
                    <Switch
                      checked={twoFactorEnabled}
                      onCheckedChange={setTwoFactorEnabled}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Bildiriş Parametrləri</CardTitle>
                  <CardDescription>
                    {user.role === 'customer' 
                      ? 'Necə bildiriş almaq istədiyinizi seçin'
                      : 'İş bildirişlərinizi idarə edin'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-medium">E-poçt Bildirişləri</div>
                      <div className="text-sm text-muted-foreground">
                        Mühüm yeniləmələr üçün e-poçt al
                      </div>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-medium">Push Bildirişlər</div>
                      <div className="text-sm text-muted-foreground">
                        Brauzerdə ani bildirişlər al
                      </div>
                    </div>
                    <Switch
                      checked={pushNotifications}
                      onCheckedChange={setPushNotifications}
                    />
                  </div>

                  <Separator />

                  {/* Customer-specific notifications */}
                  {user.role === 'customer' && (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="font-medium">Sifariş Yeniləmələri</div>
                          <div className="text-sm text-muted-foreground">
                            Sifarişlərinizin statusu haqqında məlumat
                          </div>
                        </div>
                        <Switch
                          checked={orderUpdates}
                          onCheckedChange={setOrderUpdates}
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="font-medium">Kampaniya və Endirimlər</div>
                          <div className="text-sm text-muted-foreground">
                            Xüsusi təkliflər haqqında məlumat al
                          </div>
                        </div>
                        <Switch
                          checked={promotions}
                          onCheckedChange={setPromotions}
                        />
                      </div>
                    </>
                  )}

                  {/* Staff-specific notifications */}
                  {user.role !== 'customer' && (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="font-medium">Yeni Tapşırıq Bildirişləri</div>
                          <div className="text-sm text-muted-foreground">
                            {user.role === 'chef' && 'Yeni sifarişlər haqqında dərhal məlumat'}
                            {user.role === 'waiter' && 'Yeni masa rezervasiyaları və sifarişlər'}
                            {user.role === 'courier' && 'Yeni çatdırılma tapşırıqları'}
                            {user.role === 'moderator' && 'Yeni məzmun və nəzarət tələbləri'}
                            {user.role === 'admin' && 'Sistem və prioritet tələbləri'}
                          </div>
                        </div>
                        <Switch
                          checked={newOrderAlerts}
                          onCheckedChange={setNewOrderAlerts}
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="font-medium">Status Dəyişiklikləri</div>
                          <div className="text-sm text-muted-foreground">
                            Tapşırıqların statusu dəyişdikdə xəbərdar et
                          </div>
                        </div>
                        <Switch
                          checked={statusChangeAlerts}
                          onCheckedChange={setStatusChangeAlerts}
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="font-medium">Təcili Bildirişlər</div>
                          <div className="text-sm text-muted-foreground">
                            Prioritet və təcili vəziyyətlər barədə bildiriş
                          </div>
                        </div>
                        <Switch
                          checked={urgentNotifications}
                          onCheckedChange={setUrgentNotifications}
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="font-medium">Sistem Bildirişləri</div>
                          <div className="text-sm text-muted-foreground">
                            Sistem yeniləmələri və texniki məlumatlar
                          </div>
                        </div>
                        <Switch
                          checked={systemAlerts}
                          onCheckedChange={setSystemAlerts}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      </div>
    </LayoutComponent>
  );
};

export default ProfilePage;
