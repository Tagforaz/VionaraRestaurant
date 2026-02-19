import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Package, MapPin, CheckCircle, DollarSign, ArrowLeft, Eye, History, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import courierTrackingService from '@/services/courierTrackingService';
import { useAuth } from '@/auth';

// ─────────────────────────────────────────────
// Types — backend DTO-larına uyğun
// ─────────────────────────────────────────────

// OrderStatus enum (backend ilə eyni sıra)
enum OrderStatus {
  Pending = 1,
  Confirmed = 2,
  Preparing = 3,
  Ready = 4,
  OutForDelivery = 5,
  Delivered = 6,
  Completed = 7,
  Cancelled = 8,
  Failed = 9,
}

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  totalPrice: number;
}

// GET /api/orders/{id} cavabı
interface OrderDetail {
  id: string;
  orderNumber: string;
  userId: string;
  courierId: string | null;
  courierName: string;
  userEmail: string;
  tableId: string | null;
  status: OrderStatus;
  type: number; // DeliveryType enum
  tableNumber: number | null;
  subtotal: number;
  total: number;
  discountAmount: number;
  couponId: string | null;
  orderNotes: string | null;
  deliveryAddress: string | null;
  createdAt: string;
  items: OrderItem[];
}

// GET /api/orders (list item)
interface OrderListItem {
  id: string;
  orderNumber: string;
  userEmail: string;
  tableNumber: number | null;
  total: number;
  status: OrderStatus;
  deliveryType: number;
  createdAt: string;
}

// Courier üçün assign edilmiş sifarişlər
// (backend'dən gəlir: status = OutForDelivery və courierId = currentUser.courierId)
interface CourierDelivery {
  id: string;
  orderNumber: string;
  customerEmail: string;
  address: string | null;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  createdAt: string;
}

// ─────────────────────────────────────────────
// API Base URL — öz backend URL-nizi yazın
// ─────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7156';

// ─────────────────────────────────────────────
// API helper
// ─────────────────────────────────────────────
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token'); // JWT token
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Xəta baş verdi' }));
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }

  return res.json();
}

// ─────────────────────────────────────────────
// Status helpers
// ─────────────────────────────────────────────
function isCourierActive(status: OrderStatus) {
  return status === OrderStatus.OutForDelivery;
}

function isCourierAssigned(status: OrderStatus) {
  // Backend-də courier assign olduqda status Ready olur,
  // sonra courier "Başla" düyməsini bassın → OutForDelivery
  return status === OrderStatus.Ready;
}

function getStatusLabel(status: OrderStatus): string {
  const map: Record<number, string> = {
    [OrderStatus.Pending]: 'Gözləyir',
    [OrderStatus.Confirmed]: 'Təsdiqləndi',
    [OrderStatus.Preparing]: 'Hazırlanır',
    [OrderStatus.Ready]: 'Təyin olunub',
    [OrderStatus.OutForDelivery]: 'Yoldadır',
    [OrderStatus.Delivered]: 'Çatdırıldı',
    [OrderStatus.Completed]: 'Tamamlandı',
    [OrderStatus.Cancelled]: 'Ləğv edildi',
    [OrderStatus.Failed]: 'Uğursuz',
  };
  return map[status] ?? 'Naməlum';
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
export const CourierDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [deliveries, setDeliveries] = useState<CourierDelivery[]>([]);
  const deliveriesRef = useRef<CourierDelivery[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<CourierDelivery | null>(null);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const previousAssignedCountRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [locationTracking, setLocationTracking] = useState(false);
  const [signalRConnected, setSignalRConnected] = useState(false);
  const [locationUpdateCount, setLocationUpdateCount] = useState(0);
  const locationWatchIdRef = useRef<number | null>(null);

  // ── Stats (real sifarişlərdən hesablanır) ──
  const stats = {
    assigned: deliveries.filter(d => isCourierAssigned(d.status)).length,
    active: deliveries.filter(d => isCourierActive(d.status)).length,
    // Tamamlanmış sifarişlər üçün ayrı endpoint lazım ola bilər
    // Hələlik local saxlayırıq
    completed: 0,
    // Gəlir: tamamlanmış sifarişlər üçün — bu da ayrıca endpoint tələb edir
    earnings: 0,
  };

  // ─────────────────────────────────────────
  // Sifarişləri backend-dən çək
  // Courier-ə aid sifarişlər: status = Ready (assigned) VƏ OutForDelivery (active)
  // ─────────────────────────────────────────
  const fetchDeliveries = useCallback(async () => {
    if (!user?.id) return;
    try {
      // Backend-dən bütün sifarişləri çəkib courier ID ilə filtirləyirik
      // İdeal olaraq backend-də GET /api/orders?courierId={id} endpoint olsa daha yaxşıdır
      const orders = await apiFetch<OrderListItem[]>(
        `/api/orders?page=1&take=50`
      );

      // Courier-ə aid olanları filter edirik (status: Ready = assigned, OutForDelivery = active)
      // NOT: Backend-dən gələn listdə courierId olmadığı üçün detail-ə baxmaq lazımdır.
      // Əgər backend-də courierId varsa aşağıdakı filtri aktivləşdirin:
      // const courierOrders = orders.filter(o =>
      //   isCourierAssigned(o.status) || isCourierActive(o.status)
      // );

      // Detail olmadan sadəcə status-a görə filter edirik
      const courierOrders = orders.filter(
        o => isCourierAssigned(o.status) || isCourierActive(o.status)
      );

      // Detail məlumatları gətirib items əldə edirik
      const detailed = await Promise.all(
        courierOrders.map(async (o) => {
          try {
            const detail = await apiFetch<OrderDetail>(`/api/orders/${o.id}`);
            return {
              id: detail.id,
              orderNumber: detail.orderNumber,
              customerEmail: detail.userEmail,
              address: detail.deliveryAddress,
              status: detail.status,
              total: detail.total,
              items: detail.items,
              createdAt: detail.createdAt,
            } as CourierDelivery;
          } catch {
            // Detail gəlməzsə list item-dən istifadə edirik
            return {
              id: o.id,
              orderNumber: o.orderNumber,
              customerEmail: o.userEmail,
              address: null,
              status: o.status,
              total: o.total,
              items: [],
              createdAt: o.createdAt,
            } as CourierDelivery;
          }
        })
      );

      setDeliveries(detailed);
    } catch (error) {
      console.error('Sifarişlər yüklənərkən xəta:', error);
      toast({
        title: 'Yükləmə xətası',
        description: 'Sifarişlər əldə edilə bilmədi',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // ─────────────────────────────────────────
  // İlk yükləmə + hər 30 saniyədə bir yenilə
  // ─────────────────────────────────────────
  useEffect(() => {
    fetchDeliveries();
    const interval = setInterval(fetchDeliveries, 30_000);
    return () => clearInterval(interval);
  }, [fetchDeliveries]);

  // ─────────────────────────────────────────
  // Notification permission + audio
  // ─────────────────────────────────────────
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(setNotificationPermission);
    } else if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
    audioRef.current = new Audio(
      'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDV/zPLTgjMGHm7A7+OZURE'
    );
  }, []);

  // ─────────────────────────────────────────
  // Yeni sifariş bildirişi izlə
  // ─────────────────────────────────────────
  useEffect(() => {
    const assignedDeliveries = deliveries.filter(d => isCourierAssigned(d.status));
    const currentCount = assignedDeliveries.length;

    if (currentCount > previousAssignedCountRef.current) {
      const latest = assignedDeliveries[0];
      audioRef.current?.play().catch(() => {});
      toast({
        title: '🔔 Yeni çatdırılma!',
        description: `Sifariş #${latest.orderNumber} - ${latest.address ?? 'Ünvan yoxdur'}`,
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
    previousAssignedCountRef.current = currentCount;
  }, [deliveries, notificationPermission]);

  // deliveriesRef-i sync saxla
  useEffect(() => { deliveriesRef.current = deliveries; }, [deliveries]);

  // SignalR + GPS tracking
  useEffect(() => {
    const initTracking = async () => {
      try {
        await courierTrackingService.start();
        setSignalRConnected(true);
        setLocationTracking(true);

        if ('geolocation' in navigator) {
          locationWatchIdRef.current = navigator.geolocation.watchPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              const activeDelivery = deliveriesRef.current.find(d => isCourierActive(d.status));

              // Yalnız aktiv çatdırılma varsa GPS göndər
              if (!activeDelivery) return;

              try {
                await apiFetch('/api/deliverytrackings', {
                  method: 'POST',
                  body: JSON.stringify({
                    orderId: activeDelivery.id,
                    courierId: user?.id ?? '',
                    latitude: latitude,
                    longitude: longitude,
                    locationAddress: null,
                    notes: null,
                    status: 5, // OutForDelivery enum dəyəri
                    estimatedDeliveryTime: new Date(Date.now() + 20 * 60_000).toISOString(),
                  }),
                });

                await courierTrackingService.updateLocation({
                  courierId: user?.id ?? '',
                  orderId: activeDelivery.id,
                  latitude,
                  longitude,
                  timestamp: new Date(),
                  courierName: `${user?.firstName ?? ''} ${user?.lastName ?? ''}`,
                });

                setLocationUpdateCount(prev => prev + 1);
              } catch (error) {
                console.error('GPS yeniləmə xətası:', error);
              }
            },
            (error) => {
              console.error('Geolocation error:', error);
              toast({
                title: 'GPS xətası',
                description: 'Konum əldə edilə bilmədi',
                variant: 'destructive',
              });
            },
            { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 }
          );
        }
      } catch (error) {
        console.error('SignalR xətası:', error);
        setSignalRConnected(false);
        setLocationTracking(false);
        toast({
          title: 'Qoşulma xətası',
          description: 'SignalR serverə qoşula bilmədi',
          variant: 'destructive',
        });
      }
    };

    if (user?.id) initTracking();

    return () => {
      if (locationWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(locationWatchIdRef.current);
      }
      courierTrackingService.stop();
    };
  }, [user?.id]); // deliveries artıq dependency deyil

  // ─────────────────────────────────────────
  // Çatdırılmağa başla → PUT /api/orders/{id}
  // Status: Ready (4) → OutForDelivery (5)
  // ─────────────────────────────────────────
  const handleStartDelivery = async (deliveryId: string) => {
    setActionLoading(deliveryId);
    try {
      await apiFetch(`/api/orders/${deliveryId}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: OrderStatus.OutForDelivery, // 5
          courierId: user?.id ?? null,
        }),
      });

      setDeliveries(prev =>
        prev.map(d =>
          d.id === deliveryId ? { ...d, status: OrderStatus.OutForDelivery } : d
        )
      );
      toast({ title: '🚴 Çatdırılma başladı', description: 'Uğurlu olsun!' });
    } catch (error: any) {
      toast({
        title: 'Xəta',
        description: error.message ?? 'Başlamaq mümkün olmadı',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  // ─────────────────────────────────────────
  // Çatdırıldı → PUT /api/orders/{id}
  // Status: OutForDelivery (5) → Delivered (6)
  // ─────────────────────────────────────────
  const handleMarkAsDelivered = async (deliveryId: string) => {
    setActionLoading(deliveryId);
    try {
      await apiFetch(`/api/orders/${deliveryId}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: OrderStatus.Delivered, // 6
          courierId: user?.id ?? null,
        }),
      });

      setDeliveries(prev => prev.filter(d => d.id !== deliveryId));
      toast({ title: '✅ Çatdırıldı', description: 'Sifariş uğurla tamamlandı!' });
    } catch (error: any) {
      toast({
        title: 'Xəta',
        description: error.message ?? 'Tamamlamaq mümkün olmadı',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  // ─────────────────────────────────────────
  // Ətraflı bax → GET /api/orders/{id}
  // ─────────────────────────────────────────
  const handleViewDetails = async (delivery: CourierDelivery) => {
    setSelectedDelivery(delivery);
    setDetailsOpen(true);
    try {
      const detail = await apiFetch<OrderDetail>(`/api/orders/${delivery.id}`);
      setOrderDetail(detail);
    } catch {
      setOrderDetail(null);
    }
  };

  // ─────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="hover:bg-accent">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{t('courier.panel')}</h1>
          <p className="text-muted-foreground">{t('courier.manageDeliveries')}</p>
        </div>

        {/* Connection badges */}
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

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('courier.assigned')}</CardTitle>
            <Package className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assigned}</div>
            <p className="text-xs text-muted-foreground">{t('courier.assignedDeliveries')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('courier.activeStatus')}</CardTitle>
            <MapPin className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">{t('courier.onTheWay')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('courier.completedToday')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">{t('courier.todayShort')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('courier.earnings')}</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₼{stats.earnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{t('courier.todayShort')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Deliveries */}
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
                          <Badge
                            className={
                              isCourierActive(delivery.status)
                                ? 'bg-blue-600'
                                : 'bg-amber-600'
                            }
                          >
                            {getStatusLabel(delivery.status)}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="font-medium">{delivery.customerEmail}</p>
                          {delivery.address && (
                            <p className="text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {delivery.address}
                            </p>
                          )}
                          <p className="font-bold text-green-600">
                            ₼{delivery.total.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(delivery)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {t('courier.viewDetails')}
                        </Button>

                        {isCourierAssigned(delivery.status) ? (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={actionLoading === delivery.id}
                            onClick={() => handleStartDelivery(delivery.id)}
                          >
                            {actionLoading === delivery.id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : t('courier.startDelivery')}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            disabled={actionLoading === delivery.id}
                            onClick={() => handleMarkAsDelivered(delivery.id)}
                          >
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

      {/* Order Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('courier.orderDetails')}</DialogTitle>
            <DialogDescription>
              Sifariş #{orderDetail?.orderNumber ?? selectedDelivery?.orderNumber}
            </DialogDescription>
          </DialogHeader>

          {!orderDetail && (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {orderDetail && (
            <div className="space-y-4">
              {/* Müştəri məlumatları */}
              <div className="space-y-2">
                <h3 className="font-semibold">{t('courier.customerInfo')}</h3>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="font-medium">Email:</span> {orderDetail.userEmail}
                  </p>
                  {orderDetail.deliveryAddress && (
                    <p>
                      <span className="font-medium">{t('courier.address')}:</span>{' '}
                      {orderDetail.deliveryAddress}
                    </p>
                  )}
                  {orderDetail.orderNotes && (
                    <p>
                      <span className="font-medium">Qeyd:</span> {orderDetail.orderNotes}
                    </p>
                  )}
                </div>
              </div>

              {/* Məhsullar */}
              <div className="space-y-2">
                <h3 className="font-semibold">{t('courier.orderItems')}</h3>
                <div className="text-sm space-y-1">
                  {orderDetail.items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>
                        {item.quantity}× {item.productName}
                      </span>
                      <span className="font-medium">₼{item.totalPrice.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Məbləğlər */}
              <div className="border-t pt-3 space-y-1 text-sm">
                {orderDetail.discountAmount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Endirim:</span>
                    <span>-₼{orderDetail.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold">
                  <span>{t('courier.orderTotal')}:</span>
                  <span>₼{orderDetail.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};