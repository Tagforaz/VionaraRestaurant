import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Clock, CheckCircle, XCircle, ChefHat, TrendingUp, Package } from 'lucide-react';

export const ChefDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Mock data - replace with actual API calls
  const stats = {
    pending: 5,
    preparing: 3,
    completed: 42,
    rejected: 2,
  };

  const recentOrders = [
    { id: '1234', customer: 'John Doe', items: 2, status: 'pending', time: '5 dəq əvvəl' },
    { id: '1235', customer: 'Alice Brown', items: 3, status: 'accepted', time: '12 dəq əvvəl' },
    { id: '1236', customer: 'Bob Wilson', items: 1, status: 'preparing', time: '25 dəq əvvəl' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-orange-50/20 dark:to-orange-950/10">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white">
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
                <ChefHat className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{t('chef.dashboard')}</h1>
                <p className="text-orange-100 mt-1">{t('chef.subtitle')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card 
            onClick={() => navigate('/chef/orders')}
            className="group cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-amber-500 to-orange-600 text-white overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <Clock className="h-8 w-8 opacity-80" />
                <div className="text-right">
                  <div className="text-4xl font-bold">{stats.pending}</div>
                  <p className="text-sm opacity-90 mt-1">{t('chef.stats.new')}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-sm font-medium opacity-90">{t('chef.stats.pending')}</p>
              <div className="mt-2 text-xs opacity-75">{t('chef.stats.urgentAccept')}</div>
            </CardContent>
          </Card>

          <Card 
            onClick={() => navigate('/chef/orders')}
            className="group cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <Package className="h-8 w-8 opacity-80" />
                <div className="text-right">
                  <div className="text-4xl font-bold">{stats.preparing}</div>
                  <p className="text-sm opacity-90 mt-1">{t('chef.stats.active')}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-sm font-medium opacity-90">{t('chef.stats.preparing')}</p>
              <div className="mt-2 text-xs opacity-75">{t('chef.stats.processManagement')}</div>
            </CardContent>
          </Card>

          <Card 
            onClick={() => navigate('/chef/orders')}
            className="group cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-500 to-emerald-600 text-white overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <CheckCircle className="h-8 w-8 opacity-80" />
                <div className="text-right">
                  <div className="text-4xl font-bold">{stats.completed}</div>
                  <p className="text-sm opacity-90 mt-1">{t('chef.stats.today')}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-sm font-medium opacity-90">{t('chef.stats.completed')}</p>
              <div className="mt-2 text-xs opacity-75">{t('chef.stats.successDelivery')}</div>
            </CardContent>
          </Card>

          <Card 
            onClick={() => navigate('/chef/orders')}
            className="group cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-slate-600 to-slate-700 text-white overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <XCircle className="h-8 w-8 opacity-80" />
                <div className="text-right">
                  <div className="text-4xl font-bold">{stats.rejected}</div>
                  <p className="text-sm opacity-90 mt-1">{t('chef.stats.total')}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-sm font-medium opacity-90">{t('chef.stats.rejected')}</p>
              <div className="mt-2 text-xs opacity-75">{t('chef.stats.archive')}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{t('chef.recentOrders')}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{t('chef.newOrders')}</p>
              </div>
              <Button 
                onClick={() => navigate('/chef/orders')}
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                {t('chef.viewAll')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => navigate('/chef/orders')}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-all hover:shadow-md group"
                >
                  <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-950 group-hover:scale-110 transition-transform">
                    <ShoppingBag className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{t('chef.order')} #{order.id}</p>
                      <span className="text-xs text-muted-foreground">• {order.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{order.customer} • {order.items} {t('chef.items')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {order.status === 'pending' && (
                      <div className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-medium">
                        {t('chef.orderStatus.pending')}
                      </div>
                    )}
                    {order.status === 'accepted' && (
                      <div className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 text-xs font-medium">
                        {t('chef.orderStatus.accepted')}
                      </div>
                    )}
                    {order.status === 'preparing' && (
                      <div className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-medium">
                        {t('chef.orderStatus.preparing')}
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
