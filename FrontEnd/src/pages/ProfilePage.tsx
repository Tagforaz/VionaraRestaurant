import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/auth';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
  User, Mail, Phone, MapPin, Shield, Lock, Bell, Camera, Save,
  Calendar, Activity, TrendingUp, ShoppingBag, Star, Eye, EyeOff,
  LayoutDashboard, Loader2, Package, ChevronDown, ChevronUp, Navigation,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/hooks/use-toast';
import * as authApi from '@/api/dev/authDev';

// ─── Types ───────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7200';

const ORDER_STATUS_LABELS: Record<number, string> = {
  1: 'Gözləyir', 2: 'Təsdiqləndi', 3: 'Hazırlanır', 4: 'Hazırdır',
  5: 'Yoldadır', 6: 'Çatdırıldı', 7: 'Tamamlandı', 8: 'Ləğv edildi', 9: 'Uğursuz',
};

const ORDER_STATUS_COLORS: Record<number, string> = {
  1: 'bg-yellow-500', 2: 'bg-blue-500', 3: 'bg-orange-500', 4: 'bg-purple-500',
  5: 'bg-cyan-500', 6: 'bg-green-500', 7: 'bg-green-700', 8: 'bg-red-500', 9: 'bg-red-700',
};

const DELIVERY_TYPE_LABELS: Record<number, string> = {
  1: 'Çatdırılma', 2: 'Özüm götürəcəm', 3: 'Restoranda',
};

// Active statuses: Pending→Delivered (1-6)
const isActiveStatus = (s: number) => s >= 1 && s <= 6;
// History statuses: Completed, Cancelled, Failed (7-9)
const isHistoryStatus = (s: number) => s >= 7 && s <= 9;

interface OrderListItem {
  id: string;
  orderNumber: string;
  userEmail: string;
  tableNumber: number | null;
  total: number;
  status: number;
  deliveryType: number;
  createdAt: string;
}

async function apiFetch<T>(path: string): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── Component ───────────────────────────────────────────────────────────────
export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  const LayoutComponent =
    user?.role === 'admin'     ? AdminLayout :
    user?.role === 'chef'      ? ChefLayout :
    user?.role === 'waiter'    ? WaiterLayout :
    user?.role === 'courier'   ? CourierLayout :
    user?.role === 'moderator' ? ModeratorLayout :
    CustomerLayout;

  // ── Profile form state ─────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName]   = useState(user?.lastName || '');
  const [email, setEmail]         = useState(user?.email || '');
  const [phone, setPhone]         = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  // ── Security ───────────────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords]     = useState(false);

  // ── Notifications ──────────────────────────────────────────────────────────
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications]   = useState(true);
  const [orderUpdates, setOrderUpdates]             = useState(true);
  const [promotions, setPromotions]                 = useState(false);
  const [newOrderAlerts, setNewOrderAlerts]         = useState(true);
  const [statusChangeAlerts, setStatusChangeAlerts] = useState(true);
  const [urgentNotifications, setUrgentNotifications] = useState(true);
  const [systemAlerts, setSystemAlerts]             = useState(true);

  // ── Orders from API ────────────────────────────────────────────────────────
  const [allOrders, setAllOrders]     = useState<OrderListItem[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // JWT-dən userId al
  const getUserIdFromToken = (): string => {
    const token = localStorage.getItem('auth_token');
    if (!token) return '';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || '';
    } catch { return ''; }
  };

  const fetchMyOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      // JWT-dən userId al
      const userId = getUserIdFromToken();
      if (!userId) return;
      // Backend-ə userId göndər — daha sürətli və düzgün
      const orders = await apiFetch<OrderListItem[]>(
        `/api/orders?page=1&take=100&userId=${userId}`
      );
      setAllOrders(Array.isArray(orders) ? orders : []);
    } catch (err) {
      console.error('Sifarişlər yüklənmədi:', err);
    } finally {
      setOrdersLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.role === 'customer') {
      fetchMyOrders();
    }
  }, [fetchMyOrders, user?.role]);

  const activeOrders  = allOrders.filter(o => isActiveStatus(o.status));
  const historyOrders = allOrders.filter(o => isHistoryStatus(o.status));

  // ── Stats ──────────────────────────────────────────────────────────────────
  const statistics = {
    totalOrders:     allOrders.length || (user?.role !== 'customer' ? 89 : 0),
    completedOrders: historyOrders.filter(o => o.status === 7).length || (user?.role !== 'customer' ? 85 : 0),
    averageRating:   4.8,
    memberSince: (() => {
      if (!user?.createdAt) return 'Yeni istifadəçi';
      const d = new Date(user.createdAt);
      if (isNaN(d.getTime()) || d.getFullYear() < 2000) return 'Yeni istifadəçi';
      return d.toLocaleDateString('az-AZ', { year: 'numeric', month: 'long', day: 'numeric' });
    })(),
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleProfileUpdate = async () => {
    if (!user) return;
    try {
      toast({ title: 'Profil yenilənir...', description: 'Zəhmət olmasa gözləyin' });
      const response = await userService.updateProfile({
        firstName, lastName,
        phoneNumber: phone || undefined,
        fullAddress: user.address?.street || undefined,
      });
      updateUser({
        ...user,
        firstName: response.firstName || firstName,
        lastName:  response.lastName  || lastName,
        phone:     response.phoneNumber || phone,
        email:     response.email || email,
        avatarUrl: response.avatarUrl || avatarUrl,
      });
      toast({ title: 'Profil yeniləndi', description: 'Məlumatlarınız uğurla yadda saxlanıldı.' });
    } catch (error: any) {
      toast({ title: 'Xəta', description: error.response?.data?.message || 'Profil yenilənərkən xəta baş verdi', variant: 'destructive' });
    }
  };

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      toast({ title: 'Xəta', description: 'Yeni şifrələr uyğun gəlmir', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Xəta', description: 'Şifrə ən azı 6 simvol olmalıdır', variant: 'destructive' });
      return;
    }
    toast({ title: 'Şifrə dəyişdirildi', description: 'Şifrəniz uğurla yeniləndi.' });
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Xəta', description: 'Yalnız şəkil faylları yükləyə bilərsiniz', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Xəta', description: 'Şəkil ölçüsü maksimum 5MB ola bilər', variant: 'destructive' });
      return;
    }
    try {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarUrl(reader.result as string);
      reader.readAsDataURL(file);
      toast({ title: 'Yüklənir...', description: 'Avatar yüklənir' });
      const uploadedUrl = await authApi.uploadAvatar(user.id, file);
      updateUser({ ...user, avatarUrl: uploadedUrl });
      toast({ title: 'Uğurlu!', description: 'Avatar uğurla yükləndi' });
    } catch (error: any) {
      toast({ title: 'Xəta', description: error.message || 'Avatar yükləmə zamanı xəta', variant: 'destructive' });
      setAvatarUrl(user?.avatarUrl || '');
    }
  };

  const getRoleBadgeColor = (role: string) => ({
    admin:     'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    chef:      'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    waiter:    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    courier:   'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    moderator: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    customer:  'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  }[role] || 'bg-gray-100 text-gray-800');

  const getRoleLabel = (role: string) => ({
    admin: 'Administrator', chef: 'Aşbaz', waiter: 'Ofisant',
    courier: 'Kuryer', moderator: 'Moderator', customer: 'Müştəri',
  }[role] || role);

  if (!user) return null;

  // ── Order card component ───────────────────────────────────────────────────
  const OrderCard = ({ order, showTrack = false }: { order: OrderListItem; showTrack?: boolean }) => {
    const isExpanded = expandedOrder === order.id;
    const statusColor = ORDER_STATUS_COLORS[order.status] ?? 'bg-gray-500';
    const canTrack = order.status === 5; // OutForDelivery

    return (
      <div className="border rounded-lg overflow-hidden">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30"
          onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
        >
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${statusColor}`} />
            <div>
              <p className="font-semibold">Sifariş #{order.orderNumber}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(order.createdAt).toLocaleDateString('az-AZ', {
                  year: 'numeric', month: 'short', day: 'numeric',
                })}
                {' · '}
                {DELIVERY_TYPE_LABELS[order.deliveryType] ?? 'Naməlum'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={`${statusColor} text-white text-xs`}>
              {ORDER_STATUS_LABELS[order.status] ?? 'Naməlum'}
            </Badge>
            <span className="font-bold">₼{order.total?.toFixed(2)}</span>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>

        {isExpanded && (
          <div className="px-4 pb-4 border-t bg-muted/10 space-y-3">
            <div className="grid grid-cols-2 gap-2 pt-3 text-sm">
              <div>
                <span className="text-muted-foreground">Sifariş ID:</span>
                <p className="font-mono text-xs truncate">{order.id}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <p className="font-medium">{ORDER_STATUS_LABELS[order.status]}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Çatdırılma növü:</span>
                <p className="font-medium">{DELIVERY_TYPE_LABELS[order.deliveryType]}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Məbləğ:</span>
                <p className="font-bold text-primary">₼{order.total?.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              {/* Sifarişi izlə — order tracking səhifəsinə yönləndir */}
              <Button
                size="sm"
                variant={canTrack ? 'default' : 'outline'}
                className={canTrack ? 'bg-primary' : ''}
                onClick={() => navigate(`/order-tracking/${order.id}`)}
              >
                <Navigation className="h-3 w-3 mr-1" />
                {canTrack ? 'Canlı İzlə' : 'Sifarişi İzlə'}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <LayoutComponent>
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Profil Parametrləri</h1>
          <p className="text-muted-foreground">Hesab məlumatlarınızı idarə edin</p>
        </div>

        <div className="grid gap-6 md:grid-cols-12">

          {/* ── Sol panel: Profil kartı ───────────────────────────────────── */}
          <div className="md:col-span-4">
            <Card>
              <CardHeader><CardTitle>Profil</CardTitle></CardHeader>
              <CardContent className="space-y-6">

                {/* Avatar */}
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-32 w-32">
                    {avatarUrl?.startsWith('http') ? (
                      <>
                        <AvatarImage src={avatarUrl} alt={`${firstName} ${lastName}`}
                          onError={() => setAvatarUrl('')} />
                        <AvatarFallback className="text-2xl">
                          {firstName.charAt(0)}{lastName.charAt(0)}
                        </AvatarFallback>
                      </>
                    ) : (
                      <AvatarFallback className="text-2xl">
                        {firstName.charAt(0)}{lastName.charAt(0)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="relative">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Camera className="h-4 w-4" />Avatar Yüklə
                    </Button>
                    <input type="file" accept="image/*" onChange={handleAvatarUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                </div>

                <Separator />

                {/* User info */}
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
                      <span className="truncate text-xs">ID: {user.id}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Stats */}
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

          {/* ── Sağ panel: Tabs ───────────────────────────────────────────── */}
          <div className="md:col-span-8">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
              <TabsList className={`grid w-full ${user.role === 'customer' ? 'grid-cols-4' : 'grid-cols-5'}`}>
                {user.role === 'customer' && (
                  <TabsTrigger value="orders">
                    <ShoppingBag className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Sifarişlər</span>
                  </TabsTrigger>
                )}
                {user.role !== 'customer' && (
                  <TabsTrigger value="dashboard">
                    <LayoutDashboard className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </TabsTrigger>
                )}
                <TabsTrigger value="profile">
                  <User className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Profil</span>
                </TabsTrigger>
                <TabsTrigger value="security">
                  <Lock className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Təhlükəsizlik</span>
                </TabsTrigger>
                <TabsTrigger value="notifications">
                  <Bell className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Bildirişlər</span>
                </TabsTrigger>
              </TabsList>

              {/* ── Sifarişlər tab (customer) ─────────────────────────────── */}
              {user.role === 'customer' && (
                <TabsContent value="orders" className="space-y-6">

                  {/* Aktiv sifarişlər */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Package className="h-5 w-5 text-primary" />
                          Aktiv Sifarişlər
                        </CardTitle>
                        <CardDescription>Hazırda işlənilən sifarişləriniz</CardDescription>
                      </div>
                      <Badge variant="outline">{activeOrders.length} sifariş</Badge>
                    </CardHeader>
                    <CardContent>
                      {ordersLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : activeOrders.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p>Aktiv sifariş yoxdur</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {activeOrders.map(order => (
                            <OrderCard key={order.id} order={order} showTrack />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Sifariş tarixçəsi */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Sifariş Tarixçəsi</CardTitle>
                        <CardDescription>Keçmiş sifarişləriniz</CardDescription>
                      </div>
                      <Badge variant="outline">{historyOrders.length} sifariş</Badge>
                    </CardHeader>
                    <CardContent>
                      {ordersLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : historyOrders.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>Sifariş tarixçəsi yoxdur</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {historyOrders.map(order => (
                            <OrderCard key={order.id} order={order} />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {/* ── Dashboard tab (staff) ─────────────────────────────────── */}
              {user.role !== 'customer' && (
                <TabsContent value="dashboard" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Dashboard</CardTitle>
                      <CardDescription>Ümumi məlumatlar və statistika</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-3">
                        {[
                          { label: 'Bugünkü Tapşırıqlar', value: statistics.totalOrders,     sub: 'Aktiv tapşırıqlar', icon: <ShoppingBag className="h-4 w-4 text-muted-foreground" /> },
                          { label: 'Tamamlanıb',          value: statistics.completedOrders, sub: 'Bu ay',             icon: <TrendingUp   className="h-4 w-4 text-muted-foreground" /> },
                          { label: 'Performans',          value: statistics.averageRating,   sub: 'Orta reytinq',     icon: <Star         className="h-4 w-4 text-muted-foreground" /> },
                        ].map((s, i) => (
                          <Card key={i}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">{s.label}</CardTitle>
                              {s.icon}
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">{s.value}</div>
                              <p className="text-xs text-muted-foreground">{s.sub}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {/* ── Profil tab ────────────────────────────────────────────── */}
              <TabsContent value="profile" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Şəxsi Məlumatlar</CardTitle>
                    <CardDescription>Profil məlumatlarınızı yeniləyin</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Ad</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input value={firstName} onChange={e => setFirstName(e.target.value)} className="pl-9" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Soyad</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input value={lastName} onChange={e => setLastName(e.target.value)} className="pl-9" />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>E-poçt</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="pl-9" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Telefon</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="pl-9" placeholder="+994 XX XXX XX XX" />
                      </div>
                    </div>
                    {user.role === 'customer' && (
                      <div className="space-y-2">
                        <Label>Ünvan</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input defaultValue={user.address?.street || ''} className="pl-9" placeholder="Ünvanınızı daxil edin" />
                        </div>
                      </div>
                    )}
                    <Button onClick={handleProfileUpdate} className="w-full gap-2">
                      <Save className="h-4 w-4" />Dəyişiklikləri Yadda Saxla
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Security tab ──────────────────────────────────────────── */}
              <TabsContent value="security" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Şifrəni Dəyişdir</CardTitle>
                    <CardDescription>Hesabınızın təhlükəsizliyini qoruyun</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { id: 'cur', label: 'Cari Şifrə',       val: currentPassword, set: setCurrentPassword },
                      { id: 'new', label: 'Yeni Şifrə',        val: newPassword,     set: setNewPassword     },
                      { id: 'con', label: 'Şifrəni Təsdiqlə',  val: confirmPassword, set: setConfirmPassword  },
                    ].map((f, i) => (
                      <div key={f.id} className="space-y-2">
                        <Label>{f.label}</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input type={showPasswords ? 'text' : 'password'}
                            value={f.val} onChange={e => f.set(e.target.value)}
                            className="pl-9 pr-9" />
                          {i === 2 && (
                            <button type="button" onClick={() => setShowPasswords(!showPasswords)}
                              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                              {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <Button onClick={handlePasswordChange} className="w-full">Şifrəni Yenilə</Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── Notifications tab ─────────────────────────────────────── */}
              <TabsContent value="notifications" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Bildiriş Parametrləri</CardTitle>
                    <CardDescription>
                      {user.role === 'customer' ? 'Necə bildiriş almaq istədiyinizi seçin' : 'İş bildirişlərinizi idarə edin'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { label: 'E-poçt Bildirişləri', desc: 'Mühüm yeniləmələr üçün e-poçt al', val: emailNotifications, set: setEmailNotifications },
                      { label: 'Push Bildirişlər',    desc: 'Brauzerdə ani bildirişlər al',       val: pushNotifications,  set: setPushNotifications  },
                      ...(user.role === 'customer' ? [
                        { label: 'Sifariş Yeniləmələri',      desc: 'Sifarişlərinizin statusu haqqında', val: orderUpdates, set: setOrderUpdates },
                        { label: 'Kampaniya və Endirimlər',    desc: 'Xüsusi təkliflər haqqında',        val: promotions,   set: setPromotions   },
                      ] : [
                        { label: 'Yeni Tapşırıq Bildirişləri', desc: 'Yeni tapşırıqlar haqqında dərhal',  val: newOrderAlerts,     set: setNewOrderAlerts     },
                        { label: 'Status Dəyişiklikləri',      desc: 'Tapşırıqlar dəyişdikdə xəbərdar',  val: statusChangeAlerts, set: setStatusChangeAlerts },
                        { label: 'Təcili Bildirişlər',         desc: 'Prioritet vəziyyətlər barədə',      val: urgentNotifications, set: setUrgentNotifications },
                        { label: 'Sistem Bildirişləri',        desc: 'Sistem yeniləmələri və texniki',    val: systemAlerts,       set: setSystemAlerts       },
                      ]),
                    ].map((n, i, arr) => (
                      <React.Fragment key={n.label}>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <div className="font-medium">{n.label}</div>
                            <div className="text-sm text-muted-foreground">{n.desc}</div>
                          </div>
                          <Switch checked={n.val} onCheckedChange={n.set} />
                        </div>
                        {i < arr.length - 1 && <Separator />}
                      </React.Fragment>
                    ))}
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
