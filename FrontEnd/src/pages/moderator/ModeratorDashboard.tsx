import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ShoppingBag, CalendarDays, Star, Shield, Package, Clock, MapPin, User, Loader2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7200';
const authHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
  'Content-Type': 'application/json',
});

// DeliveryType: Delivery=1, Pickup=2, DineIn=3 (həm int həm string)
const normalizeDeliveryType = (dt: any): number => {
  if (dt === 1 || dt === 'Delivery') return 1;
  if (dt === 2 || dt === 'Pickup') return 2;
  if (dt === 3 || dt === 'DineIn') return 3;
  return 0;
};

const deliveryTypeLabel = (dt: any): string => {
  const type = normalizeDeliveryType(dt);
  if (type === 1) return 'Çatdırılma';
  if (type === 2) return 'Götürmə';
  if (type === 3) return 'Daxili';
  return 'Naməlum';
};

interface Stats {
  totalOrders: number;
  activeReservations: number;
  pendingReviews: number;
  deliveryCount: number;
  pickupCount: number;
  dineInCount: number;
  approvedReviews: number;
}

export const ModeratorDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    activeReservations: 0,
    pendingReviews: 0,
    deliveryCount: 0,
    pickupCount: 0,
    dineInCount: 0,
    approvedReviews: 0,
  });
  const [completedOrders, setCompletedOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, reservationsRes, reviewsRes] = await Promise.allSettled([
        fetch(`${API_BASE}/api/orders?page=1&take=100`, { headers: authHeaders() }),
        fetch(`${API_BASE}/api/reservations?page=1&take=100`, { headers: authHeaders() }),
        fetch(`${API_BASE}/api/reviews?page=1&take=100`, { headers: authHeaders() }),
      ]);

      let orders: any[] = [];
      if (ordersRes.status === 'fulfilled' && ordersRes.value.ok) {
        const data = await ordersRes.value.json();
        orders = Array.isArray(data) ? data : data.data ?? [];
      }

      let reservations: any[] = [];
      if (reservationsRes.status === 'fulfilled' && reservationsRes.value.ok) {
        const data = await reservationsRes.value.json();
        reservations = Array.isArray(data) ? data : data.data ?? [];
      }

      let reviews: any[] = [];
      if (reviewsRes.status === 'fulfilled' && reviewsRes.value.ok) {
        const data = await reviewsRes.value.json();
        reviews = Array.isArray(data) ? data : data.data ?? [];
      }

      const today = new Date().toDateString();
      const todayOrders = orders.filter((o: any) =>
        new Date(o.createdAt + 'Z').toDateString() === today
      );

      const activeRes = reservations.filter((r: any) => r.status === 1 || r.status === 2);
      const pendingRev = reviews.filter((r: any) => !r.isApproved);
      const approvedRev = reviews.filter((r: any) => r.isApproved);

      // ✅ deliveryType field-i, həm int həm string dəstəklənir
      const deliveryOrders = todayOrders.filter((o: any) => normalizeDeliveryType(o.deliveryType) === 1);
      const pickupOrders = todayOrders.filter((o: any) => normalizeDeliveryType(o.deliveryType) === 2);
      const dineInOrders = todayOrders.filter((o: any) => normalizeDeliveryType(o.deliveryType) === 3);

      const completed = orders
        .filter((o: any) => o.status === 7 || o.status === 'Completed')
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      setStats({
        totalOrders: todayOrders.length,
        activeReservations: activeRes.length,
        pendingReviews: pendingRev.length,
        deliveryCount: deliveryOrders.length,
        pickupCount: pickupOrders.length,
        dineInCount: dineInOrders.length,
        approvedReviews: approvedRev.length,
      });
      setCompletedOrders(completed);
    } catch { } finally {
      setLoading(false);
    }
  };

  const handleOrderClick = async (order: any) => {
    try {
      const res = await fetch(`${API_BASE}/api/orders/${order.id}`, { headers: authHeaders() });
      if (res.ok) {
        const detail = await res.json();
        setSelectedOrder(detail);
      } else {
        setSelectedOrder(order);
      }
    } catch {
      setSelectedOrder(order);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-50/20 dark:to-purple-950/10">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/')} className="text-white hover:bg-white/20 text-2xl font-bold px-6">
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
        <div className="grid gap-6 md:grid-cols-3">
          <Card onClick={() => navigate('/moderator/orders')}
            className="group cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-500 to-amber-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <ShoppingBag className="h-8 w-8 opacity-80" />
                <div className="text-right">
                  {loading ? <div className="h-10 w-12 bg-white/20 animate-pulse rounded" /> : <div className="text-4xl font-bold">{stats.totalOrders}</div>}
                  <p className="text-sm opacity-90 mt-1">{t('moderator.today')}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-sm font-medium opacity-90">{t('moderator.stats.orders')}</p>
              <div className="mt-2 text-xs opacity-75">{t('moderator.ordersDesc')}</div>
            </CardContent>
          </Card>

          <Card onClick={() => navigate('/moderator/reservations')}
            className="group cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <CalendarDays className="h-8 w-8 opacity-80" />
                <div className="text-right">
                  {loading ? <div className="h-10 w-12 bg-white/20 animate-pulse rounded" /> : <div className="text-4xl font-bold">{stats.activeReservations}</div>}
                  <p className="text-sm opacity-90 mt-1">{t('moderator.active')}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-sm font-medium opacity-90">{t('moderator.stats.reservations')}</p>
              <div className="mt-2 text-xs opacity-75">{t('moderator.reservationsDesc')}</div>
            </CardContent>
          </Card>

          <Card onClick={() => navigate('/moderator/reviews')}
            className="group cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-amber-500 to-yellow-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <Star className="h-8 w-8 opacity-80" />
                <div className="text-right">
                  {loading ? <div className="h-10 w-12 bg-white/20 animate-pulse rounded" /> : <div className="text-4xl font-bold">{stats.pendingReviews}</div>}
                  <p className="text-sm opacity-90 mt-1">{t('moderator.pending')}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-sm font-medium opacity-90">{t('moderator.stats.reviews')}</p>
              <div className="mt-2 text-xs opacity-75">{t('moderator.reviewsDesc')}</div>
            </CardContent>
          </Card>
        </div>

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
                  <span className="text-sm">Çatdırılma</span>
                  <span className="font-semibold text-orange-600">{loading ? '...' : stats.deliveryCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Özü götürmə</span>
                  <span className="font-semibold text-amber-600">{loading ? '...' : stats.pickupCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Daxili (DineIn)</span>
                  <span className="font-semibold text-blue-600">{loading ? '...' : stats.dineInCount}</span>
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
                  <span className="font-semibold">{loading ? '...' : stats.pendingReviews}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('moderator.completed')}</span>
                  <span className="font-semibold text-green-600">{loading ? '...' : stats.approvedReviews}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-950 dark:to-indigo-950 rounded-lg">
                  <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-xl">{t('moderator.orderHistory')}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{t('moderator.completedOrders')}</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => navigate('/moderator/history')} className="hover:bg-purple-50 dark:hover:bg-purple-950">
                {t('moderator.viewAll')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>
            ) : completedOrders.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Tamamlanmış sifariş yoxdur</p>
            ) : (
              <div className="space-y-3">
                {completedOrders.map((order) => {
                  const orderType = normalizeDeliveryType(order.deliveryType);
                  return (
                    <div key={order.id}
                      onClick={() => handleOrderClick(order)}
                      className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-all hover:shadow-md group">
                      <div className={`p-3 rounded-full group-hover:scale-110 transition-transform ${
                        orderType === 1 ? 'bg-orange-100 dark:bg-orange-950' :
                        orderType === 2 ? 'bg-amber-100 dark:bg-amber-950' :
                        'bg-blue-100 dark:bg-blue-950'
                      }`}>
                        {orderType === 1
                          ? <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                          : <ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">#{order.orderNumber}</p>
                          <Badge variant="secondary" className="text-xs">{deliveryTypeLabel(order.deliveryType)}</Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{order.userEmail}</span>
                          {order.tableNumber && (
                            <>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">Masa {order.tableNumber}</span>
                            </>
                          )}
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(order.createdAt + 'Z').toLocaleString('az-AZ', { timeZone: 'Asia/Baku' })}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <p className="font-bold text-lg text-green-600">₼{order.total?.toFixed(2)}</p>
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                          {t('moderator.completed')}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (() => {
            const orderType = normalizeDeliveryType(selectedOrder.deliveryType ?? selectedOrder.type);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      orderType === 1 ? 'bg-orange-100 dark:bg-orange-950' :
                      orderType === 2 ? 'bg-amber-100 dark:bg-amber-950' :
                      'bg-blue-100 dark:bg-blue-950'
                    }`}>
                      {orderType === 1
                        ? <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        : <ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span>{t('moderator.orderDetails')}</span>
                        <span className="text-muted-foreground">#{selectedOrder.orderNumber}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {deliveryTypeLabel(selectedOrder.deliveryType ?? selectedOrder.type)}
                        </Badge>
                        <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 text-xs">
                          {t('moderator.completed')}
                        </Badge>
                      </div>
                    </div>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(selectedOrder.createdAt + 'Z').toLocaleString('az-AZ', { timeZone: 'Asia/Baku' })}</span>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {t('moderator.customerInfo')}
                      </h4>
                      <div className="space-y-1 text-sm">
                        <p className="flex items-center gap-2">
                          <span className="text-muted-foreground">Email:</span>
                          <span className="font-medium">{selectedOrder.userEmail}</span>
                        </p>
                        {selectedOrder.tableNumber && (
                          <p className="flex items-center gap-2">
                            <span className="text-muted-foreground">{t('moderator.table')}:</span>
                            <span className="font-medium">Masa {selectedOrder.tableNumber}</span>
                          </p>
                        )}
                        {selectedOrder.deliveryAddress && (
                          <p className="flex items-start gap-2">
                            <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                            <span className="font-medium">{selectedOrder.deliveryAddress}</span>
                          </p>
                        )}
                        {selectedOrder.courierName && (
                          <p className="flex items-center gap-2">
                            <span className="text-muted-foreground">Kuryer:</span>
                            <span className="font-medium">{selectedOrder.courierName}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {selectedOrder.items && selectedOrder.items.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4" />
                        {t('moderator.orderItems')}
                      </h4>
                      <div className="space-y-2">
                        {selectedOrder.items.map((item: any) => (
                          <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                                {item.quantity}
                              </div>
                              <span className="font-medium">{item.productName}</span>
                            </div>
                            <span className="font-semibold">₼{item.totalPrice?.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 dark:bg-green-950/30">
                    <span className="text-lg font-semibold">{t('moderator.total')}</span>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">₼{selectedOrder.total?.toFixed(2)}</span>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};
