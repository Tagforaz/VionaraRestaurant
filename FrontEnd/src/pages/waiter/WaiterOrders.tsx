import { useState, useEffect, useCallback } from 'react';
import { useOrderPolling } from '@/hooks/useOrderPolling';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7156';

const authHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
  'Content-Type': 'application/json',
});

// OrderStatus enum (backend ilə eyni)
const OrderStatus = {
  Pending: 1,
  Confirmed: 2,
  Preparing: 3,
  Ready: 4,
  OutForDelivery: 5,
  Delivered: 6,
  Completed: 7,
  Cancelled: 8,
  Failed: 9,
} as const;

// DeliveryType enum
const DeliveryType = {
  Delivery: 1,
  Pickup: 2,
  DineIn: 3,
} as const;

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  totalPrice: number;
}

interface Order {
  id: string;
  orderNumber: string;
  userEmail: string;
  tableId?: string;
  tableNumber?: number;
  status: number;
  type: number;           // GetOrderDto üçün
  deliveryType?: number;  // GetOrderListItemDto üçün — bunu əlavə et
  subtotal: number;
  total: number;
  discountAmount: number;
  orderNotes?: string;
  createdAt: string;
  items: OrderItem[];
}

export const WaiterOrders = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);


  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/orders?page=1&take=100`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Sifarişlər yüklənmədi');
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data ?? [];
      const dineIn = list.filter((o: Order) => o.deliveryType === DeliveryType.DineIn);

      // Bütün sifarişlər üçün items-i əlavə et
      const withItems = await Promise.all(
        dineIn.map(async (o: Order) => {
          try {
            const detail = await fetch(`${API_BASE}/api/orders/${o.id}`, { headers: authHeaders() });
            const detailData = await detail.json();
            return { ...o, items: detailData.items ?? [] };
          } catch {
            return o;
          }
        })
      );

      setOrders(withItems);
    } catch (err: any) {
      toast({ title: 'Xəta', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Polling üçün hook
  const fetchForPolling = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/orders?page=1&take=100`, { headers: authHeaders() });
      if (!res.ok) return null;
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data ?? [];
      const dineIn = list.filter((o: Order) => o.deliveryType === DeliveryType.DineIn);

      const withItems = await Promise.all(
        dineIn.map(async (o: Order) => {
          try {
            const detail = await fetch(`${API_BASE}/api/orders/${o.id}`, { headers: authHeaders() });
            const detailData = await detail.json();
            return { ...o, items: detailData.items ?? [] };
          } catch {
            return o;
          }
        })
      );

      setOrders(withItems);
      return withItems;
    } catch { return null; }
  }, []);

  useOrderPolling({
    fetchFn: fetchForPolling,
    watchStatuses: [4, 8], // 4 = Hazırdır, 8 = Ləğv edildi
    intervalMs: 8000,
  });

  const updateStatus = async (orderId: string, newStatus: number) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || err.title || 'Xəta baş verdi');
      }
      // Lokal state-i yenilə
      setOrders(prev =>
        prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
      );
      toast({ title: 'Uğurlu', description: 'Status yeniləndi' });
    } catch (err: any) {
      toast({ title: 'Xəta', description: err.message, variant: 'destructive' });
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: number) => {
    const config: Record<number, { label: string; className: string }> = {
      [OrderStatus.Pending]:       { label: 'Gözləyir',     className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300' },
      [OrderStatus.Confirmed]:     { label: 'Təsdiqləndi',  className: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' },
      [OrderStatus.Preparing]:     { label: 'Hazırlanır',   className: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300' },
      [OrderStatus.Ready]:         { label: 'Hazırdır',     className: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' },
      [OrderStatus.Completed]:     { label: 'Tamamlandı',   className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
      [OrderStatus.Cancelled]:     { label: 'Ləğv edildi',  className: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' },
    };
    const s = config[status] ?? { label: `Status ${status}`, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={s.className}>{s.label}</Badge>;
  };

  const activeOrders = orders.filter(o =>
    o.status !== OrderStatus.Completed && o.status !== OrderStatus.Cancelled
  );
  const completedOrders = orders.filter(o =>
    o.status === OrderStatus.Completed
  );
  const cancelledOrders = orders.filter(o =>
    o.status === OrderStatus.Cancelled
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/waiter')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{t('waiter.dineInOrders', 'Daxili Sifarişlər')}</h1>
            <p className="text-muted-foreground">{t('waiter.manageDineInOrders', 'Masa sifarişlərini idarə edin')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchOrders}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenilə
          </Button>
          <Button onClick={() => navigate('/waiter/orders/new')}>
            <Plus className="h-4 w-4 mr-2" />
            {t('waiter.newOrder', 'Yeni Sifariş')}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Aktiv ({activeOrders.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Tamamlanmış ({completedOrders.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Ləğv edilmiş ({cancelledOrders.length})
          </TabsTrigger>
        </TabsList>

        {/* Aktiv sifarişlər */}
        <TabsContent value="active" className="space-y-4 mt-6">
          {activeOrders.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Aktiv sifariş yoxdur</p>
              </CardContent>
            </Card>
          ) : activeOrders.map(order => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      {order.tableNumber ? `Masa ${order.tableNumber}` : 'Masa yoxdur'}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">#{order.orderNumber}</p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Məhsullar */}
                <div className="space-y-2">
                  {order.items?.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.productName}</span>
                      <span className="font-medium">{item.totalPrice.toFixed(2)} ₼</span>
                    </div>
                  ))}
                </div>

                {order.orderNotes && (
                  <div className="rounded-lg bg-muted p-2 text-sm text-muted-foreground">
                    📝 {order.orderNotes}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="font-bold">Cəm:</span>
                  <span className="font-bold text-blue-600">{order.total.toFixed(2)} ₼</span>
                </div>

                {/* Hazırdır mərhələsində Masaya çatdır düyməsi */}
                {order.status === OrderStatus.Ready && (
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 mt-2"
                    disabled={updatingId === order.id}
                    onClick={() => updateStatus(order.id, OrderStatus.Completed)}
                  >
                    {updatingId === order.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Masaya çatdır
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Tamamlanmış sifarişlər */}
        <TabsContent value="completed" className="space-y-4 mt-6">
          {completedOrders.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Tamamlanmış sifariş yoxdur</p>
              </CardContent>
            </Card>
          ) : completedOrders.map(order => (
            <Card key={order.id} className="opacity-75">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{order.tableNumber ? `Masa ${order.tableNumber}` : 'Masa yoxdur'}</p>
                    <p className="text-sm text-muted-foreground">#{order.orderNumber} • {order.total.toFixed(2)} ₼</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt + 'Z').toLocaleString('az-AZ', { timeZone: 'Asia/Baku' })}
                    </p>
                    {/* Məhsullar */}
                    <div className="space-y-2 mt-2">
                      {order.items?.map(item => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>{item.quantity}x {item.productName}</span>
                          <span className="font-medium">{item.totalPrice.toFixed(2)} ₼</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Ləğv edilmiş sifarişlər */}
        <TabsContent value="cancelled" className="space-y-4 mt-6">
          {cancelledOrders.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Ləğv edilmiş sifariş yoxdur</p>
              </CardContent>
            </Card>
          ) : cancelledOrders.map(order => (
            <Card key={order.id} className="opacity-60 border-red-900/30">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{order.tableNumber ? `Masa ${order.tableNumber}` : 'Masa yoxdur'}</p>
                    <p className="text-sm text-muted-foreground">#{order.orderNumber} • {order.total.toFixed(2)} ₼</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt + 'Z').toLocaleString('az-AZ', { timeZone: 'Asia/Baku' })}
                    </p>
                    {/* Məhsullar */}
                    <div className="space-y-2 mt-2">
                      {order.items?.map(item => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>{item.quantity}x {item.productName}</span>
                          <span className="font-medium">{item.totalPrice.toFixed(2)} ₼</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};
