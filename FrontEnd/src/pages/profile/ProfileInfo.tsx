import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Camera, Loader2, Calendar, Mail, Phone, Shield, User, ArrowLeft, ShoppingBag, Package, Clock, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { userService } from '@/api/services/userService';

// Mock order data with details
const mockOrders = [
  { 
    id: '1234', 
    date: '2026-01-14', 
    items: 3, 
    total: 45.99, 
    status: 'delivered', 
    type: 'delivery',
    products: [
      { name: 'Margarita Pizza', quantity: 1, price: 18.99 },
      { name: 'Caesar Salad', quantity: 1, price: 12.00 },
      { name: 'Coca Cola', quantity: 1, price: 3.00 }
    ],
    address: '123 Main St, Baku'
  },
  { 
    id: '1235', 
    date: '2026-01-13', 
    items: 2, 
    total: 28.50, 
    status: 'delivered', 
    type: 'dine-in',
    products: [
      { name: 'Pepperoni Pizza', quantity: 1, price: 22.50 },
      { name: 'Fanta', quantity: 1, price: 3.00 }
    ],
    table: 'Masa 5'
  },
  { 
    id: '1236', 
    date: '2026-01-10', 
    items: 5, 
    total: 67.80, 
    status: 'delivered', 
    type: 'delivery',
    products: [
      { name: 'Quattro Formaggi Pizza', quantity: 2, price: 24.90 },
      { name: 'Greek Salad', quantity: 1, price: 10.00 },
      { name: 'Tiramisu', quantity: 2, price: 8.00 }
    ],
    address: '456 Park Ave, Baku'
  },
  { 
    id: '1237', 
    date: '2026-01-08', 
    items: 1, 
    total: 15.00, 
    status: 'delivered', 
    type: 'pickup',
    products: [
      { name: 'Hawaiian Pizza', quantity: 1, price: 15.00 }
    ]
  },
];

const activeOrders = [
  { id: '1238', date: '2026-01-15', items: 2, total: 32.00, status: 'preparing', type: 'delivery', eta: '25 dəq' },
];

export const ProfileInfo = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload
      try {
        setLoading(true);
        const response = await userService.uploadAvatar(file);
        updateUser({ ...user!, avatarUrl: response.avatarUrl });
        toast({
          title: 'Uğurlu',
          description: 'Avatar yeniləndi',
        });
      } catch (error) {
        toast({
          title: 'Xəta',
          description: 'Avatar yeniləmə alınmadı',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Backend PutUserDto format
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phone || undefined,
        fullAddress: undefined, // TODO: Add address field to form
      };
      
      const response = await userService.updateProfile(updateData);
      
      // Update local user context
      updateUser({ 
        ...user!, 
        firstName: response.firstName || formData.firstName,
        lastName: response.lastName || formData.lastName,
        phone: response.phoneNumber || formData.phone,
      });
      
      toast({
        title: 'Uğurlu',
        description: 'Profil məlumatları yeniləndi',
      });
    } catch (error: any) {
      console.error('❌ Profile update error:', error);
      toast({
        title: 'Xəta',
        description: error.response?.data?.message || 'Məlumatlar yenilənə bilmədi',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string }> = {
      preparing: { className: 'bg-blue-500' },
      ready: { className: 'bg-green-500' },
      delivering: { className: 'bg-amber-500' },
      delivered: { className: 'bg-green-600' },
      cancelled: { className: 'bg-red-500' },
    };
    const { className } = config[status] || { className: 'bg-gray-500' };
    const label = t(`profile.status.${status}`, status);
    return <Badge className={className}>{label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-amber-50/20 dark:to-amber-950/10">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-white hover:bg-white/20 text-2xl font-bold px-6"
            >
              Vionara
            </Button>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <User className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{t('profile.title')}</h1>
                <p className="text-amber-100 mt-1">{t('profile.subtitle')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 max-w-7xl space-y-8">
        {/* User Stats */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-950 rounded-lg">
                  <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-sm">{t('profile.role')}</CardTitle>
                  <Badge variant="secondary" className="mt-1">
                    {t(`profile.roles.${user?.role || 'customer'}`)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-950 rounded-lg">
                  <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-sm">{t('profile.email')}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{user?.email}</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-950 rounded-lg">
                  <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-sm">{t('profile.phone')}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">{user?.phone || '+1234567890'}</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-950 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-sm">{t('profile.registration')}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {user?.createdAt 
                      ? new Date(user.createdAt).toISOString().split('T')[0]
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Customer-specific content */}
        {(!user?.role || user?.role === 'customer') ? (
          <>
        {/* Main Content Grid - Sidebar + Content */}
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Left Sidebar - Avatar & Personal Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Avatar Card */}
            <Card className="border-2 hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-amber-600" />
                  {t('profile.avatar')}
                </CardTitle>
                <CardDescription>{t('profile.subtitle')}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-6">
                <div className="relative group">
                  <Avatar className="h-40 w-40 border-4 border-amber-600/20 shadow-lg">
                    <AvatarImage src={avatarPreview || undefined} />
                    <AvatarFallback className="text-5xl bg-gradient-to-br from-amber-600 to-amber-700 text-white">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="h-10 w-10 text-white" />
                  </div>
                </div>
                
                <div className="w-full space-y-3">
                  <Label htmlFor="avatar" className="cursor-pointer w-full">
                    <div className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all shadow-md hover:shadow-lg">
                      <Camera className="h-5 w-5" />
                      <span className="font-medium">{t('profile.uploadPhoto')}</span>
                    </div>
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                      disabled={loading}
                    />
                  </Label>
                  <p className="text-sm text-center text-muted-foreground">
                    {t('profile.uploadPhotoDesc')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Personal Info Card */}
            <Card className="border-2 hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  {t('profile.personalInfo')}
                </CardTitle>
                <CardDescription>{t('profile.personalInfoDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium">{t('profile.firstName')}</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder={t('profile.firstName')}
                      className="border-2 focus:border-amber-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium">{t('profile.lastName')}</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder={t('profile.lastName')}
                      className="border-2 focus:border-amber-600"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-600" />
                      {t('profile.email')}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@example.com"
                      className="border-2 focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4 text-green-600" />
                      {t('profile.phone')}
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+994 XX XXX XX XX"
                      className="border-2 focus:border-green-600"
                    />
                  </div>

                  <Separator />

                  <div className="flex flex-col gap-3">
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 shadow-md"
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t('profile.save')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-2"
                      onClick={() => setFormData({
                        firstName: user?.firstName || '',
                        lastName: user?.lastName || '',
                        email: user?.email || '',
                        phone: user?.phone || '',
                      })}
                    >
                      {t('profile.cancel')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Content - Active Orders & Order History */}
          <div className="lg:col-span-3 space-y-6">
        {/* Active Orders */}
        {activeOrders.length > 0 && (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 blur-2xl"></div>
            <Card className="relative shadow-2xl border-0 bg-gradient-to-br from-white via-amber-50/50 to-orange-50/50 dark:from-gray-950 dark:via-amber-950/20 dark:to-orange-950/20 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              
              <CardHeader className="relative">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg animate-pulse">
                        <Clock className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                          {t('profile.activeOrders')}
                        </CardTitle>
                        <CardDescription className="text-base mt-1">
                          {t('profile.activeOrdersDesc')}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-4 py-2 text-base shadow-lg">
                    {activeOrders.length} {t('profile.order')}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="relative space-y-4">
                {activeOrders.map((order, index) => (
                  <div
                    key={order.id}
                    className="group relative bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-xl border-2 border-amber-200/50 dark:border-amber-900/30 hover:border-amber-400 dark:hover:border-amber-600 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                  >
                    {/* Progress bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-800 rounded-t-2xl overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 w-2/3 animate-pulse"></div>
                    </div>

                    <div className="flex items-start gap-6">
                      {/* Icon Section */}
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
                        <div className="relative p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                          <Package className="h-8 w-8 text-white" />
                        </div>
                        {/* Pulse rings */}
                        <div className="absolute inset-0 rounded-2xl border-2 border-amber-400 animate-ping opacity-75"></div>
                      </div>

                      {/* Order Details */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                              {t('profile.order')} #{order.id}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {new Date(order.date).toLocaleDateString('az-AZ')}
                            </p>
                          </div>
                          {getStatusBadge(order.status)}
                        </div>

                        {/* Order Info Grid */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 rounded-xl p-3 border border-blue-200/50 dark:border-blue-800/50">
                            <div className="flex items-center gap-2 mb-1">
                              <ShoppingBag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{t('profile.items')}</span>
                            </div>
                            <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{order.items} {t('profile.piece')}</p>
                          </div>

                          <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/30 rounded-xl p-3 border border-green-200/50 dark:border-green-800/50">
                            <div className="flex items-center gap-2 mb-1">
                              <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
                              <span className="text-xs font-medium text-green-600 dark:text-green-400">{t('profile.amount')}</span>
                            </div>
                            <p className="text-lg font-bold text-green-700 dark:text-green-300">{order.total.toFixed(2)} AZN</p>
                          </div>

                          <div className="bg-gradient-to-br from-amber-50 to-orange-100/50 dark:from-amber-950/50 dark:to-orange-900/30 rounded-xl p-3 border border-amber-200/50 dark:border-amber-800/50">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">{t('profile.delivery')}</span>
                            </div>
                            <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{order.eta}</p>
                          </div>
                        </div>

                        {/* Action Button */}
                        <Button 
                          onClick={() => navigate(`/order-tracking/${order.id}`)}
                          className="w-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 hover:from-amber-700 hover:via-orange-700 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02] text-base py-6 rounded-xl font-semibold"
                        >
                          <span className="flex items-center gap-2">
                            {t('profile.trackOrder')}
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Order History */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <ShoppingBag className="h-6 w-6 text-blue-600" />
                  {t('profile.orderHistory')}
                </CardTitle>
                <CardDescription className="mt-1">{t('profile.orderHistoryDesc')}</CardDescription>
              </div>
              <Badge variant="secondary" className="text-sm">
                {mockOrders.length} {t('profile.orders')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockOrders.map((order) => (
                <div key={order.id} className="border rounded-lg overflow-hidden">
                  <div
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    className="flex items-center gap-4 p-4 bg-card hover:bg-accent cursor-pointer transition-all hover:shadow-md group"
                  >
                    <div className="p-3 rounded-full bg-green-100 dark:bg-green-950 group-hover:scale-110 transition-transform">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-semibold">{t('profile.order')} #{order.id}</p>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{new Date(order.date).toLocaleDateString('az-AZ')}</span>
                        <span>•</span>
                        <span>{order.items} {t('profile.items')}</span>
                        <span>•</span>
                        <span className="font-semibold">{order.total.toFixed(2)} AZN</span>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs">
                          {t(`profile.orderType.${order.type === 'delivery' ? 'delivery' : order.type === 'dine-in' ? 'dineIn' : 'pickup'}`)}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-muted-foreground">
                      {expandedOrder === order.id ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Order Details */}
                  {expandedOrder === order.id && (
                    <div className="border-t bg-muted/30 p-4 space-y-3 animate-in slide-in-from-top-2">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <Package className="h-4 w-4 text-blue-600" />
                          Məhsullar:
                        </h4>
                        <div className="space-y-2 pl-6">
                          {order.products.map((product, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-xs font-semibold text-blue-600 dark:text-blue-400">
                                  {product.quantity}
                                </span>
                                <span>{product.name}</span>
                              </div>
                              <span className="font-semibold">{product.price.toFixed(2)} AZN</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {order.address && (
                        <div className="text-sm">
                          <span className="font-semibold text-muted-foreground">{t('profile.address')}: </span>
                          <span>{order.address}</span>
                        </div>
                      )}
                      {order.table && (
                        <div className="text-sm">
                          <span className="font-semibold text-muted-foreground">{t('profile.table')}: </span>
                          <span>{order.table}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="font-bold">{t('profile.total')}:</span>
                        <span className="text-xl font-bold text-green-600 dark:text-green-400">
                          {order.total.toFixed(2)} AZN
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
          </div>
        </div>
          </>
        ) : (
          /* Staff/Admin Simple Profile */
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Avatar Card */}
            <Card className="lg:col-span-1 border-2 hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-amber-600" />
                  {t('profile.avatar')}
                </CardTitle>
                <CardDescription>{t('profile.updateAvatar')}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-6">
                <div className="relative group">
                  <Avatar className="h-32 w-32 border-4 border-amber-600/20 shadow-lg">
                    <AvatarImage src={avatarPreview || undefined} />
                    <AvatarFallback className="text-4xl bg-gradient-to-br from-amber-600 to-amber-700 text-white">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                </div>
                
                <div className="w-full space-y-3">
                  <Label htmlFor="avatar" className="cursor-pointer w-full">
                    <div className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all shadow-md hover:shadow-lg">
                      <Camera className="h-5 w-5" />
                      <span className="font-medium">{t('profile.uploadPhoto')}</span>
                    </div>
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                      disabled={loading}
                    />
                  </Label>
                  <p className="text-sm text-center text-muted-foreground">
                    {t('profile.imageFormat')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Personal Info Card */}
            <Card className="lg:col-span-2 border-2 hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  {t('profile.personalInfo')}
                </CardTitle>
                <CardDescription>{t('profile.updateInfo')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium">{t('profile.name')}</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder={t('profile.namePlaceholder')}
                        className="border-2 focus:border-amber-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium">{t('profile.surname')}</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder={t('profile.surnamePlaceholder')}
                        className="border-2 focus:border-amber-600"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-600" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@example.com"
                      className="border-2 focus:border-blue-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4 text-green-600" />
                      {t('profile.phone')}
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+994 XX XXX XX XX"
                      className="border-2 focus:border-green-600"
                    />
                  </div>

                  <Separator />

                  <div className="pt-2 flex gap-3">
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 shadow-md"
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {t('profile.save')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-2"
                      onClick={() => setFormData({
                        firstName: user?.firstName || '',
                        lastName: user?.lastName || '',
                        email: user?.email || '',
                        phone: user?.phone || '',
                      })}
                    >
                      {t('profile.cancel')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
