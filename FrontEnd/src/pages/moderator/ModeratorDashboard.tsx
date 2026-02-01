import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBag, CalendarDays, Star, QrCode, Shield, TrendingUp, Package } from 'lucide-react';

export const ModeratorDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const stats = {
    totalOrders: 85,
    activeReservations: 12,
    pendingReviews: 8,
    activeQRCodes: 25,
  };

  const recentActivity = [
    { id: '1234', type: 'order', action: 'Yeni sifariş - Çatdırılma', time: '3 dəq əvvəl', status: 'new' },
    { id: '1235', type: 'reservation', action: 'Masa rezervasiyası', time: '15 dəq əvvəl', status: 'pending' },
    { id: '1236', type: 'review', action: 'Yeni rəy - 5 ulduz', time: '25 dəq əvvəl', status: 'new' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-50/20 dark:to-purple-950/10">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
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
                <Shield className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{t('moderator.welcome')}</h1>
                <p className="text-purple-100 mt-1">{t('moderator.controlAllOperations')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card 
            onClick={() => navigate('/moderator/orders')}
            className="group cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-500 to-amber-600 text-white overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <ShoppingBag className="h-8 w-8 opacity-80" />
                <div className="text-right">
                  <div className="text-4xl font-bold">{stats.totalOrders}</div>
                  <p className="text-sm opacity-90 mt-1">{t('moderator.today')}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-sm font-medium opacity-90">{t('moderator.stats.orders')}</p>
              <div className="mt-2 text-xs opacity-75">{t('moderator.ordersDesc')}</div>
            </CardContent>
          </Card>

          <Card 
            onClick={() => navigate('/moderator/reservations')}
            className="group cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <CalendarDays className="h-8 w-8 opacity-80" />
                <div className="text-right">
                  <div className="text-4xl font-bold">{stats.activeReservations}</div>
                  <p className="text-sm opacity-90 mt-1">{t('moderator.active')}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-sm font-medium opacity-90">{t('moderator.stats.reservations')}</p>
              <div className="mt-2 text-xs opacity-75">{t('moderator.reservationsDesc')}</div>
            </CardContent>
          </Card>

          <Card 
            onClick={() => navigate('/moderator/reviews')}
            className="group cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-amber-500 to-yellow-600 text-white overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <Star className="h-8 w-8 opacity-80" />
                <div className="text-right">
                  <div className="text-4xl font-bold">{stats.pendingReviews}</div>
                  <p className="text-sm opacity-90 mt-1">{t('moderator.pending')}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-sm font-medium opacity-90">{t('moderator.stats.reviews')}</p>
              <div className="mt-2 text-xs opacity-75">{t('moderator.reviewsDesc')}</div>
            </CardContent>
          </Card>

          <Card 
            onClick={() => navigate('/moderator/qr-codes')}
            className="group cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-500 to-emerald-600 text-white overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <QrCode className="h-8 w-8 opacity-80" />
                <div className="text-right">
                  <div className="text-4xl font-bold">{stats.activeQRCodes}</div>
                  <p className="text-sm opacity-90 mt-1">{t('moderator.active')}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-sm font-medium opacity-90">{t('moderator.stats.qrCodes')}</p>
              <div className="mt-2 text-xs opacity-75">{t('moderator.qrCodesDesc')}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-950 rounded-lg">
                  <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">{t('moderator.orderType')}</CardTitle>
                  <p className="text-sm text-muted-foreground">{t('moderator.today')}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('moderator.delivery')}</span>
                  <span className="font-semibold">52</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('moderator.dineIn')}</span>
                  <span className="font-semibold text-blue-600">33</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-950 rounded-lg">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">{t('moderator.moderation')}</CardTitle>
                  <p className="text-sm text-muted-foreground">{t('moderator.status')}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('moderator.pending')}</span>
                  <span className="font-semibold">8</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('moderator.completed')}</span>
                  <span className="font-semibold text-green-600">142</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Son Fəaliyyətlər</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Son aktivliklər</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  onClick={() => {
                    if (activity.type === 'order') navigate('/moderator/orders');
                    if (activity.type === 'reservation') navigate('/moderator/reservations');
                    if (activity.type === 'review') navigate('/moderator/reviews');
                  }}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-all hover:shadow-md group"
                >
                  <div className={`p-3 rounded-full group-hover:scale-110 transition-transform ${
                    activity.type === 'order' ? 'bg-orange-100 dark:bg-orange-950' :
                    activity.type === 'reservation' ? 'bg-blue-100 dark:bg-blue-950' :
                    'bg-amber-100 dark:bg-amber-950'
                  }`}>
                    {activity.type === 'order' && (
                      <ShoppingBag className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    )}
                    {activity.type === 'reservation' && (
                      <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    )}
                    {activity.type === 'review' && (
                      <Star className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">#{activity.id}</p>
                      <span className="text-xs text-muted-foreground">• {activity.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{activity.action}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {activity.status === 'new' && (
                      <div className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-medium">
                        Yeni
                      </div>
                    )}
                    {activity.status === 'pending' && (
                      <div className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-medium">
                        Gözləyir
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
