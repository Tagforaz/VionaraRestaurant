import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Package, MapPin, CheckCircle,
  ArrowLeft, Eye, History, Loader2,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import courierTrackingService from '@/services/courierTrackingService';
import { useAuth } from '@/auth';

enum OrderStatus {
  Pending = 1, Confirmed = 2, Preparing = 3, Ready = 4,
  OutForDelivery = 5, Delivered = 6, Completed = 7, Cancelled = 8, Failed = 9,
}

interface OrderItem {
  id: string; productId: string; productName: string;
  price: number; quantity: number; totalPrice: number;
}

interface OrderDetail {
  id: string; orderNumber: string; userId: string;
  courierId: string | null; courierName: string; userEmail: string;
  tableId: string | null; status: OrderStatus; type: number;
  tableNumber: number | null; subtotal: number; total: number;
  discountAmount: number; couponId: string | null;
  orderNotes: string | null; deliveryAddress: string | null;
  createdAt: string; items: OrderItem[];
  customerPhone: string | null;
}

interface OrderListItem {
  id: string; orderNumber: string; userEmail: string;
  tableNumber: number | null; total: number;
  status: OrderStatus; deliveryType: number; createdAt: string;
  courierId: string | null;
}

interface CourierDelivery {
  id: string; orderNumber: string; customerEmail: string;
  address: string | null; status: OrderStatus; total: number;
  items: OrderItem[]; createdAt: string; courierId: string | null;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7156';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Xəta baş verdi' }));
    throw new Error(err.message ?? err.title ?? `HTTP ${res.status}`);
  }
  return res.json();
}

const isCourierActive   = (s: OrderStatus) => s === OrderStatus.OutForDelivery;
const isCourierAssigned = (s: OrderStatus) => s === OrderStatus.Ready;

function getStatusLabel(status: OrderStatus): string {
  const map: Record<number, string> = {
    1: 'Gözləyir', 2: 'Təsdiqləndi', 3: 'Hazırlanır', 4: 'Təyin olunub',
    5: 'Yoldadır', 6: 'Çatdırıldı', 7: 'Tamamlandı', 8: 'Ləğv edildi', 9: 'Uğursuz',
  };
  return map[status] ?? 'Naməlum';
}

export const CourierDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [deliveries, setDeliveries]             = useState<CourierDelivery[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<CourierDelivery | null>(null);
  const [orderDetail, setOrderDetail]           = useState<OrderDetail | null>(null);
  const [detailsOpen, setDetailsOpen]           = useState(false);
  const [loading, setLoading]                   = useState(true);
  const [actionLoading, setActionLoading]       = useState<string | null>(null);
  const [courierEntityId, setCourierEntityId]   = useState<string | null>(null);
  const courierEntityIdRef = useRef<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [locationTracking, setLocationTracking] = useState(false);
  const [signalRConnected, setSignalRConnected] = useState(false);
  const [locationUpdateCount, setLocationUpdateCount] = useState(0);
  const [completedCount, setCompletedCount]     = useState(0);

  const deliveriesRef            = useRef<CourierDelivery[]>([]);
  const previousAssignedCountRef = useRef<number>(0);
  const audioRef                 = useRef<HTMLAudioElement | null>(null);
  const locationWatchIdRef       = useRef<number | null>(null);
  const trackingRecordIdRef      = useRef<string | null>(null);

  const stats = {
    assigned:  deliveries.filter(d => isCourierAssigned(d.status)).length,
    active:    deliveries.filter(d => isCourierActive(d.status)).length,
    completed: completedCount,
  };

  const fetchCourierEntityId = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data: any = await apiFetch<any>(`/api/couriers?page=1&take=100`);
      const list = Array.isArray(data) ? data : [];
      const mine = list.find((c: any) => c.userId === user.id);
      if (mine) {
        setCourierEntityId(mine.id);
        courierEntityIdRef.current = mine.id;
      }
    } catch (err) {
      console.error('Courier entity ID alınmadı:', err);
    }
  }, [user?.id]);

  const fetchDeliveries = useCallback(async () => {
    if (!user?.id) return;
    const myEntityId = courierEntityIdRef.current;

    // Kuryer entity ID hələ yüklənməyibsə gözlə
    if (!myEntityId) {
      setLoading(false);
      return;
    }

    try {
      const orders = await apiFetch<OrderListItem[]>(`/api/orders?page=1&take=100`);

      // ✅ YALNIZ bu kuryerə admin tərəfindən təyin edilmiş sifarişlər
      // courierId === myEntityId mütləq şərtdir
      // courierId olmayan (hələ admin kuryer seçməmiş) sifarişlər göstərilmir
      const courierOrders = orders.filter(o =>
        (isCourierAssigned(o.status) || isCourierActive(o.status)) &&
        o.courierId === myEntityId
      );

      // Tamamlanmış çatdırılma sifarişləri — yalnız bu kuryerə aid
      const completed = orders.filter(o =>
        (o.status === OrderStatus.Delivered || o.status === OrderStatus.Completed) &&
        o.deliveryType === 1 &&
        o.courierId === myEntityId
      );
      setCompletedCount(completed.length);

      const detailed = await Promise.all(
        courierOrders.map(async (o) => {
          try {
            const d = await apiFetch<OrderDetail>(`/api/orders/${o.id}`);
            return {
              id: d.id, orderNumber: d.orderNumber,
              customerEmail: d.userEmail, address: d.deliveryAddress,
              status: d.status, total: d.total,
              items: d.items, createdAt: d.createdAt,
              courierId: d.courierId,
            } as CourierDelivery;
          } catch {
            return {
              id: o.id, orderNumber: o.orderNumber,
              customerEmail: o.userEmail, address: null,
              status: o.status, total: o.total,
              items: [], createdAt: o.createdAt, courierId: null,
            } as CourierDelivery;
          }
        })
      );
      setDeliveries(detailed);
    } catch (err) {
      console.error('Sifarişlər yüklənərkən xəta:', err);
      toast({ title: 'Yükləmə xətası', description: 'Sifarişlər əldə edilə bilmədi', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    const init = async () => {
      await fetchCourierEntityId();
      await fetchDeliveries();
    };
    init();
    const interval = setInterval(fetchDeliveries, 30_000);
    return () => clearInterval(interval);
  }, [fetchCourierEntityId, fetchDeliveries]);

  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(setNotificationPermission);
      } else {
        setNotificationPermission(Notification.permission);
      }
    }
    audioRef.current = new Audio(
      'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDV/zPLTgjMGHm7A7+OZURE'
    );
  }, []);

  useEffect(() => {
    const assigned = deliveries.filter(d => isCourierAssigned(d.status));
    if (assigned.length > previousAssignedCountRef.current) {
      const latest = assigned[0];
      audioRef.current?.play().catch(() => {});
      toast({
        title: '🔔 Yeni çatdırılma!',
        description: `Sifariş #${latest.orderNumber} — ${latest.address ?? 'Ünvan yoxdur'}`,
        duration: 5000,
      });
      if (notificationPermission === 'granted') {
        new Notification('Yeni çatdırılma!', {
          body: `Sifariş #${latest.orderNumber}`,
          icon: '/favicon.ico',
          tag: `delivery-${latest.id}`,
          requireInteraction: true,
        });
      }
    }
    previousAssignedCountRef.current = assigned.length;
  }, [deliveries, notificationPermission]);

  useEffect(() => { deliveriesRef.current = deliveries; }, [deliveries]);

  useEffect(() => {
    if (!user?.id) return;

    const initTracking = async () => {
      try {
        await courierTrackingService.start();
        setSignalRConnected(true);
        setLocationTracking(true);
      } catch {
        setSignalRConnected(false);
        setLocationTracking(false);
        return;
      }

      if (!('geolocation' in navigator)) return;

      locationWatchIdRef.current = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const activeDelivery = deliveriesRef.current.find(d => isCourierActive(d.status));
          if (!activeDelivery) return;

          const resolvedCourierId = activeDelivery.courierId ?? courierEntityIdRef.current;
          if (!resolvedCourierId) return;

          const token = localStorage.getItem('auth_token');
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          };
          const lat = parseFloat(latitude.toFixed(6));
          const lng = parseFloat(longitude.toFixed(6));
          const estimatedDeliveryTime = new Date(Date.now() + 20 * 60_000).toISOString();

          try {
            if (trackingRecordIdRef.current) {
              await fetch(`${API_BASE}/api/deliverytrackings/${trackingRecordIdRef.current}`, {
                method: 'PUT', headers,
                body: JSON.stringify({ latitude: lat, longitude: lng, locationAddress: null, notes: null, status: 5, estimatedDeliveryTime }),
              });
            } else {
              const trackRes = await fetch(`${API_BASE}/api/deliverytrackings`, {
                method: 'POST', headers,
                body: JSON.stringify({ orderId: activeDelivery.id, courierId: resolvedCourierId, latitude: lat, longitude: lng, locationAddress: null, notes: null, status: 5, estimatedDeliveryTime }),
              });
              if (trackRes.ok) {
                const created = await trackRes.json();
                if (created?.id) trackingRecordIdRef.current = created.id;
              }
            }

            await courierTrackingService.updateLocation({
              courierId: resolvedCourierId,
              orderId: activeDelivery.id,
              latitude, longitude,
              timestamp: new Date(),
              courierName: `${(user as any)?.firstName ?? ''} ${(user as any)?.lastName ?? ''}`.trim(),
            });

            setLocationUpdateCount(prev => prev + 1);
          } catch (err) {
            console.error('GPS yeniləmə xətası:', err);
          }
        },
        (err) => console.error('Geolocation xətası:', err),
        { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 }
      );
    };

    initTracking();

    return () => {
      if (locationWatchIdRef.current !== null) navigator.geolocation.clearWatch(locationWatchIdRef.current);
      courierTrackingService.stop();
    };
  }, [user?.id, courierEntityId]);

  const handleStartDelivery = async (deliveryId: string) => {
    setActionLoading(deliveryId);
    trackingRecordIdRef.current = null;
    try {
      await apiFetch(`/api/orders/${deliveryId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: OrderStatus.OutForDelivery }),
      });
      setDeliveries(prev => prev.map(d => d.id === deliveryId ? { ...d, status: OrderStatus.OutForDelivery } : d));
      toast({ title: '🚴 Çatdırılma başladı', description: 'Uğurlu olsun!' });
    } catch (err: any) {
      toast({ title: 'Xəta', description: err.message ?? 'Başlamaq mümkün olmadı', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAsDelivered = async (deliveryId: string) => {
    setActionLoading(deliveryId);
    try {
      await apiFetch(`/api/orders/${deliveryId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: OrderStatus.Delivered }),
      });
      setDeliveries(prev => prev.filter(d => d.id !== deliveryId));
      setCompletedCount(prev => prev + 1);
      trackingRecordIdRef.current = null;
      toast({ title: '✅ Çatdırıldı', description: 'Sifariş uğurla tamamlandı!' });
    } catch (err: any) {
      toast({ title: 'Xəta', description: err.message ?? 'Tamamlamaq mümkün olmadı', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetails = async (delivery: CourierDelivery) => {
    setSelectedDelivery(delivery);
    setOrderDetail(null);
    setDetailsOpen(true);
    try {
      const detail = await apiFetch<OrderDetail>(`/api/orders/${delivery.id}`);
      setOrderDetail(detail);
    } catch {
      setOrderDetail(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="hover:bg-accent">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{t('courier.panel')}</h1>
          <p className="text-muted-foreground">{t('courier.manageDeliveries')}</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className={signalRConnected ? 'text-blue-600 border-blue-600' : 'text-red-600 border-red-600'}>
            <div className={`w-2 h-2 rounded-full mr-2 ${signalRConnected ? 'bg-blue-600 animate-pulse' : 'bg-red-600'}`} />
            {signalRConnected ? 'SignalR Qoşulu' : 'SignalR Kəsilib'}
          </Badge>
          {locationTracking && (
            <Badge variant="outline" className="text-green-600 border-green-600">
              <div className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse" />
              GPS Aktiv {locationUpdateCount > 0 && `(${locationUpdateCount})`}
            </Badge>
          )}
        </div>
        <Button onClick={() => navigate('/courier/history')} variant="outline">
          <History className="h-4 w-4 mr-2" />
          {t('courier.myHistory')}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: t('courier.assigned'),       value: stats.assigned,  icon: <Package     className="h-4 w-4 text-amber-600" />, sub: t('courier.assignedDeliveries') },
          { label: t('courier.activeStatus'),   value: stats.active,    icon: <MapPin      className="h-4 w-4 text-blue-600"  />, sub: t('courier.onTheWay')           },
          { label: t('courier.completedToday'), value: stats.completed, icon: <CheckCircle className="h-4 w-4 text-green-600" />, sub: t('courier.todayShort')          },
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('courier.activeDeliveries')}</CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchDeliveries} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '↻ Yenilə'}
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : deliveries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('courier.noActiveDeliveries')}
            </div>
          ) : (
            <div className="space-y-4">
              {deliveries.map(delivery => (
                <Card key={delivery.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-lg">#{delivery.orderNumber}</p>
                          <Badge className={isCourierActive(delivery.status) ? 'bg-blue-600' : 'bg-amber-600'}>
                            {getStatusLabel(delivery.status)}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="font-medium">{delivery.customerEmail}</p>
                          {delivery.address && (
                            <p className="text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />{delivery.address}
                            </p>
                          )}
                          <p className="font-bold text-green-600">₼{delivery.total.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(delivery)}>
                          <Eye className="h-4 w-4 mr-1" />
                          {t('courier.viewDetails')}
                        </Button>
                        {isCourierAssigned(delivery.status) ? (
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700"
                            disabled={actionLoading === delivery.id}
                            onClick={() => handleStartDelivery(delivery.id)}>
                            {actionLoading === delivery.id ? <Loader2 className="h-4 w-4 animate-spin" /> : t('courier.startDelivery')}
                          </Button>
                        ) : (
                          <Button size="sm" className="bg-green-600 hover:bg-green-700"
                            disabled={actionLoading === delivery.id}
                            onClick={() => handleMarkAsDelivered(delivery.id)}>
                            {actionLoading === delivery.id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <><CheckCircle className="h-4 w-4 mr-1" />{t('courier.markDelivered')}</>}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('courier.orderDetails')}</DialogTitle>
            <DialogDescription>Sifariş #{orderDetail?.orderNumber ?? selectedDelivery?.orderNumber}</DialogDescription>
          </DialogHeader>
          {!orderDetail ? (
            <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">{t('courier.customerInfo')}</h3>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">Email:</span> {orderDetail.userEmail}</p>
                  {orderDetail.customerPhone && (
                    <p><span className="font-medium">Telefon:</span> <a href={`tel:${orderDetail.customerPhone}`} className="text-blue-500 hover:underline">{orderDetail.customerPhone}</a></p>
                  )}
                  {orderDetail.deliveryAddress && (
                    <p><span className="font-medium">{t('courier.address')}:</span> {orderDetail.deliveryAddress}</p>
                  )}
                  {orderDetail.orderNotes && (
                    <p><span className="font-medium">Qeyd:</span> {orderDetail.orderNotes}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">{t('courier.orderItems')}</h3>
                <div className="text-sm space-y-1">
                  {orderDetail.items.map(item => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.quantity}× {item.productName}</span>
                      <span className="font-medium">₼{item.totalPrice.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t pt-3 space-y-1 text-sm">
                {orderDetail.discountAmount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Endirim:</span><span>-₼{orderDetail.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold">
                  <span>{t('courier.orderTotal')}:</span><span>₼{orderDetail.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};