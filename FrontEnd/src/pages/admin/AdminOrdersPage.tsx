import { useState, useEffect, useRef, useCallback } from 'react';
import { useOrderPolling } from '@/hooks/useOrderPolling';
import {
  Search, Eye, CheckCircle, XCircle, Clock, MapPin, Mail,
  Truck, Package, Trash2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/layouts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { GetOrderDto, GetOrderListItemDto } from '@/types';
import * as orderApi from '@/api/dev/orderDev';
import * as courierApi from '@/api/dev/courierDev';

const PAGE_SIZE = 20;

// DeliveryType: 1=Delivery, 2=Pickup, 3=DineIn
const DELIVERY = 1;

const AdminOrdersPage = () => {
  const { t } = useTranslation();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [allOrders, setAllOrders] = useState<GetOrderListItemDto[]>([]);
  const [selectedCouriers, setSelectedCouriers] = useState<Record<string, string>>({});
  const [selectedOrder, setSelectedOrder] = useState<GetOrderDto | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [couriers, setCouriers] = useState<any[]>([]);

  const prevOrderIdsRef = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    audioRef.current = new Audio(
      'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDV/zPLTgjMGHm7A7+OZURE'
    );
    audioRef.current.volume = 0.6;
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    loadOrders();
    loadCouriers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const response = await orderApi.getOrders(1, 100);

      let list: GetOrderListItemDto[] = [];
      if (Array.isArray(response.data)) {
        list = response.data;
      } else if (response.data && Array.isArray((response.data as any).data)) {
        list = (response.data as any).data;
      }

      list = [...list].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setAllOrders(list);

      const courierMap: Record<string, string> = {};
      list.forEach(o => {
        if (o.courierId) courierMap[o.id] = o.courierId;
      });
      setSelectedCouriers(prev => ({ ...courierMap, ...prev }));

      if (isFirstLoadRef.current) {
        prevOrderIdsRef.current = new Set(list.map(o => o.id));
        isFirstLoadRef.current = false;
      }
    } catch (error: any) {
      toast.error('Xəta', {
        description: error.response?.data?.message || error.message || 'Sifarişlər yüklənmədi',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const notifyNewOrders = useCallback((newOrders: GetOrderListItemDto[]) => {
    if (newOrders.length === 0) return;
    audioRef.current?.play().catch(() => {});
    toast('🛎️ Yeni sifariş!', {
      description: `${newOrders.length} yeni sifariş daxil oldu`,
      duration: 6000,
      action: {
        label: 'Bax',
        onClick: () => {
          setStatusFilter("1");
          setTypeFilter('all');
        },
      },
    });
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🛎️ Yeni sifariş!', {
        body: `${newOrders.length} yeni sifariş gəldi`,
        icon: '/logo.png',
        requireInteraction: true,
      });
    }
  }, []);

  const fetchForPolling = useCallback(async () => {
    try {
      const response = await orderApi.getOrders(1, 100);
      let list: GetOrderListItemDto[] = [];
      if (Array.isArray(response.data)) list = response.data;
      else if (response.data && Array.isArray((response.data as any).data)) list = (response.data as any).data;

      list = [...list].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      if (!isFirstLoadRef.current) {
        const newOrders = list.filter(o => !prevOrderIdsRef.current.has(o.id));
        notifyNewOrders(newOrders);
      }
      prevOrderIdsRef.current = new Set(list.map(o => o.id));
      setAllOrders(list);
      return list;
    } catch {
      return null;
    }
  }, [notifyNewOrders]);

  useOrderPolling({ fetchFn: fetchForPolling, intervalMs: 15000 });

  const loadCouriers = async () => {
    try {
      const response = await courierApi.getCouriers();
      let list: any[] = [];
      if (Array.isArray(response)) list = response;
      else if (Array.isArray((response as any).data)) list = (response as any).data;
      else if (Array.isArray((response as any)?.data?.data)) list = (response as any).data.data;
      setCouriers(list.filter((c: any) => c.isAvailable === true));
    } catch (error) {
      console.error('Failed to load couriers:', error);
    }
  };

  const filteredOrders = allOrders.filter(order => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || order.status === parseInt(statusFilter);
    const matchesType =
      typeFilter === 'all' || order.deliveryType === parseInt(typeFilter);
    return matchesSearch && matchesStatus && matchesType;
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const getPageNumbers = () => {
    const pages: number[] = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const viewOrderDetails = async (orderId: string) => {
    try {
      const response = await orderApi.getOrder(orderId);
      setSelectedOrder(response.data);
      setIsDetailsOpen(true);
    } catch (error: any) {
      toast.error('Xəta', { description: error.response?.data?.message || 'Sifariş detalları yüklənmədi' });
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: number, courierId?: string) => {
    try {
      await orderApi.updateOrder(orderId, { status: newStatus, courierId });
      toast.success('Uğurlu', { description: 'Sifariş statusu yeniləndi' });
      await loadOrders();
      if (selectedOrder?.id === orderId) await viewOrderDetails(orderId);
    } catch (error: any) {
      toast.error('Xəta', { description: error.response?.data?.message || 'Status yenilənmədi' });
    }
  };

  const assignCourier = async (orderId: string, courierId: string) => {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    try {
      await orderApi.updateOrder(orderId, { status: order.status, courierId });
      setSelectedCouriers(prev => ({ ...prev, [orderId]: courierId }));
      toast.success('Uğurlu', { description: 'Kuryer təyin edildi' });
    } catch (error: any) {
      toast.error('Xəta', { description: error.response?.data?.message || 'Xəta baş verdi' });
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    setOrderToDelete(orderId);
    setIsAlertOpen(true);
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    try {
      await orderApi.deleteOrder(orderToDelete);
      toast.success('Uğurlu', { description: 'Sifariş silindi' });
      await loadOrders();
      setIsAlertOpen(false);
      setOrderToDelete(null);
    } catch (error: any) {
      toast.error('Xəta', { description: error.response?.data?.message || 'Sifariş silinmədi' });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">{t('admin.orders')}</h1>
          <p className="text-muted-foreground">{t('admin.manageOrders')}</p>
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Sifariş nömrəsi və ya email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Bütün tiplər" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">🔀 Bütün tiplər</SelectItem>
              <SelectItem value="1">🚚 Çatdırılma</SelectItem>
              <SelectItem value="2">🏃 Götürmə</SelectItem>
              <SelectItem value="3">🍽️ Restoranda</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Bütün statuslar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Bütün statuslar</SelectItem>
              <SelectItem value={"1"}>Gözləyir</SelectItem>
              <SelectItem value={"2"}>Təsdiqlənib</SelectItem>
              <SelectItem value={"3"}>Hazırlanır</SelectItem>
              <SelectItem value={"4"}>Hazırdır</SelectItem>
              <SelectItem value={"5"}>Yoldadır</SelectItem>
              <SelectItem value={"6"}>Çatdırılıb</SelectItem>
              <SelectItem value={"7"}>Tamamlandı</SelectItem>
              <SelectItem value={"8"}>Ləğv edilib</SelectItem>
              <SelectItem value={"9"}>Uğursuz</SelectItem>
            </SelectContent>
          </Select>

          <span className="text-sm text-muted-foreground ml-auto">
            {filteredOrders.length} sifariş tapıldı
          </span>
        </div>

        {/* ── Orders Table ── */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sifariş №</TableHead>
                  <TableHead>Müştəri</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Məbləğ</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tarix</TableHead>
                  <TableHead className="text-right">Əməliyyatlar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Sifariş tapılmadı
                    </TableCell>
                  </TableRow>
                ) : paginatedOrders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium font-mono text-xs">{order.orderNumber}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{order.userEmail}</span>
                        {order.tableNumber && (
                          <span className="text-xs text-muted-foreground">Masa {order.tableNumber}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{orderApi.getDeliveryTypeLabel(order.deliveryType)}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{order.total.toFixed(2)} AZN</TableCell>
                    <TableCell>
                      <Badge className={orderApi.getOrderStatusColor(order.status)}>
                        {orderApi.getOrderStatusLabel(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(order.createdAt + 'Z').toLocaleString('az-AZ', { timeZone: 'Asia/Baku' })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 items-center flex-wrap">

                        {/* Detallar */}
                        <Button variant="ghost" size="icon" onClick={() => viewOrderDetails(order.id)} title="Detallar">
                          <Eye className="h-4 w-4" />
                        </Button>

                        {/* Status 1: Gözləyir → Təsdiq / Ləğv / Sil */}
                        {order.status === 1 && (
                          <>
                            <Button variant="ghost" size="icon" className="text-green-600" title="Təsdiq et"
                              onClick={() => updateOrderStatus(order.id, 2)}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-yellow-600" title="Ləğv et"
                              onClick={() => updateOrderStatus(order.id, 8)}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" title="Sil"
                              onClick={() => handleDeleteOrder(order.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}

                        {/* Status 8: Ləğv edilib → Sil */}
                        {order.status === 8 && (
                          <Button variant="ghost" size="icon" className="text-destructive" title="Sil"
                            onClick={() => handleDeleteOrder(order.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Status 2: Təsdiqlənib → Hazırlamağa başla */}
                        {order.status === 2 && (
                          <Button variant="ghost" size="icon" className="text-blue-600" title="Hazırlamağa başla"
                            onClick={() => updateOrderStatus(order.id, 3)}>
                            <Clock className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Status 3: Hazırlanır → Hazırdır */}
                        {order.status === 3 && (
                          <Button variant="ghost" size="icon" className="text-green-600" title="Hazırdır"
                            onClick={() => updateOrderStatus(order.id, 4)}>
                            <Package className="h-4 w-4" />
                          </Button>
                        )}

                        {/* ✅ Status 4 + Götürmə/Restoran (type 2 or 3) → Tamamlandı (status 7) */}
                        {order.status === 4 && order.deliveryType !== DELIVERY && (
                          <Button variant="ghost" size="icon" className="text-green-700" title="Tamamlandı"
                            onClick={() => updateOrderStatus(order.id, 7)}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}

                        {/* ✅ Status 4 + Çatdırılma (type 1) → Kuryer seç dropdown */}
                        {order.deliveryType === DELIVERY && (order.status === 4 || order.status === 3) && (
                          <Select
                            value={selectedCouriers[order.id] ?? ''}
                            onValueChange={value => assignCourier(order.id, value)}
                          >
                            <SelectTrigger className="w-[150px] h-8">
                              <SelectValue placeholder="Kuryer seç">
                                {selectedCouriers[order.id]
                                  ? couriers.find(c => c.id === selectedCouriers[order.id])?.userFullName
                                  : 'Kuryer seç'}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {couriers.map((courier: any) => (
                                <SelectItem key={courier.id} value={courier.id}>
                                  <div className="flex items-center gap-2">
                                    <Truck className="h-3 w-3" />
                                    {courier.userFullName}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {/* ✅ Status 4 + Çatdırılma + Kuryer seçilib → Yola ver (status 5) */}
                        {order.status === 4 && order.deliveryType === DELIVERY && selectedCouriers[order.id] && (
                          <Button variant="ghost" size="icon" className="text-cyan-600" title="Yola ver"
                            onClick={() => updateOrderStatus(order.id, 5)}>
                            <Truck className="h-4 w-4" />
                          </Button>
                        )}

                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Səhifə {currentPage} / {totalPages} ({filteredOrders.length} sifariş)
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline" size="icon"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {getPageNumbers().map(n => (
                <Button
                  key={n}
                  variant={n === currentPage ? 'default' : 'outline'}
                  size="icon"
                  className="w-9 h-9"
                  onClick={() => setCurrentPage(n)}
                >
                  {n}
                </Button>
              ))}

              <Button
                variant="outline" size="icon"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── Order Details Dialog ── */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Sifariş detalları — {selectedOrder?.orderNumber}</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-lg">Müştəri məlumatları</CardTitle></CardHeader>
                  <CardContent className="grid gap-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedOrder.userEmail}</span>
                    </div>
                    {selectedOrder.deliveryAddress && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedOrder.deliveryAddress}</span>
                      </div>
                    )}
                    {selectedOrder.tableNumber && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Masa:</span>
                        <Badge variant="outline">Masa {selectedOrder.tableNumber}</Badge>
                      </div>
                    )}
                    {selectedOrder.courierName && (
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span>Kuryer: {selectedOrder.courierName}</span>
                      </div>
                    )}
                    {selectedOrder.orderNotes && (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">Qeydlər:</span>
                        <p className="text-sm text-muted-foreground">{selectedOrder.orderNotes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-lg">Məhsullar</CardTitle></CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Məhsul</TableHead>
                          <TableHead className="text-center">Say</TableHead>
                          <TableHead className="text-right">Qiymət</TableHead>
                          <TableHead className="text-right">Cəm</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.items.map(item => (
                          <TableRow key={item.id}>
                            <TableCell>{item.productName}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">{item.price.toFixed(2)} AZN</TableCell>
                            <TableCell className="text-right font-medium">{item.totalPrice.toFixed(2)} AZN</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="border-t-2">
                          <TableCell colSpan={3} className="font-bold">Ara cəm</TableCell>
                          <TableCell className="text-right font-bold">{selectedOrder.subtotal.toFixed(2)} AZN</TableCell>
                        </TableRow>
                        {selectedOrder.discountAmount > 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-green-600">Endirim</TableCell>
                            <TableCell className="text-right text-green-600">-{selectedOrder.discountAmount.toFixed(2)} AZN</TableCell>
                          </TableRow>
                        )}
                        <TableRow className="border-t">
                          <TableCell colSpan={3} className="font-bold text-lg">Cəmi</TableCell>
                          <TableCell className="text-right font-bold text-lg">{selectedOrder.total.toFixed(2)} AZN</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <div className="flex flex-wrap gap-4 items-center justify-between p-4 bg-secondary rounded-lg">
                  <div>
                    <span className="text-sm text-muted-foreground">Tip:</span>
                    <Badge className="ml-2" variant="outline">
                      {orderApi.getDeliveryTypeLabel(selectedOrder.type)}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge className={`ml-2 ${orderApi.getOrderStatusColor(selectedOrder.status)}`}>
                      {orderApi.getOrderStatusLabel(selectedOrder.status)}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Tarix:</span>
                    <span className="ml-2 font-medium">
                      {new Date(selectedOrder.createdAt + 'Z').toLocaleString('az-AZ', { timeZone: 'Asia/Baku' })}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ── Delete Confirmation ── */}
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sifarişi silmək istədiyinizdən əminsiniz?</AlertDialogTitle>
              <AlertDialogDescription>
                Bu əməliyyat geri qaytarıla bilməz. Yalnız Gözləyir və ya Ləğv edilib statuslu sifarişlər silinə bilər.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Ləğv et</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteOrder}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Sil
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default AdminOrdersPage;