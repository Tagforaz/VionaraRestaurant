import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, ArrowLeft, Eye, Check, X, Loader2, Bell, BellOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7156';
const authHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
  'Content-Type': 'application/json',
});

// DeliveryType: 1=Delivery, 2=Pickup, 3=DineIn
const DELIVERY = 1;

const statusConfig: Record<number, { label: string; variant: 'default' | 'secondary' | 'destructive'; className?: string }> = {
  1: { label: 'Gözlənilir',   variant: 'secondary' },
  2: { label: 'Təsdiqləndi',  variant: 'default', className: 'bg-blue-600' },
  3: { label: 'Hazırlanır',   variant: 'default', className: 'bg-blue-600' },
  4: { label: 'Hazırdır',     variant: 'default', className: 'bg-green-600' },
  5: { label: 'Yoldadır',     variant: 'default', className: 'bg-indigo-600' },
  6: { label: 'Çatdırılıb',   variant: 'default', className: 'bg-teal-600' },
  7: { label: 'Tamamlandı',   variant: 'secondary' },
  8: { label: 'Ləğv edildi',  variant: 'destructive' },
  9: { label: 'Uğursuz',      variant: 'destructive' },
};

const deliveryTypeLabel = (type: number) => {
  if (type === 1) return 'Çatdırılma';
  if (type === 2) return 'Götürmə';
  return 'Daxili';
};

export const ModeratorOrders = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [orders, setOrders] = useState<any[]>([]);
  const [couriers, setCouriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [acceptOrderId, setAcceptOrderId] = useState<string | null>(null);
  const [completeOrderId, setCompleteOrderId] = useState<string | null>(null); // ✅ YENİ
  const [actionLoading, setActionLoading] = useState(false);

  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');

  const prevOrdersRef = useRef<any[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDV/zPLTgjMGHm7A7+OZURE');
    audioRef.current.volume = 0.6;

    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(p => setNotifPermission(p));
      }
    }

    fetchOrders();
    fetchCouriers();
  }, []);

  const unlockAudio = () => {
    if (audioUnlocked || !audioRef.current) return;
    audioRef.current.volume = 0;
    audioRef.current.play()
      .then(() => {
        audioRef.current!.pause();
        audioRef.current!.currentTime = 0;
        audioRef.current!.volume = 0.6;
        setAudioUnlocked(true);
      })
      .catch(() => {});
  };

  useEffect(() => {
    const interval = setInterval(fetchOrdersSilent, 10000);
    return () => clearInterval(interval);
  }, []);

  const triggerNotification = (title: string, description: string) => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
    toast({ title, description, duration: 6000 });
    if (notifPermission === 'granted') {
      new Notification(title, { body: description, icon: '/logo.png', requireInteraction: false, tag: title });
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/orders?page=1&take=100`, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      const list: any[] = Array.isArray(data) ? data : data.data ?? [];
      const active = list.filter((o: any) => o.status !== 7 && o.status !== 8 && o.status !== 9);
      if (isFirstLoadRef.current) {
        prevOrdersRef.current = active;
        isFirstLoadRef.current = false;
      } else {
        checkForNewOrders(active);
      }
      setOrders(active);
    } catch { } finally {
      setLoading(false);
    }
  };

  const fetchOrdersSilent = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/orders?page=1&take=100`, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      const list: any[] = Array.isArray(data) ? data : data.data ?? [];
      const active = list.filter((o: any) => o.status !== 7 && o.status !== 8 && o.status !== 9);
      checkForNewOrders(active);
      setOrders(active);
    } catch { }
  };

  const checkForNewOrders = (newList: any[]) => {
    const prevMap = new Map(prevOrdersRef.current.map((o: any) => [o.id, o]));
    const newOrders = newList.filter((o: any) => !prevMap.has(o.id));
    if (newOrders.length > 0) {
      triggerNotification(`🛎️ Yeni sifariş!`, `${newOrders.length} yeni sifariş daxil oldu`);
    }
    for (const order of newList) {
      const prev = prevMap.get(order.id);
      if (prev && prev.status !== order.status) {
        const oldLabel = statusConfig[prev.status]?.label ?? `Status ${prev.status}`;
        const newLabel = statusConfig[order.status]?.label ?? `Status ${order.status}`;
        triggerNotification(`📦 Sifariş statusu dəyişdi`, `#${order.orderNumber}: ${oldLabel} → ${newLabel}`);
      }
    }
    prevOrdersRef.current = newList;
  };

  const fetchCouriers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/couriers?page=1&take=100`, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      const list: any[] = Array.isArray(data) ? data : data.data ?? [];
      setCouriers(list);
    } catch { }
  };

  const handleViewDetails = async (order: any) => {
    setDetailsOpen(true);
    setDetailLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/orders/${order.id}`, { headers: authHeaders() });
      setSelectedOrder(res.ok ? await res.json() : order);
    } catch {
      setSelectedOrder(order);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAcceptOrder = async () => {
    if (!acceptOrderId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/orders/${acceptOrderId}`, {
        method: 'PUT', headers: authHeaders(),
        body: JSON.stringify({ status: 2 }),
      });
      if (res.ok) {
        toast({ title: '✅ Sifariş qəbul edildi' });
        setOrders(prev => prev.map(o => o.id === acceptOrderId ? { ...o, status: 2 } : o));
      } else {
        toast({ title: 'Xəta', description: 'Sifariş qəbul edilmədi', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Xəta', variant: 'destructive' });
    } finally {
      setActionLoading(false);
      setAcceptOrderId(null);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelOrderId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/orders/${cancelOrderId}`, {
        method: 'PUT', headers: authHeaders(),
        body: JSON.stringify({ status: 8 }),
      });
      if (res.ok) {
        toast({ title: '❌ Sifariş ləğv edildi', variant: 'destructive' });
        setOrders(prev => prev.filter(o => o.id !== cancelOrderId));
      } else {
        toast({ title: 'Xəta', description: 'Sifariş ləğv edilmədi', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Xəta', variant: 'destructive' });
    } finally {
      setActionLoading(false);
      setCancelOrderId(null);
    }
  };

  // ✅ YENİ: Götürmə/Restoran sifarişi üçün tamamlandı (status 7)
  const handleCompleteOrder = async () => {
    if (!completeOrderId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/orders/${completeOrderId}`, {
        method: 'PUT', headers: authHeaders(),
        body: JSON.stringify({ status: 7 }),
      });
      if (res.ok) {
        toast({ title: '✅ Sifariş tamamlandı' });
        setOrders(prev => prev.filter(o => o.id !== completeOrderId));
      } else {
        toast({ title: 'Xəta', description: 'Sifariş tamamlanmadı', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Xəta', variant: 'destructive' });
    } finally {
      setActionLoading(false);
      setCompleteOrderId(null);
    }
  };

  const handleAssignCourier = async (orderId: string, courierId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}`, {
        method: 'PUT', headers: authHeaders(),
        body: JSON.stringify({ courierId }),
      });
      if (res.ok) {
        const courier = couriers.find(c => c.id === courierId);
        toast({ title: '🚴 Kuryer təyin edildi', description: courier?.userFullName ?? courier?.userName ?? courier?.name ?? '' });
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, courierId } : o));
      } else {
        toast({ title: 'Xəta', description: 'Kuryer təyin edilmədi', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Xəta', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: number) => {
    const s = statusConfig[status] ?? { label: `Status ${status}`, variant: 'default' as const };
    return <Badge variant={s.variant} className={s.className ?? ''}>{s.label}</Badge>;
  };

  const getTypeBadge = (type: number) => (
    <Badge variant="outline">{deliveryTypeLabel(type)}</Badge>
  );

  const filterOrders = (tab: string) => {
    if (tab === 'external') return orders.filter(o => o.deliveryType === 1 || o.deliveryType === 2);
    if (tab === 'internal') return orders.filter(o => o.deliveryType === 3);
    return orders;
  };

  const filteredOrders = filterOrders(selectedTab);
  const externalCount = orders.filter(o => o.deliveryType === 1 || o.deliveryType === 2).length;
  const internalCount = orders.filter(o => o.deliveryType === 3).length;

  return (
    <div className="space-y-6" onClick={unlockAudio}>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/moderator')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{t('moderator.stats.orders')}</h1>
          <p className="text-muted-foreground">{t('moderator.ordersDesc')}</p>
        </div>
        <div className="flex items-center gap-2">
          {!audioUnlocked && (
            <span className="text-xs text-yellow-500 flex items-center gap-1">
              <BellOff className="h-3 w-3" /> Səsi aktivləşdirmək üçün səhifəyə klikləyin
            </span>
          )}
          {audioUnlocked && (
            <span className="text-xs text-green-500 flex items-center gap-1">
              <Bell className="h-3 w-3" /> Bildiriş aktiv
            </span>
          )}
          {notifPermission === 'denied' && (
            <span className="text-xs text-red-500">Browser bildirişi bloklanıb</span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Yenilə'}
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="all">{t('chef.all')} ({orders.length})</TabsTrigger>
          <TabsTrigger value="external">{t('moderator.external')} ({externalCount})</TabsTrigger>
          <TabsTrigger value="internal">{t('moderator.dineIn')} ({internalCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4 mt-6">
          {loading && orders.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">{t('chef.noOrdersFound')}</p>
              </CardContent>
            </Card>
          ) : filteredOrders.map(order => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="bg-muted/30 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-xl">{t('admin.order')} #{order.orderNumber}</CardTitle>
                    {getTypeBadge(order.deliveryType)}
                  </div>
                  {getStatusBadge(order.status)}
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">{t('admin.customer')}:</span>
                    <span className="font-semibold">{order.userEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">{t('admin.total')}:</span>
                    <span className="font-bold text-green-600">{order.total?.toFixed(2)} ₼</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" />{t('admin.time')}:
                    </span>
                    <span className="font-semibold">
                      {new Date(order.createdAt + 'Z').toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Baku' })}
                    </span>
                  </div>
                  {order.tableNumber && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Masa:</span>
                      <span className="font-semibold">{order.tableNumber}</span>
                    </div>
                  )}
                </div>

                {/* Kuryer seçimi — yalnız Çatdırılma */}
                {order.deliveryType === DELIVERY && order.status !== 8 && (
                  <div className="pt-3 border-t">
                    <label className="text-sm font-semibold mb-2 block">{t('admin.assignCourier')}:</label>
                    <Select
                      value={order.courierId ?? undefined}
                      onValueChange={(val) => handleAssignCourier(order.id, val)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('admin.assignCourier')} />
                      </SelectTrigger>
                      <SelectContent>
                        {couriers.length === 0 ? (
                          <SelectItem value="none" disabled>Kuryer yoxdur</SelectItem>
                        ) : couriers.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.userFullName ?? c.userName ?? c.name ?? c.email ?? 'Kuryer'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-3 border-t flex-wrap">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleViewDetails(order)}>
                    <Eye className="h-4 w-4 mr-2" />
                    {t('courier.viewDetails')}
                  </Button>

                  {/* Status 1: Gözləyir → Qəbul et / Ləğv et */}
                  {order.status === 1 && (
                    <>
                      <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => setAcceptOrderId(order.id)}>
                        <Check className="h-4 w-4 mr-2" />
                        {t('chef.acceptOrder')}
                      </Button>
                      <Button variant="destructive" size="sm" className="flex-1" onClick={() => setCancelOrderId(order.id)}>
                        <X className="h-4 w-4 mr-2" />
                        {t('admin.cancel')}
                      </Button>
                    </>
                  )}

                  {/* ✅ Status 4 + Götürmə/Restoran → Tamamlandı (status 7) */}
                  {order.status === 4 && order.deliveryType !== DELIVERY && (
                    <Button
                      size="sm"
                      className="flex-1 bg-green-700 hover:bg-green-800"
                      onClick={() => setCompleteOrderId(order.id)}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      ✅ Tamamlandı
                    </Button>
                  )}

                  {/* ✅ Status 4 + Çatdırılma → məlumat */}
                  {order.status === 4 && order.deliveryType === DELIVERY && (
                    <div className="flex-1 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-3 py-2 text-xs text-blue-700 dark:text-blue-300 text-center">
                      🚚 Kuryer götürməyi gözlənilir...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Order Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('admin.orderDetails')}</DialogTitle>
            <DialogDescription>{t('admin.order')} #{selectedOrder?.orderNumber}</DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">{t('admin.customerInfo')}</h3>
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">Email:</span> {selectedOrder.userEmail}</p>
                    {selectedOrder.tableNumber && <p><span className="font-medium">{t('admin.table')}:</span> Masa {selectedOrder.tableNumber}</p>}
                    {selectedOrder.deliveryAddress && <p><span className="font-medium">{t('admin.address')}:</span> {selectedOrder.deliveryAddress}</p>}
                    {selectedOrder.courierName && <p><span className="font-medium">Kuryer:</span> {selectedOrder.courierName}</p>}
                    {selectedOrder.orderNotes && <p><span className="font-medium">Qeyd:</span> {selectedOrder.orderNotes}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">{t('admin.orderType')}</h3>
                  <div className="text-sm space-y-2">
                    {getTypeBadge(selectedOrder.deliveryType ?? selectedOrder.type)}
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                </div>
              </div>

              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">{t('admin.orderItems')}</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-2">{t('admin.product')}</th>
                          <th className="text-center p-2">{t('admin.quantity')}</th>
                          <th className="text-right p-2">{t('admin.price')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((item: any) => (
                          <tr key={item.id} className="border-t">
                            <td className="p-2">{item.productName}</td>
                            <td className="text-center p-2">{item.quantity}</td>
                            <td className="text-right p-2">{item.totalPrice?.toFixed(2)} ₼</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t font-bold">
                <span>{t('admin.total')}:</span>
                <span className="text-lg text-green-600">{selectedOrder.total?.toFixed(2)} ₼</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Accept Confirmation */}
      <AlertDialog open={!!acceptOrderId} onOpenChange={() => setAcceptOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('chef.confirmAccept')}</AlertDialogTitle>
            <AlertDialogDescription>{t('chef.confirmAcceptDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleAcceptOrder} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Confirmation */}
      <AlertDialog open={!!cancelOrderId} onOpenChange={() => setCancelOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.confirmCancel')}</AlertDialogTitle>
            <AlertDialogDescription>{t('admin.confirmCancelDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelOrder} disabled={actionLoading} className="bg-destructive hover:bg-destructive/90">
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ✅ YENİ: Complete Confirmation — Götürmə/Restoran */}
      <AlertDialog open={!!completeOrderId} onOpenChange={() => setCompleteOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sifarişi tamamlamaq istəyirsiniz?</AlertDialogTitle>
            <AlertDialogDescription>Sifariş müştəriyə verilib və tamamlandı olaraq işarələnəcək.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleCompleteOrder} disabled={actionLoading} className="bg-green-700 hover:bg-green-800">
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};