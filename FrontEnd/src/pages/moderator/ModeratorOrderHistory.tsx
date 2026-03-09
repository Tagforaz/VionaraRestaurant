import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft, ShoppingBag, Package, Clock, MapPin, User,
  Loader2, RefreshCw, Search,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7200';
const authHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
  'Content-Type': 'application/json',
});

const deliveryTypeLabel = (type: number) => {
  if (type === 1) return 'Çatdırılma';
  if (type === 2) return 'Götürmə';
  return 'Daxili';
};

const statusLabel = (status: number) => {
  const map: Record<number, string> = {
    1: 'Gözləyir', 2: 'Təsdiqləndi', 3: 'Hazırlanır',
    4: 'Hazırdır', 5: 'Yoldadır', 6: 'Çatdırıldı',
    7: 'Tamamlandı', 8: 'Ləğv edildi', 9: 'Uğursuz',
  };
  return map[status] ?? `Status ${status}`;
};

const statusColor = (status: number) => {
  if (status === 7) return 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
  if (status === 8 || status === 9) return 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
  return 'bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300';
};

export const ModeratorOrderHistory = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/orders?page=1&take=100`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Sifarişlər yüklənmədi');
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.data ?? [];
      // Yalnız tamamlanmış və ləğv edilmiş sifarişlər
      const history = list
        .filter((o: any) => o.status === 7 || o.status === 8 || o.status === 9)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(history);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderClick = async (order: any) => {
    try {
      const res = await fetch(`${API_BASE}/api/orders/${order.id}`, { headers: authHeaders() });
      if (res.ok) {
        setSelectedOrder(await res.json());
      } else {
        setSelectedOrder(order);
      }
    } catch {
      setSelectedOrder(order);
    }
  };

  const filtered = orders.filter(o =>
    o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.userEmail?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = orders
    .filter(o => o.status === 7)
    .reduce((sum, o) => sum + (o.total ?? 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-50/20 dark:to-purple-950/10">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/moderator')} className="text-white hover:bg-white/20">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Sifariş Tarixçəsi</h1>
              <p className="text-purple-100 text-sm">Tamamlanmış və ləğv edilmiş sifarişlər</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Cəmi sifariş</p>
              <p className="text-3xl font-bold mt-1">{orders.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Tamamlandı</p>
              <p className="text-3xl font-bold mt-1 text-green-600">
                {orders.filter(o => o.status === 7).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Ümumi gəlir</p>
              <p className="text-3xl font-bold mt-1 text-purple-600">
                ₼{totalRevenue.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search + Refresh */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sifariş nömrəsi və ya email axtar..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={fetchOrders}>
            <RefreshCw className="h-4 w-4 mr-2" /> Yenilə
          </Button>
        </div>

        {/* Orders list */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Sifarişlər ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">Sifariş tapılmadı</p>
            ) : (
              <div className="space-y-3">
                {filtered.map(order => (
                  <div
                    key={order.id}
                    onClick={() => handleOrderClick(order)}
                    className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-all hover:shadow-md group"
                  >
                    <div className={`p-3 rounded-full group-hover:scale-110 transition-transform ${
                      order.deliveryType === 1
                        ? 'bg-orange-100 dark:bg-orange-950'
                        : 'bg-blue-100 dark:bg-blue-950'
                    }`}>
                      {order.deliveryType === 1
                        ? <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        : <ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">#{order.orderNumber}</p>
                        <Badge variant="secondary" className="text-xs">
                          {deliveryTypeLabel(order.deliveryType)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
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
                      <p className="font-bold text-lg">₼{order.total?.toFixed(2)}</p>
                      <Badge variant="outline" className={statusColor(order.status)}>
                        {statusLabel(order.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${selectedOrder.deliveryType === 1 ? 'bg-orange-100 dark:bg-orange-950' : 'bg-blue-100 dark:bg-blue-950'}`}>
                    {selectedOrder.deliveryType === 1
                      ? <Package className="h-5 w-5 text-orange-600" />
                      : <ShoppingBag className="h-5 w-5 text-blue-600" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span>Sifariş Detalları</span>
                      <span className="text-muted-foreground">#{selectedOrder.orderNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {deliveryTypeLabel(selectedOrder.deliveryType ?? selectedOrder.type)}
                      </Badge>
                      <Badge variant="outline" className={`text-xs ${statusColor(selectedOrder.status)}`}>
                        {statusLabel(selectedOrder.status)}
                      </Badge>
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{new Date(selectedOrder.createdAt + 'Z').toLocaleString('az-AZ', { timeZone: 'Asia/Baku' })}</span>
                </div>

                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <User className="h-4 w-4" /> Müştəri məlumatı
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Email:</span> <span className="font-medium">{selectedOrder.userEmail}</span></p>
                    {selectedOrder.tableNumber && (
                      <p><span className="text-muted-foreground">Masa:</span> <span className="font-medium">{selectedOrder.tableNumber}</span></p>
                    )}
                    {selectedOrder.deliveryAddress && (
                      <p className="flex items-start gap-2">
                        <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                        <span className="font-medium">{selectedOrder.deliveryAddress}</span>
                      </p>
                    )}
                    {selectedOrder.courierName && (
                      <p><span className="text-muted-foreground">Kuryer:</span> <span className="font-medium">{selectedOrder.courierName}</span></p>
                    )}
                    {selectedOrder.orderNotes && (
                      <p><span className="text-muted-foreground">Qeyd:</span> <span className="font-medium">{selectedOrder.orderNotes}</span></p>
                    )}
                  </div>
                </div>

                <Separator />

                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4" /> Məhsullar
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

                {selectedOrder.discountAmount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Endirim:</span>
                    <span className="text-red-500">-₼{selectedOrder.discountAmount?.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 dark:bg-green-950/30">
                  <span className="text-lg font-semibold">Cəmi:</span>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ₼{selectedOrder.total?.toFixed(2)}
                  </span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
