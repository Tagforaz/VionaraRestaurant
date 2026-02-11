import { useState, useEffect, useRef } from 'react';
import { Search, Eye, CheckCircle, XCircle, Clock, User, MapPin, Phone, Mail, Truck, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/layouts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  GetOrderDto, 
  GetOrderListItemDto, 
  OrderStatusEnum, 
  DeliveryTypeEnum 
} from '@/types';
import * as orderApi from '@/api/dev/orderDev';
import * as courierApi from '@/api/dev/courierDev';

// Demo data
const demoOrders = [
  { 
    id: 'ORD-001', 
    customer: 'John Doe', 
    total: 45.99, 
    status: 'pending', 
    date: '2024-01-15', 
    items: 3, 
    type: 'delivery', 
    courierId: null,
    phone: '+994 50 123 45 67',
    email: 'john.doe@example.com',
    address: '28 May küç. 123, Bakı',
    orderItems: [
      { name: 'Pizza Marqarita', quantity: 2, price: 18.50 },
      { name: 'Cola 0.5L', quantity: 1, price: 2.99 },
      { name: 'Caesar salat', quantity: 1, price: 6.00 }
    ]
  },
  { 
    id: 'ORD-002', 
    customer: 'Jane Smith', 
    total: 89.50, 
    status: 'preparing', 
    date: '2024-01-15', 
    items: 5, 
    type: 'dine-in', 
    courierId: null,
    phone: '+994 55 234 56 78',
    email: 'jane.smith@example.com',
    address: null,
    tableNumber: 12,
    orderItems: [
      { name: 'Steak medium', quantity: 1, price: 45.00 },
      { name: 'Kartof fri', quantity: 2, price: 8.50 },
      { name: 'Pepsi 0.5L', quantity: 2, price: 5.99 }
    ]
  },
  { 
    id: 'ORD-003', 
    customer: 'Bob Wilson', 
    total: 32.00, 
    status: 'ready', 
    date: '2024-01-15', 
    items: 2, 
    type: 'delivery', 
    courierId: null,
    phone: '+994 70 345 67 89',
    email: 'bob.wilson@example.com',
    address: 'Nizami küç. 45, Bakı',
    orderItems: [
      { name: 'Burger Classic', quantity: 2, price: 12.00 },
      { name: 'Fanta 0.33L', quantity: 2, price: 4.00 }
    ]
  },
  { 
    id: 'ORD-004', 
    customer: 'Alice Brown', 
    total: 67.25, 
    status: 'delivered', 
    date: '2024-01-14', 
    items: 4, 
    type: 'delivery', 
    courierId: 'C1',
    phone: '+994 51 456 78 90',
    email: 'alice.brown@example.com',
    address: 'Azadlıq pros. 78, Bakı',
    orderItems: [
      { name: 'Sushi set', quantity: 1, price: 38.00 },
      { name: 'Miso soup', quantity: 2, price: 12.50 },
      { name: 'Green tea', quantity: 1, price: 3.25 }
    ]
  },
  { 
    id: 'ORD-005', 
    customer: 'Charlie Davis', 
    total: 120.00, 
    status: 'cancelled', 
    date: '2024-01-14', 
    items: 6, 
    type: 'dine-in', 
    courierId: null,
    phone: '+994 77 567 89 01',
    email: 'charlie.davis@example.com',
    address: null,
    tableNumber: 8,
    orderItems: [
      { name: 'Pizza Pepperoni', quantity: 2, price: 24.00 },
      { name: 'Pasta Carbonara', quantity: 2, price: 32.00 },
      { name: 'Tiramisu', quantity: 2, price: 16.00 }
    ]
  },
];

// Available couriers (not busy)
const availableCouriers = [
  { id: 'C1', name: 'Əli Məmmədov', activeOrders: 0, status: 'available' },
  { id: 'C2', name: 'Leyla Həsənova', activeOrders: 0, status: 'available' },
  { id: 'C3', name: 'Rəşad Quliyev', activeOrders: 1, status: 'available' },
  { id: 'C4', name: 'Nigar İbrahimova', activeOrders: 0, status: 'available' },
];

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  preparing: 'bg-blue-100 text-blue-800',
  ready: 'bg-green-100 text-green-800',
  delivered: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
  assigned: 'bg-purple-100 text-purple-800',
};

const AdminOrdersPage = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [orders, setOrders] = useState<GetOrderListItemDto[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<GetOrderDto | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [couriers, setCouriers] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [take] = useState(50);

  // Load orders from backend
  useEffect(() => {
    loadOrders();
    loadCouriers();
  }, [page]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const response = await orderApi.getOrders(page, take);
      setOrders(response.data);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Sifarişlər yüklənərkən xəta baş verdi';
      toast.error('Xəta', { description: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  const loadCouriers = async () => {
    try {
      const response = await courierApi.getCouriers();
      // Filter only available couriers
      const availableCouriers = response.data.filter((c: any) => 
        c.isAvailable && (c.status === 'Active' || c.status === 'Approved')
      );
      setCouriers(availableCouriers);
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
      const errorMsg = error.response?.data?.message || 'Sifariş detalları yüklənərkən xəta baş verdi';
      toast.error('Xəta', { description: errorMsg });
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatusEnum, courierId?: string) => {
    try {
      await orderApi.updateOrder(orderId, { status: newStatus, courierId });
      toast.success('Uğurlu', { description: 'Sifariş statusu yeniləndi' });
      await loadOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        await viewOrderDetails(orderId);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Status yenilənərkən xəta baş verdi';
      toast.error('Xəta', { description: errorMsg });
    }
  };

  const assignCourier = async (orderId: string, courierId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    // When assigning courier, set status to OutForDelivery if Ready
    const newStatus = order.status === OrderStatusEnum.Ready 
      ? OrderStatusEnum.OutForDelivery 
      : order.status;
    
    await updateOrderStatus(orderId, newStatus, courierId);
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
      const errorMsg = error.response?.data?.message || 'Sifariş silinərkən xəta baş verdi';
      toast.error('Xəta', { description: errorMsg });
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
              onChange={(e) => setSearchTerm(e.target.value)}
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
                ) : (
                  filteredOrders.map((order) => (
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
                        <Badge variant="outline">
                          {orderApi.getDeliveryTypeLabel(order.deliveryType)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{order.total.toFixed(2)} AZN</TableCell>
                      <TableCell>
                        <Badge className={orderApi.getOrderStatusColor(order.status)}>
                          {orderApi.getOrderStatusLabel(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(order.createdAt).toLocaleString('az-AZ')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 items-center flex-wrap">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => viewOrderDetails(order.id)}
                            title="Detallar"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {/* Status transitions */}
                          {order.status === OrderStatusEnum.Pending && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-green-600" 
                                title="Təsdiq et"
                                onClick={() => updateOrderStatus(order.id, OrderStatusEnum.Confirmed)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-destructive" 
                                title="Ləğv et"
                                onClick={() => updateOrderStatus(order.id, OrderStatusEnum.Cancelled)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          
                          {order.status === OrderStatusEnum.Confirmed && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-blue-600" 
                              title="Hazırlamağa başla"
                              onClick={() => updateOrderStatus(order.id, OrderStatusEnum.Preparing)}
                            >
                              <Clock className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {order.status === OrderStatusEnum.Preparing && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-green-600" 
                              title="Hazırdır" 
                              onClick={() => updateOrderStatus(order.id, OrderStatusEnum.Ready)}
                            >
                              <Package className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {/* Courier Assignment for Delivery Orders */}
                          {order.deliveryType === DeliveryTypeEnum.Delivery && 
                           (order.status === OrderStatusEnum.Ready || order.status === OrderStatusEnum.Preparing) && (
                            <Select onValueChange={(value) => assignCourier(order.id, value)}>
                              <SelectTrigger className="w-[160px] h-8">
                                <SelectValue placeholder="Kuryer seç" />
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
                          
                          {/* Delete for Pending/Cancelled */}
                          {(order.status === OrderStatusEnum.Pending || order.status === OrderStatusEnum.Cancelled) && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive" 
                              title="Sil"
                              onClick={() => handleDeleteOrder(order.id)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
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
                {/* Customer & Order Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Müştəri məlumatları</CardTitle>
                  </CardHeader>
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

                {/* Order Items */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Məhsullar</CardTitle>
                  </CardHeader>
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
                        {selectedOrder.items.map((item) => (
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

                {/* Order Status Info */}
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
                    <span className="ml-2 font-medium">{new Date(selectedOrder.createdAt).toLocaleString('az-AZ')}</span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Order Alert Dialog */}
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
              <AlertDialogAction 
                onClick={confirmDeleteOrder} 
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
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
