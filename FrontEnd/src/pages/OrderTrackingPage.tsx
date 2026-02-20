import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Phone, Clock, Package, Bike, Check, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
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

// ─── Types ────────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7156';

// Backend OrderStatus enum
const ORDER_STATUS_LABELS: Record<number, string> = {
  1: 'Gözləyir',
  2: 'Təsdiqləndi',
  3: 'Hazırlanır',
  4: 'Hazırdır',
  5: 'Yoldadır',
  6: 'Çatdırıldı',
  7: 'Tamamlandı',
  8: 'Ləğv edildi',
  9: 'Uğursuz',
};

const ORDER_STATUS_COLORS: Record<number, string> = {
  1: 'bg-yellow-500',
  2: 'bg-blue-500',
  3: 'bg-orange-500',
  4: 'bg-purple-500',
  5: 'bg-cyan-500',
  6: 'bg-green-500',
  7: 'bg-green-700',
  8: 'bg-red-500',
  9: 'bg-red-700',
};

// Progress steps — backend enum value-ları
const STATUS_STEPS = [
  { status: 2, label: 'Təsdiqləndi' },
  { status: 3, label: 'Hazırlanır' },
  { status: 4, label: 'Hazırdır' },
  { status: 5, label: 'Yoldadır' },
  { status: 6, label: 'Çatdırıldı' },
];

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  totalPrice: number;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  userId: string;
  courierId: string | null;
  courierName: string | null;
  userEmail: string;
  tableId: string | null;
  status: number;
  type: number; // DeliveryType: 1=Delivery, 2=Takeout, 3=DineIn
  tableNumber: number | null;
  subtotal: number;
  total: number;
  discountAmount: number;
  couponId: string | null;
  orderNotes: string | null;
  deliveryAddress: string | null;
  createdAt: string;
  items: OrderItem[];
  deliveredAt: string | null;
  pickedUpAt: string | null;
  assignedAt: string | null;
}

interface CourierInfo {
  id: string;
  userId: string;
  userFullName: string;
  imageUrl: string | null;
  status: number;
  isAvailable: boolean;
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

// ─── Component ────────────────────────────────────────────────────────────────
export default function OrderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [order, setOrder]                   = useState<OrderDetail | null>(null);
  const [courierInfo, setCourierInfo]       = useState<CourierInfo | null>(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [currentTime, setCurrentTime]       = useState(new Date());
  const [courierLocation, setCourierLocation] = useState<CourierLocationDto | null>(null);
  const [isConnected, setIsConnected]       = useState(false);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | null>(null);

  // ── Fetch order ──────────────────────────────────────────────────────────────
  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      setError(null);
      const data = await apiFetch<OrderDetail>(`/api/orders/${orderId}`);
      setOrder(data);

      // Courier məlumatlarını əldə et
      if (data.courierId) {
        try {
          const couriers = await apiFetch<CourierInfo[]>(`/api/couriers?page=1&take=100`);
          const found = couriers.find((c: CourierInfo) => c.id === data.courierId);
          if (found) setCourierInfo(found);
        } catch {
          // Courier məlumatı alınmadı, ignore
        }
      }
    } catch (err: any) {
      setError('Sifariş tapılmadı');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // ── Timer ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10_000);
    return () => clearInterval(timer);
  }, []);

  // ── SignalR ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!orderId) return;

    const initSignalR = async () => {
      try {
        await Promise.all([
          orderStatusService.start(),
          courierTrackingService.start(),
        ]);
        setIsConnected(true);

        // Sifariş status dəyişikliyi
        orderStatusService.on('OrderStatusChanged', (update: OrderStatusUpdateDto) => {
          if (update.orderId === orderId) {
            setOrder(prev => prev ? { ...prev, status: update.status } : prev);
            toast.success(
              update.message || `Status: ${ORDER_STATUS_LABELS[update.status] ?? 'Naməlum'}`
            );
          }
        });

        // Kuryer assign edildi
        courierTrackingService.on('CourierAssigned', (data: CourierAssignedDto) => {
          if (data.orderId === orderId) {
            toast.success(`Kuryer təyin edildi: ${data.courierName}`);
            setEstimatedMinutes(20);
            fetchOrder(); // order-i yenilə ki courierId gəlsin
          }
        });

        // Kuryer location yeniləməsi
        courierTrackingService.on('CourierLocationUpdated', (location: CourierLocationDto) => {
          if (location.orderId === orderId) {
            setCourierLocation(location);
          }
        });

        // Subscribe et
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

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const getStatusStepIndex = (status: number) => {
    return STATUS_STEPS.findIndex(s => s.status === status);
  };

  const getEstimatedTimeText = () => {
    if (estimatedMinutes !== null) {
      return estimatedMinutes > 0 ? `~${estimatedMinutes} dəq` : 'Çatır...';
    }
    if (order?.status === 5) return '~20 dəq'; // OutForDelivery
    if (order?.status === 6) return 'Çatdırıldı';
    return null;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('az-AZ', {
      hour: '2-digit', minute: '2-digit',
    });
  };

  const isDelivery = order?.type === 1;

  // ── Render ───────────────────────────────────────────────────────────────────
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
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri qayıt
          </Button>
        </div>
      </CustomerLayout>
    );
  }

  const currentStepIndex  = getStatusStepIndex(order.status);
  const etaText           = getEstimatedTimeText();

  return (
    <CustomerLayout>
      <div className="container max-w-6xl py-8">
        {/* Back */}
        <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri
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
                    <p className="text-sm text-muted-foreground mt-1">
                      Sifariş #{order.orderNumber}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${ORDER_STATUS_COLORS[order.status] ?? 'bg-gray-500'} text-white text-sm px-3 py-1`}>
                      {ORDER_STATUS_LABELS[order.status] ?? 'Naməlum'}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={fetchOrder}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
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
              <CardHeader>
                <CardTitle>Sifariş Prosesi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {STATUS_STEPS.map((step, index) => {
                    const isCompleted = index < currentStepIndex;
                    const isCurrent   = index === currentStepIndex;
                    const isPending   = index > currentStepIndex;

                    // Hər step üçün düzgün vaxt
                    const getStepTime = () => {
                      if (step.status === 6 && order.deliveredAt) return formatTime(order.deliveredAt);
                      if (step.status === 5 && order.pickedUpAt)  return formatTime(order.pickedUpAt);
                      if (step.status === 4 && order.assignedAt)  return formatTime(order.assignedAt);
                      if (isCurrent) return formatTime(new Date().toISOString());
                      return null;
                    };
                    const stepTime = getStepTime();

                    return (
                      <div key={step.status} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                            isCompleted ? 'bg-green-500 text-white' :
                            isCurrent   ? 'bg-primary text-primary-foreground' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {isCompleted
                              ? <Check className="h-5 w-5" />
                              : <span className="text-sm font-semibold">{index + 1}</span>
                            }
                          </div>
                          {index < STATUS_STEPS.length - 1 && (
                            <div className={`h-12 w-0.5 transition-all ${isCompleted ? 'bg-green-500' : 'bg-muted'}`} />
                          )}
                        </div>
                        <div className="flex-1 pt-2 pb-6">
                          <p className={`font-medium ${isCurrent ? 'text-primary' : isPending ? 'text-muted-foreground' : ''}`}> 
                            {step.label}
                          </p>
                          {(isCurrent || isCompleted) && stepTime && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {stepTime} {isCurrent ? '· Cari status' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Courier Location (real-time) */}
            {isDelivery && order.status === 5 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Canlı İzləmə</CardTitle>
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
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    {courierLocation ? (
                      <div className="text-center space-y-2">
                        <MapPin className="h-12 w-12 text-primary mx-auto" />
                        <p className="font-semibold">Kuryer yoldadır</p>
                        <p className="text-sm text-muted-foreground">
                          📍 {Number(courierLocation.latitude).toFixed(5)}, {Number(courierLocation.longitude).toFixed(5)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Son yenilənmə: {new Date(courierLocation.timestamp).toLocaleTimeString('az-AZ')}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {isConnected ? 'Kuryer məlumatı gözlənilir...' : 'Xəritə yüklənir...'}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── Sağ: Sidebar ── */}
          <div className="space-y-6">

            {/* Courier Info */}
            {isDelivery && (courierInfo || order.courierName) && (
              <Card>
                <CardHeader>
                  <CardTitle>Kuryer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={courierInfo?.imageUrl || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                        {(courierInfo?.userFullName || order.courierName || 'K').charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">
                        {courierInfo?.userFullName || order.courierName || 'Kuryer'}
                      </p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Bike className="h-3 w-3" />
                        <span>
                          {courierInfo?.isAvailable === false ? 'Çatdırımda' : 'Aktiv'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <p className="text-xs text-center text-muted-foreground">
                    Kuryer sizi tezliklə zəng edə bilər
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Delivery Address */}
            {isDelivery && order.deliveryAddress && (
              <Card>
                <CardHeader>
                  <CardTitle>Çatdırılma Ünvanı</CardTitle>
                </CardHeader>
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
                <CardHeader>
                  <CardTitle>Qeyd</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{order.orderNotes}</p>
                </CardContent>
              </Card>
            )}

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Sifariş Xülasəsi</CardTitle>
              </CardHeader>
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
                    <span>Arakəsmə:</span>
                    <span>₼{order.subtotal.toFixed(2)}</span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Endirim:</span>
                      <span>-₼{order.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Cəmi:</span>
                  <span>₼{order.total.toFixed(2)}</span>
                </div>

                {/* Timestamps */}
                <Separator />
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Sifariş vaxtı:</span>
                    <span>{formatTime(order.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sifariş #:</span>
                    <span className="font-mono">{order.orderNumber}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
