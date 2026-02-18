import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, ShoppingBag, Users, Clock, Plus, Utensils } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7156';
const authHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
  'Content-Type': 'application/json',
});

export const WaiterDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [reservations, setReservations] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const notifiedReservationsRef = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [stats, setStats] = useState({ todayReservations: 0, activeOrders: 0, avgWaitTime: 0 });

  // Request notification permission and initialize audio
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
      });
    } else if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDV/zPLTgjMGHm7A7+OZURE');
    audioRef.current.volume = 0.5;
  }, []);

  // Fetch reservations and recent activity from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Rezervasiyalar
        const resReservations = await fetch(`${API_BASE}/api/reservations?page=1&take=10`, { headers: authHeaders() });
        const reservationsData = await resReservations.json();
        setReservations(Array.isArray(reservationsData) ? reservationsData : reservationsData.data ?? []);

        // Son sifarişlər (activity)
        const resOrders = await fetch(`${API_BASE}/api/orders?page=1&take=10`, { headers: authHeaders() });
        const ordersData = await resOrders.json();
        const ordersList = Array.isArray(ordersData) ? ordersData : ordersData.data ?? [];
        setRecentActivity(
          ordersList.map((order: any) => ({
            table: order.tableNumber,
            action: t('waiter.newOrderActivity'),
            time: new Date(order.createdAt + 'Z').toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' }),
            status: 'new',
          }))
        );

        // Stats (mock, real API varsa uyğunlaşdır)
        setStats({
          todayReservations: reservationsData.total ?? reservationsData.length ?? 0,
          activeOrders: ordersList.filter((o: any) => o.status !== 7 && o.status !== 8).length,
          avgWaitTime: 15,
        });
      } catch (err) {
        // Xəta olsa mock data saxla
      }
    };
    fetchData();
  }, [t]);

  // Check for reservations 30 minutes before
  useEffect(() => {
    const checkReservations = () => {
      const now = new Date();
      reservations.forEach(reservation => {
        const reservationTime = new Date(reservation.date);
        const timeDiff = reservationTime.getTime() - now.getTime();
        const minutesUntil = Math.floor(timeDiff / 60000);
        if (minutesUntil <= 30 && minutesUntil > 0 && !notifiedReservationsRef.current.has(reservation.id)) {
          notifiedReservationsRef.current.add(reservation.id);
          if (audioRef.current) {
            audioRef.current.play().catch(() => {});
          }
          toast({
            title: t('waiter.reservationReminder'),
            description: `${t('waiter.table')} ${reservation.tableNumber} - ${reservation.customerName} (${minutesUntil} ${t('waiter.minutesLeft')})`,
            duration: 10000,
          });
          if (notificationPermission === 'granted') {
            new Notification(t('waiter.reservationReminder'), {
              body: `${t('waiter.prepareTable')} ${reservation.tableNumber} - ${reservation.customerName}`,
              icon: '/logo.png',
              requireInteraction: true,
            });
          }
        }
      });
    };
    const interval = setInterval(checkReservations, 5000);
    return () => clearInterval(interval);
  }, [reservations, notificationPermission, t]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-50/20 dark:to-blue-950/10">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
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
                <Utensils className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{t('waiter.welcome')}</h1>
                <p className="text-blue-100 mt-1">{t('waiter.manageReservationsAndOrders')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Button
            onClick={() => navigate('/waiter/orders/new')}
            className="h-auto p-8 border-2 border-dashed border-blue-300 dark:border-blue-800 hover:border-blue-500 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all"
            variant="outline"
          >
            <div className="flex items-center gap-4 w-full">
              <div className="p-4 bg-blue-100 dark:bg-blue-950 rounded-full">
                <Plus className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400">{t('waiter.newOrder')}</h3>
                <p className="text-sm text-muted-foreground">{t('waiter.newOrderDesc')}</p>
              </div>
            </div>
          </Button>

          <Button
            onClick={() => navigate('/waiter/reservations')}
            className="h-auto p-8 border-2 border-dashed border-amber-300 dark:border-amber-800 hover:border-amber-500 bg-transparent hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all"
            variant="outline"
          >
            <div className="flex items-center gap-4 w-full">
              <div className="p-4 bg-amber-100 dark:bg-amber-950 rounded-full">
                <CalendarDays className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400">{t('waiter.reservations')}</h3>
                <p className="text-sm text-muted-foreground">{t('waiter.reservationsDesc')}</p>
              </div>
            </div>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card 
            onClick={() => navigate('/waiter/reservations')}
            className="group cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-amber-500 to-orange-600 text-white overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <CalendarDays className="h-8 w-8 opacity-80" />
                <div className="text-right">
                  <div className="text-4xl font-bold">{stats.todayReservations}</div>
                  <p className="text-sm opacity-90 mt-1">{t('waiter.today')}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-sm font-medium opacity-90">{t('waiter.stats.reservations')}</p>
              <div className="mt-2 text-xs opacity-75">{t('waiter.confirmedTables')}</div>
            </CardContent>
          </Card>

          <Card 
            onClick={() => navigate('/waiter/orders')}
            className="group cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <ShoppingBag className="h-8 w-8 opacity-80" />
                <div className="text-right">
                  <div className="text-4xl font-bold">{stats.activeOrders}</div>
                  <p className="text-sm opacity-90 mt-1">{t('waiter.internal')}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-sm font-medium opacity-90">{t('waiter.stats.activeOrders')}</p>
              <div className="mt-2 text-xs opacity-75">{t('waiter.preparingAndWaiting')}</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{t('waiter.recentActivity')}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{t('waiter.currentTablesAndActivities')}</p>
              </div>
              <Button 
                onClick={() => navigate('/waiter/orders')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                {t('waiter.allOrders')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  onClick={() => navigate('/waiter/orders')}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-all hover:shadow-md group"
                >
                  <div className={`p-3 rounded-full group-hover:scale-110 transition-transform ${
                    activity.status === 'new' ? 'bg-blue-100 dark:bg-blue-950' :
                    activity.status === 'ready' ? 'bg-green-100 dark:bg-green-950' :
                    'bg-amber-100 dark:bg-amber-950'
                  }`}>
                    {activity.status === 'new' ? (
                      <ShoppingBag className={`h-5 w-5 ${activity.status === 'new' ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                    ) : activity.status === 'ready' ? (
                      <ShoppingBag className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <CalendarDays className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{t('waiter.table')} {activity.table}</p>
                      <span className="text-xs text-muted-foreground">• {activity.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{activity.action}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {activity.status === 'new' && (
                      <div className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-medium">
                        {t('waiter.new')}
                      </div>
                    )}
                    {activity.status === 'ready' && (
                      <div className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 text-xs font-medium">
                        {t('waiter.ready')}
                      </div>
                    )}
                    {activity.status === 'reservation' && (
                      <div className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-medium">
                        {t('waiter.reservation')}
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
