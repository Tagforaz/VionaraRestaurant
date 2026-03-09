import { useState, useEffect, useRef, useCallback } from 'react';
import { useOrderPolling } from '@/hooks/useOrderPolling';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Check, X, Clock, ArrowLeft, Loader2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7200';
const PAGE_SIZE = 8;

const authHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
  'Content-Type': 'application/json',
});

const OrderStatus = {
  Pending: 1, Confirmed: 2, Preparing: 3, Ready: 4,
  Completed: 7, Cancelled: 8, Failed: 9,
};

const DeliveryType = { Delivery: 1, Pickup: 2, DineIn: 3 };

const formatBakuTime = (dateStr: string): string => {
  if (!dateStr) return '';
  const normalized = /Z|[+-]\d{2}:\d{2}$/.test(dateStr) ? dateStr : dateStr + 'Z';
  return new Date(normalized).toLocaleTimeString('az-AZ', { timeZone: 'Asia/Baku' });
};

interface OrderItem {
  id: string; productName: string; quantity: number; price: number; totalPrice: number;
}

interface Order {
  id: string; orderNumber: string; tableNumber?: number;
  status: number; deliveryType: number; total: number;
  orderNotes?: string; createdAt: string; items: OrderItem[];
}

export const ChefOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders]           = useState<Order[]>([]);
  const [loading, setLoading]         = useState(false);
  const [updatingId, setUpdatingId]   = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmAction, setConfirmAction] = useState<{ orderId: string; newStatus: number; label: string } | null>(null);
  const prevCountRef = useRef(0);
  const audioRef     = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDV/zPLTgjMGHm7A7+OZURE');
    fetchOrders();
  }, []);

  // Tab dəyişəndə səhifəni sıfırla
  useEffect(() => { setCurrentPage(1); }, [selectedTab]);

  const fetchOrdersSilent = async (): Promise<Order[] | null> => {
    try {
      const res = await fetch(`${API_BASE}/api/orders?page=1&take=100`, { headers: authHeaders() });
      if (!res.ok) return null;
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data ?? [];
      const detailed = await Promise.all(
        list.map(async (order: any) => {
          try {
            const r = await fetch(`${API_BASE}/api/orders/${order.id}`, { headers: authHeaders() });
            const d = await r.json();
            return { ...order, items: d.items ?? [], deliveryType: order.deliveryType ?? d.type ?? 0 };
          } catch { return { ...order, items: [] }; }
        })
      );
      setOrders(detailed);
      return detailed;
    } catch { return null; }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/orders?page=1&take=100`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Sifarişlər yüklənmədi');
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data ?? [];
      const detailed = await Promise.all(
        list.map(async (order: any) => {
          try {
            const r = await fetch(`${API_BASE}/api/orders/${order.id}`, { headers: authHeaders() });
            const d = await r.json();
            return { ...order, items: d.items ?? [], deliveryType: order.deliveryType ?? d.type ?? 0 };
          } catch { return { ...order, items: [] }; }
        })
      );
      setOrders(detailed);
      prevCountRef.current = detailed.filter((o: Order) => o.status === OrderStatus.Pending).length;
    } catch (err: any) {
      toast({ title: 'Xəta', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      const fresh = await fetchOrdersSilent();
      if (!fresh) return;
      const pendingCount = fresh.filter((o: Order) => o.status === OrderStatus.Pending).length;
      if (pendingCount > prevCountRef.current) {
        audioRef.current?.play().catch(() => {});
        toast({ title: '🔔 Yeni Sifariş!', description: 'Yeni sifariş daxil oldu', duration: 5000 });
      }
      prevCountRef.current = pendingCount;
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchForPolling = useCallback(async () => await fetchOrdersSilent(), []);
  useOrderPolling({ fetchFn: fetchForPolling, watchStatuses: [1], intervalMs: 15000 });

  const updateStatus = async (orderId: string, newStatus: number) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}`, {
        method: 'PUT', headers: authHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || 'Xəta baş verdi'); }
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast({ title: 'Uğurlu', description: 'Status yeniləndi' });
    } catch (err: any) {
      toast({ title: 'Xəta', description: err.message, variant: 'destructive' });
    } finally {
      setUpdatingId(null);
      setConfirmAction(null);
    }
  };

  const getStatusBadge = (status: number) => {
    const config: Record<number, { label: string; className: string }> = {
      1: { label: 'Gözləyir',    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300' },
      2: { label: 'Təsdiqləndi', className: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' },
      3: { label: 'Hazırlanır',  className: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300' },
      4: { label: 'Hazırdır',    className: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' },
      7: { label: 'Tamamlandı',  className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
      8: { label: 'Ləğv edildi', className: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' },
    };
    const s = config[status] ?? { label: `Status ${status}`, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={s.className}>{s.label}</Badge>;
  };

  const getDeliveryLabel = (type: number) => {
    if (type === DeliveryType.Delivery) return '🚚 Çatdırılma';
    if (type === DeliveryType.Pickup)   return '🏃 Götürmə';
    if (type === DeliveryType.DineIn)   return '🍽️ Restoranda';
    return '❓ Naməlum';
  };

  const filterByTab = (tab: string) => {
    if (tab === 'pending')   return orders.filter(o => o.status === OrderStatus.Pending || o.status === 0);
    if (tab === 'confirmed') return orders.filter(o => o.status === OrderStatus.Confirmed);
    if (tab === 'preparing') return orders.filter(o => o.status === OrderStatus.Preparing);
    if (tab === 'ready')     return orders.filter(o => o.status === OrderStatus.Ready);
    if (tab === 'completed') return orders.filter(o => o.status === OrderStatus.Completed || o.status === OrderStatus.Cancelled);
    return orders;
  };

  const filtered   = filterByTab(selectedTab);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const PaginationBar = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between pt-4">
        <p className="text-sm text-muted-foreground">
          {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} / {filtered.length}
        </p>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
            .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
              acc.push(p);
              return acc;
            }, [])
            .map((item, idx) =>
              item === 'ellipsis'
                ? <span key={`e-${idx}`} className="px-2 text-muted-foreground">...</span>
                : <Button key={item} variant={currentPage === item ? 'default' : 'outline'}
                    size="icon" className="w-9 h-9"
                    onClick={() => setCurrentPage(item as number)}>
                    {item}
                  </Button>
            )}
          <Button variant="outline" size="icon"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/chef')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Sifarişlər</h1>
            <p className="text-muted-foreground">Mətbəx sifarişlərini idarə edin</p>
          </div>
        </div>
        <Button variant="outline" onClick={fetchOrders}>
          <RefreshCw className="h-4 w-4 mr-2" /> Yenilə
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pending">Gözləyir ({orders.filter(o => o.status === OrderStatus.Pending).length})</TabsTrigger>
          <TabsTrigger value="confirmed">Təsdiqləndi ({orders.filter(o => o.status === OrderStatus.Confirmed).length})</TabsTrigger>
          <TabsTrigger value="preparing">Hazırlanır ({orders.filter(o => o.status === OrderStatus.Preparing).length})</TabsTrigger>
          <TabsTrigger value="ready">Hazırdır ({orders.filter(o => o.status === OrderStatus.Ready).length})</TabsTrigger>
          <TabsTrigger value="completed">Tamamlandı ({orders.filter(o => o.status === OrderStatus.Completed || o.status === OrderStatus.Cancelled).length})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4 mt-6">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Sifariş yoxdur</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-4">
                {paginated.map(order => (
                  <Card key={order.id} className={order.status === OrderStatus.Pending ? 'border-yellow-400 dark:border-yellow-600' : ''}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{order.tableNumber ? `Masa ${order.tableNumber}` : 'Masa yoxdur'}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">#{order.orderNumber}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{getDeliveryLabel(order.deliveryType)}</p>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-1">
                        {order.items?.map(item => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>
                              {item.quantity}x {item.productName}
                              <span className="ml-2 text-xs text-muted-foreground">({item.price?.toFixed(2)} ₼/ədəd)</span>
                            </span>
                            <span className="font-medium">{item.totalPrice?.toFixed(2)} ₼</span>
                          </div>
                        ))}
                      </div>

                      {order.orderNotes && (
                        <div className="rounded-lg bg-muted p-2 text-sm text-muted-foreground">
                          📝 {order.orderNotes}
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2 border-t text-sm text-muted-foreground">
                        <span><Clock className="inline h-3 w-3 mr-1" />{formatBakuTime(order.createdAt)}</span>
                        <span className="font-bold text-foreground">{order.total.toFixed(2)} ₼</span>
                      </div>

                      <div className="space-y-2">
                        {order.status === OrderStatus.Pending && (
                          <div className="flex gap-2">
                            <Button className="flex-1 bg-green-600 hover:bg-green-700" disabled={updatingId === order.id}
                              onClick={() => setConfirmAction({ orderId: order.id, newStatus: OrderStatus.Confirmed, label: 'Sifarişi qəbul etmək' })}>
                              {updatingId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 mr-1" /> Qəbul et</>}
                            </Button>
                            <Button variant="destructive" className="flex-1" disabled={updatingId === order.id}
                              onClick={() => setConfirmAction({ orderId: order.id, newStatus: OrderStatus.Cancelled, label: 'Sifarişi rədd etmək' })}>
                              <X className="h-4 w-4 mr-1" /> Rədd et
                            </Button>
                          </div>
                        )}
                        {order.status === OrderStatus.Confirmed && (
                          <Button className="w-full bg-orange-600 hover:bg-orange-700" disabled={updatingId === order.id}
                            onClick={() => updateStatus(order.id, OrderStatus.Preparing)}>
                            {updatingId === order.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Clock className="h-4 w-4 mr-2" />}
                            Hazırlamağa başla
                          </Button>
                        )}
                        {order.status === OrderStatus.Preparing && (
                          <Button className="w-full bg-green-600 hover:bg-green-700" disabled={updatingId === order.id}
                            onClick={() => updateStatus(order.id, OrderStatus.Ready)}>
                            {updatingId === order.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                            ✅ Hazırdır — Bildiriş göndər
                          </Button>
                        )}
                        {order.status === OrderStatus.Ready && order.deliveryType === DeliveryType.Pickup && (
                          <Button className="w-full bg-green-700 hover:bg-green-800" disabled={updatingId === order.id}
                            onClick={() => setConfirmAction({ orderId: order.id, newStatus: OrderStatus.Completed, label: 'Sifarişi tamamlamaq' })}>
                            {updatingId === order.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                            ✅ Müştəriyə verildi
                          </Button>
                        )}
                        {order.status === OrderStatus.Ready && order.deliveryType === DeliveryType.DineIn && (
                          <div className="rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 p-3 text-sm text-purple-700 dark:text-purple-300 text-center">
                            🍽️ Ofisant masaya çatdırmağı gözlənilir...
                          </div>
                        )}
                        {order.status === OrderStatus.Ready && order.deliveryType === DeliveryType.Delivery && (
                          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3 text-sm text-blue-700 dark:text-blue-300 text-center">
                            🚚 Kuryer götürməyi gözlənilir...
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <PaginationBar />
            </>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Əminsiniz?</AlertDialogTitle>
            <AlertDialogDescription>{confirmAction?.label} istəyirsiniz?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ləğv et</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmAction && updateStatus(confirmAction.orderId, confirmAction.newStatus)}>
              Təsdiq et
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
