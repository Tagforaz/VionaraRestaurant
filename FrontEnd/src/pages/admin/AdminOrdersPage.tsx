import { useState, useEffect, useRef, useCallback } from 'react';
import { useOrderPolling } from '@/hooks/useOrderPolling';
import { Search, Eye, CheckCircle, XCircle, Clock, MapPin, Mail, Truck, Package, Trash2 } from 'lucide-react';
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
import { GetOrderDto, GetOrderListItemDto, OrderStatusEnum, DeliveryTypeEnum } from '@/types';
import * as orderApi from '@/api/dev/orderDev';
import * as courierApi from '@/api/dev/courierDev';

const AdminOrdersPage = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [orders, setOrders] = useState<GetOrderListItemDto[]>([]);
  const [selectedCouriers, setSelectedCouriers] = useState<Record<string, string>>({});
  const [selectedOrder, setSelectedOrder] = useState<GetOrderDto | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [couriers, setCouriers] = useState<any[]>([]);
  const [page] = useState(1);
  const [take] = useState(50);

  // Bildiriş üçün köhnə sifariş ID-lərini saxla
  const prevOrderIdsRef = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isFirstLoadRef = useRef(true);

  // Audio yüklə
  useEffect(() => {
    audioRef.current = new Audio(
      'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDV/zPLTgjMGHm7A7+OZURE'
    );
    audioRef.current.volume = 0.6;

    // Browser notification icazəsi
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    loadOrders();
    loadCouriers();
  }, []);

  const notifyNewOrders = useCallback((newOrders: GetOrderListItemDto[]) => {
    if (newOrders.length === 0) return;

    // Səs çal
    audioRef.current?.play().catch(() => {});

    // Toast bildirişi
    toast('🛎️ Yeni sifariş!', {
      description: `${newOrders.length} yeni sifariş daxil oldu`,
      duration: 6000,
      action: {
        label: 'Bax',
        onClick: () => setStatusFilter(OrderStatusEnum.Pending.toString()),
      },
    });

    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🛎️ Yeni sifariş!', {
        body: `${newOrders.length} yeni sifariş gəldi`,
        icon: '/logo.png',
        requireInteraction: true,
      });
    }
  }, []);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const response = await orderApi.getOrders(page, take);
      const list: GetOrderListItemDto[] = Array.isArray(response.data) ? response.data : [];
      setOrders(list);

      // İlk yükləmədə ref-i doldur, bildiriş göstərmə
      if (isFirstLoadRef.current) {
        prevOrderIdsRef.current = new Set(list.map(o => o.id));
        isFirstLoadRef.current = false;
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Sifarişlər yüklənərkən xəta baş verdi';
      toast.error('Xəta', { description: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  // Polling funksiyası — yeni sifarişləri aşkar edir
  const fetchForPolling = useCallback(async () => {
    try {
      const response = await orderApi.getOrders(page, take);
      const list: GetOrderListItemDto[] = Array.isArray(response.data) ? response.data : [];

      if (!isFirstLoadRef.current) {
        // Əvvəlki ID-lərdə olmayan yeni sifarişlər
        const newOrders = list.filter(o => !prevOrderIdsRef.current.has(o.id));
        notifyNewOrders(newOrders);
      }

      // Ref-i yenilə
      prevOrderIdsRef.current = new Set(list.map(o => o.id));
      setOrders(list);
      return list;
    } catch {
      return null;
    }
  }, [page, notifyNewOrders]);

  useOrderPolling({
    fetchFn: fetchForPolling,
    intervalMs: 15000, // 15 saniyəlik interval
  });

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

  const viewOrderDetails = async (orderId: string) => {
    try {
      const response = await orderApi.getOrder(orderId);
      setSelectedOrder(response.data);
      setIsDetailsOpen(true);
    } catch (error: any) {
      toast.error('Xəta', { description: error.response?.data?.message || 'Sifariş detalları yüklənmədi' });
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatusEnum, courierId?: string) => {
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
    const order = orders.find(o => o.id === orderId);
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

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === parseInt(statusFilter);
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">{t('admin.orders')}</h1>
          <p className="text-muted-foreground">{t('admin.manageOrders')}</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('admin.searchOrders')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder={t('admin.allStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.allStatus')}</SelectItem>
              <SelectItem value={OrderStatusEnum.Pending.toString()}>Gözləyir</SelectItem>
              <SelectItem value={OrderStatusEnum.Confirmed.toString()}>Təsdiqlənib</SelectItem>
              <SelectItem value={OrderStatusEnum.Preparing.toString()}>Hazırlanır</SelectItem>
              <SelectItem value={OrderStatusEnum.Ready.toString()}>Hazırdır</SelectItem>
              <SelectItem value={OrderStatusEnum.OutForDelivery.toString()}>Yoldadır</SelectItem>
              <SelectItem value={OrderStatusEnum.Delivered.toString()}>Çatdırılıb</SelectItem>
              <SelectItem value={OrderStatusEnum.Completed.toString()}>Tamamlandı</SelectItem>
              <SelectItem value={OrderStatusEnum.Cancelled.toString()}>Ləğv edilib</SelectItem>
              <SelectItem value={OrderStatusEnum.Failed.toString()}>Uğursuz</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders Table */}
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
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Sifariş tapılmadı
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
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
                    <TableCell>
                      {new Date(order.createdAt + 'Z').toLocaleString('az-AZ', { timeZone: 'Asia/Baku' })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2 items-center flex-wrap">
                        <Button variant="ghost" size="icon" onClick={() => viewOrderDetails(order.id)} title="Detallar">
                          <Eye className="h-4 w-4" />
                        </Button>

                        {order.status === OrderStatusEnum.Pending && (
                          <>
                            <Button variant="ghost" size="icon" className="text-green-600" title="Təsdiq et"
                              onClick={() => updateOrderStatus(order.id, OrderStatusEnum.Confirmed)}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-yellow-600" title="Ləğv et"
                              onClick={() => updateOrderStatus(order.id, OrderStatusEnum.Cancelled)}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" title="Sil"
                              onClick={() => handleDeleteOrder(order.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}

                        {order.status === OrderStatusEnum.Cancelled && (
                          <Button variant="ghost" size="icon" className="text-destructive" title="Sil"
                            onClick={() => handleDeleteOrder(order.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}

                        {order.status === OrderStatusEnum.Confirmed && (
                          <Button variant="ghost" size="icon" className="text-blue-600" title="Hazırlamağa başla"
                            onClick={() => updateOrderStatus(order.id, OrderStatusEnum.Preparing)}>
                            <Clock className="h-4 w-4" />
                          </Button>
                        )}

                        {order.status === OrderStatusEnum.Preparing && (
                          <Button variant="ghost" size="icon" className="text-green-600" title="Hazırdır"
                            onClick={() => updateOrderStatus(order.id, OrderStatusEnum.Ready)}>
                            <Package className="h-4 w-4" />
                          </Button>
                        )}

                        {order.deliveryType === DeliveryTypeEnum.Delivery &&
                          (order.status === OrderStatusEnum.Ready || order.status === OrderStatusEnum.Preparing) && (
                          <Select
                            value={selectedCouriers[order.id] ?? ''}
                            onValueChange={value => assignCourier(order.id, value)}
                          >
                            <SelectTrigger className="w-[160px] h-8">
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Order Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Sifariş detalları - {selectedOrder?.orderNumber}</DialogTitle>
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

        {/* Delete Confirmation */}
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