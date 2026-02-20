import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Package, Bike, Check, ArrowLeft, Loader2, RefreshCw, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CustomerLayout } from '@/layouts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import courierTrackingService, { CourierLocationDto, CourierAssignedDto } from '@/services/courierTrackingService';
import orderStatusService, { OrderStatusUpdateDto } from '@/services/orderStatusService';
import { toast } from 'sonner';
import { ReviewModal } from '@/components/ReviewModal';

// Leaflet — CDN-dən yüklənir, npm lazım deyil
declare global {
  interface Window {
    L: any;
  }
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7156';

const ORDER_STATUS_LABELS: Record<number, string> = {
  1: 'Gözləyir', 2: 'Təsdiqləndi', 3: 'Hazırlanır', 4: 'Hazırdır',
  5: 'Yoldadır', 6: 'Çatdırıldı', 7: 'Tamamlandı', 8: 'Ləğv edildi', 9: 'Uğursuz',
};

const ORDER_STATUS_COLORS: Record<number, string> = {
  1: 'bg-yellow-500', 2: 'bg-blue-500', 3: 'bg-orange-500', 4: 'bg-purple-500',
  5: 'bg-cyan-500', 6: 'bg-green-500', 7: 'bg-green-700', 8: 'bg-red-500', 9: 'bg-red-700',
};

const STATUS_STEPS = [
  { status: 2, label: 'Təsdiqləndi' },
  { status: 3, label: 'Hazırlanır' },
  { status: 4, label: 'Hazırdır' },
  { status: 5, label: 'Yoldadır' },
  { status: 6, label: 'Çatdırıldı' },
];

interface OrderItem {
  id: string; productId: string; productName: string;
  price: number; quantity: number; totalPrice: number;
}

interface OrderDetail {
  id: string; orderNumber: string; userId: string;
  courierId: string | null; courierName: string | null; userEmail: string;
  tableId: string | null; status: number; type: number;
  tableNumber: number | null; subtotal: number; total: number;
  discountAmount: number; couponId: string | null; orderNotes: string | null;
  deliveryAddress: string | null; createdAt: string; items: OrderItem[];
  // ✅ Çatdırılma koordinatları
  deliveryLatitude: number | null;
  deliveryLongitude: number | null;
}

interface CourierInfo {
  id: string; userId: string; userFullName: string;
  imageUrl: string | null; status: number; isAvailable: boolean;
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

// Leaflet CSS + JS-ni dinamik yüklə
function useLeaflet(onReady: () => void) {
  useEffect(() => {
    if (window.L) { onReady(); return; }

    // CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = onReady;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(script);
    };
  }, []);
}

// ─── Xəritə komponenti ────────────────────────────────────────────────────────
function CourierLiveMap({
  location,
  deliveryAddress,
  destLat,
  destLng,
}: {
  location: CourierLocationDto | null;
  deliveryAddress: string | null;
  destLat: number | null;
  destLng: number | null;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [leafletReady, setLeafletReady] = useState(!!window.L);

  useLeaflet(() => setLeafletReady(true));

  // Xəritəni ilk dəfə qur
  useEffect(() => {
    if (!leafletReady || !mapRef.current || mapInstanceRef.current) return;

    const L = window.L;

    // Default başlanğıc nöqtəsi — Bakı mərkəzi
    const initialLat = location ? Number(location.latitude) : 40.4093;
    const initialLng = location ? Number(location.longitude) : 49.8671;

    const map = L.map(mapRef.current, { zoomControl: true }).setView([initialLat, initialLng], 14);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);

    // Kuryer markeri — mavi motosiklet ikonu
    if (location) {
      const courierIcon = L.divIcon({
        html: `
          <div style="
            background: #f97316;
            border: 3px solid white;
            border-radius: 50%;
            width: 44px; height: 44px;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            font-size: 22px;
          ">🛵</div>
        `,
        className: '',
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      markerRef.current = L.marker(
        [Number(location.latitude), Number(location.longitude)],
        { icon: courierIcon }
      )
        .addTo(map)
        .bindPopup('<b>Kuryer yoldadır</b>')
        .openPopup();
    }

    // ✅ Çatdırılma ünvanı markeri — backend-dən gələn real koordinatlar
    if (destLat && destLng) {
      const destIcon = L.divIcon({
        html: `
          <div style="
            background: #22c55e;
            border: 3px solid white;
            border-radius: 50%;
            width: 40px; height: 40px;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            font-size: 20px;
          ">🏠</div>
        `,
        className: '',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });

      L.marker([destLat, destLng], { icon: destIcon })
        .addTo(map)
        .bindPopup(`<b>Çatdırılma ünvanı</b><br/>${deliveryAddress ?? ''}`);

      // Hər iki markeri göstərən bounds qur
      if (location) {
        const bounds = L.latLngBounds(
          [Number(location.latitude), Number(location.longitude)],
          [destLat, destLng]
        );
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    }
  }, [leafletReady, destLat, destLng]);

  // Kuryer hərəkət edəndə markeri yenilə
  useEffect(() => {
    if (!mapInstanceRef.current || !location) return;
    const L = window.L;
    const lat = Number(location.latitude);
    const lng = Number(location.longitude);

    if (markerRef.current) {
      // Mövcud markeri yeni mövqeyə sürüşdür
      markerRef.current.setLatLng([lat, lng]);
    } else {
      // Marker hələ yoxdur, yarat
      const courierIcon = L.divIcon({
        html: `
          <div style="
            background: #f97316;
            border: 3px solid white;
            border-radius: 50%;
            width: 44px; height: 44px;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            font-size: 22px;
          ">🛵</div>
        `,
        className: '',
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });
      markerRef.current = L.marker([lat, lng], { icon: courierIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup('<b>Kuryer yoldadır</b>')
        .openPopup();
    }

    // Xəritəni kuryerə keçir (smooth)
    mapInstanceRef.current.panTo([lat, lng], { animate: true, duration: 0.8 });
  }, [location]);

  // Unmount-da xəritəni məhv et
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="space-y-2">
      <div
        ref={mapRef}
        style={{ height: '320px', borderRadius: '12px', overflow: 'hidden', zIndex: 0 }}
        className="border"
      />
      {location && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>📍 {Number(location.latitude).toFixed(5)}, {Number(location.longitude).toFixed(5)}</span>
          <span>Son yenilənmə: {new Date(location.timestamp).toLocaleTimeString('az-AZ')}</span>
        </div>
      )}
    </div>
  );
}

// ─── Əsas səhifə ──────────────────────────────────────────────────────────────
export default function OrderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [courierInfo, setCourierInfo] = useState<CourierInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courierLocation, setCourierLocation] = useState<CourierLocationDto | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      setError(null);
      const data = await apiFetch<OrderDetail>(`/api/orders/${orderId}`);
      setOrder(data);
      if (data.courierId) {
        try {
          const couriers = await apiFetch<any>(`/api/couriers?page=1&take=100`);
          const list = Array.isArray(couriers) ? couriers : couriers?.data ?? [];
          const found = list.find((c: CourierInfo) => c.id === data.courierId);
          if (found) setCourierInfo(found);
        } catch {}
      }
    } catch {
      setError('Sifariş tapılmadı');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  useEffect(() => {
    if (!orderId) return;

    const initSignalR = async () => {
      try {
        await Promise.all([orderStatusService.start(), courierTrackingService.start()]);
        setIsConnected(true);

        orderStatusService.on('OrderStatusChanged', (update: OrderStatusUpdateDto) => {
          if (update.orderId === orderId) {
            setOrder(prev => prev ? { ...prev, status: update.status } : prev);
            toast.success(update.message || `Status: ${ORDER_STATUS_LABELS[update.status] ?? 'Naməlum'}`);
          }
        });

        courierTrackingService.on('CourierAssigned', (data: CourierAssignedDto) => {
          if (data.orderId === orderId) {
            toast.success(`Kuryer təyin edildi: ${data.courierName}`);
            setEstimatedMinutes(20);
            fetchOrder();
          }
        });

        courierTrackingService.on('CourierLocationUpdated', (location: CourierLocationDto) => {
          if (location.orderId === orderId) {
            setCourierLocation(location);
          }
        });

        await Promise.all([
          orderStatusService.subscribeToOrder(orderId),
          courierTrackingService.trackOrder(orderId),
        ]);
      } catch (err) {
        console.error('SignalR xətası:', err);
        setIsConnected(false);
      }
    };

    initSignalR();

    return () => {
      orderStatusService.unsubscribeFromOrder(orderId).catch(() => {});
      courierTrackingService.stopTrackingOrder(orderId).catch(() => {});
      orderStatusService.off('OrderStatusChanged');
      courierTrackingService.off('CourierAssigned');
      courierTrackingService.off('CourierLocationUpdated');
      orderStatusService.stop();
      courierTrackingService.stop();
    };
  }, [orderId, fetchOrder]);

  const getStatusStepIndex = (status: number) => STATUS_STEPS.findIndex(s => s.status === status);

  const getEstimatedTimeText = () => {
    if (estimatedMinutes !== null) return estimatedMinutes > 0 ? `~${estimatedMinutes} dəq` : 'Çatır...';
    if (order?.status === 5) return '~20 dəq';
    if (order?.status === 6) return 'Çatdırıldı';
    return null;
  };

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' });

  const isDelivery = order?.type === 1;

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      </CustomerLayout>
    );
  }

  if (error || !order) {
    return (
      <CustomerLayout>
        <div className="container max-w-2xl py-16 text-center space-y-4">
          <Package className="h-16 w-16 mx-auto text-muted-foreground opacity-40" />
          <h2 className="text-2xl font-bold">Sifariş tapılmadı</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => navigate(-1)}><ArrowLeft className="mr-2 h-4 w-4" />Geri qayıt</Button>
        </div>
      </CustomerLayout>
    );
  }

  const currentStepIndex = getStatusStepIndex(order.status);
  const etaText = getEstimatedTimeText();

  return (
    <CustomerLayout>
      <div className="container max-w-6xl py-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />Geri
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">

          {/* ── Sol: Tracking ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <CardTitle className="text-2xl">Sifariş İzləmə</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Sifariş #{order.orderNumber}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${ORDER_STATUS_COLORS[order.status] ?? 'bg-gray-500'} text-white text-sm px-3 py-1`}>
                      {ORDER_STATUS_LABELS[order.status] ?? 'Naməlum'}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={fetchOrder}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    {order.status === 7 && (
                      <Button size="sm" variant="outline" onClick={() => setReviewOpen(true)}
                        className="border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950">
                        <Star className="h-4 w-4 mr-1 fill-amber-400 text-amber-400" />Rəy Yaz
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              {isDelivery && etaText && (
                <CardContent>
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Təxmini gəliş vaxtı</p>
                        <p className="text-2xl font-bold text-primary">{etaText}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Progress Steps */}
            <Card>
              <CardHeader><CardTitle>Sifariş Prosesi</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {STATUS_STEPS.map((step, index) => {
                    const isCompleted = index < currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    const isPending = index > currentStepIndex;
                    return (
                      <div key={step.status} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                            isCompleted ? 'bg-green-500 text-white' :
                            isCurrent ? 'bg-primary text-primary-foreground' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {isCompleted ? <Check className="h-5 w-5" /> : <span className="text-sm font-semibold">{index + 1}</span>}
                          </div>
                          {index < STATUS_STEPS.length - 1 && (
                            <div className={`h-12 w-0.5 transition-all ${isCompleted ? 'bg-green-500' : 'bg-muted'}`} />
                          )}
                        </div>
                        <div className="flex-1 pt-2 pb-6">
                          <p className={`font-medium ${isCurrent ? 'text-primary' : isPending ? 'text-muted-foreground' : ''}`}>
                            {step.label}
                          </p>
                          {isCurrent && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {formatTime(order.createdAt)} · Cari status
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* ── Canlı Xəritə ── */}
            {isDelivery && order.status === 5 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>🗺️ Canlı İzləmə</CardTitle>
                    <Badge
                      variant="outline"
                      className={isConnected ? 'text-green-600 border-green-600' : 'text-red-600 border-red-600'}
                    >
                      <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-600 animate-pulse' : 'bg-red-600'}`} />
                      {isConnected ? 'Qoşulu' : 'Kəsilib'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {courierLocation ? (
                    <CourierLiveMap
                      location={courierLocation}
                      deliveryAddress={order.deliveryAddress}
                      destLat={order.deliveryLatitude ?? null}
                      destLng={order.deliveryLongitude ?? null}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 bg-muted rounded-xl gap-3 text-muted-foreground">
                      <MapPin className="h-10 w-10 animate-pulse" />
                      <p className="text-sm">
                        {isConnected ? 'Kuryer məlumatı gözlənilir...' : 'Xəritə yüklənir...'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── Sağ: Sidebar ── */}
          <div className="space-y-6">

            {/* Courier Info */}
            {isDelivery && (courierInfo || order.courierName) && (
              <Card>
                <CardHeader><CardTitle>Kuryer</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={courierInfo?.imageUrl || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                        {(courierInfo?.userFullName || order.courierName || 'K').charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{courierInfo?.userFullName || order.courierName || 'Kuryer'}</p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Bike className="h-3 w-3" />
                        <span>{courierInfo?.isAvailable === false ? 'Çatdırımda' : 'Aktiv'}</span>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <p className="text-xs text-center text-muted-foreground">Kuryer sizi tezliklə zəng edə bilər</p>
                </CardContent>
              </Card>
            )}

            {/* Delivery Address */}
            {isDelivery && order.deliveryAddress && (
              <Card>
                <CardHeader><CardTitle>Çatdırılma Ünvanı</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-sm">{order.deliveryAddress}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Notes */}
            {order.orderNotes && (
              <Card>
                <CardHeader><CardTitle>Qeyd</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{order.orderNotes}</p>
                </CardContent>
              </Card>
            )}

            {/* Order Summary */}
            <Card>
              <CardHeader><CardTitle>Sifariş Xülasəsi</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {order.items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.quantity}× {item.productName}</span>
                      <span className="font-medium">₼{item.totalPrice.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Arakəsmə:</span><span>₼{order.subtotal.toFixed(2)}</span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Endirim:</span><span>-₼{order.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Cəmi:</span><span>₼{order.total.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Sifariş vaxtı:</span><span>{formatTime(order.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sifariş #:</span>
                    <span className="font-mono text-xs">{order.orderNumber}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ReviewModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        orderId={order?.id ?? null}
        orderNumber={order?.orderNumber ?? null}
        items={order?.items?.map(i => ({ productId: i.productId, productName: i.productName })) ?? []}
      />
    </CustomerLayout>
  );
}