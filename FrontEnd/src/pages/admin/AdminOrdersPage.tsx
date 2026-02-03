import { useState, useEffect, useRef } from 'react';
import { Search, Eye, CheckCircle, XCircle, Clock, User, MapPin, Phone, Mail } from 'lucide-react';
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
import { toast } from '@/hooks/use-toast';
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
  const [statusFilter, setStatusFilter] = useState('all');
  const [orders, setOrders] = useState(demoOrders);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const previousReadyCountRef = useRef<number>(0);
  const previousPendingCountRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Request notification permission on component mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
      });
    } else if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // Create audio element for notification sound
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDV/zPLTgjMGHm7A7+OZURE');
    
    // Initialize previous counts
    const readyOrders = demoOrders.filter(o => o.status === 'ready');
    previousReadyCountRef.current = readyOrders.length;
    const pendingOrders = demoOrders.filter(o => o.status === 'pending');
    previousPendingCountRef.current = pendingOrders.length;
  }, []);

  // Check for new ready orders periodically
  useEffect(() => {
    const checkForReadyOrders = () => {
      const readyOrders = orders.filter(o => o.status === 'ready');
      const currentReadyCount = readyOrders.length;

      // If there are more ready orders than before, show notification
      if (currentReadyCount > previousReadyCountRef.current) {
        const newReadyCount = currentReadyCount - previousReadyCountRef.current;
        const latestOrder = readyOrders[0];

        // Play notification sound
        if (audioRef.current) {
          audioRef.current.play().catch(err => console.log('Audio play failed:', err));
        }

        // Show toast notification
        toast({
          title: t('admin.orderReady'),
          description: `${t('admin.order')} ${latestOrder.id} - ${latestOrder.customer}`,
          duration: 5000,
        });

        // Show browser notification
        if (notificationPermission === 'granted') {
          new Notification(t('admin.orderReady'), {
            body: `${t('admin.order')} ${latestOrder.id} - ${latestOrder.customer}`,
            icon: '/favicon.ico',
            tag: `order-ready-${latestOrder.id}`,
            requireInteraction: true,
          });
        }
      }

      previousReadyCountRef.current = currentReadyCount;
    };

    const checkForPendingOrders = () => {
      const pendingOrders = orders.filter(o => o.status === 'pending');
      const currentPendingCount = pendingOrders.length;

      if (currentPendingCount > previousPendingCountRef.current) {
        const newPendingCount = currentPendingCount - previousPendingCountRef.current;
        const latestOrder = pendingOrders[0];

        // Play notification sound
        if (audioRef.current) {
          audioRef.current.play().catch(err => console.log('Audio play failed:', err));
        }

        // Show toast notification
        toast({
          title: t('admin.newOrder'),
          description: `${t('admin.order')} ${latestOrder.id} - ${latestOrder.customer}`,
          duration: 5000,
        });

        // Show browser notification
        if (notificationPermission === 'granted') {
          new Notification(t('admin.newOrder'), {
            body: `${t('admin.order')} ${latestOrder.id} - ${latestOrder.customer}`,
            icon: '/favicon.ico',
            tag: `order-pending-${latestOrder.id}`,
            requireInteraction: true,
          });
        }
      }

      previousPendingCountRef.current = currentPendingCount;
    };

    // Check every 5 seconds
    const interval = setInterval(() => {
      checkForReadyOrders();
      checkForPendingOrders();
    }, 5000);

    return () => clearInterval(interval);
  }, [orders, notificationPermission, t]);

  const assignCourier = (orderId: string, courierId: string) => {
    const courier = availableCouriers.find(c => c.id === courierId);
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, courierId, status: 'assigned' } : order
      )
    );
    toast({
      title: t('admin.courierAssigned'),
      description: `${t('admin.order')} ${orderId} - ${courier?.name}`,
    });
  };

  const handleViewDetails = (order: any) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const handleAcceptOrder = (orderId: string) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, status: 'preparing' } : order
      )
    );
    toast({
      title: t('admin.orderAccepted'),
      description: `${t('admin.order')} ${orderId}`,
    });
  };

  const handleCancelOrder = (orderId: string) => {
    setOrderToCancel(orderId);
    setIsAlertOpen(true);
  };

  const confirmCancelOrder = () => {
    if (orderToCancel) {
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderToCancel ? { ...order, status: 'cancelled' } : order
        )
      );
      toast({
        title: t('admin.orderCancelled'),
        description: `${t('admin.order')} ${orderToCancel}`,
        variant: 'destructive',
      });
      setIsAlertOpen(false);
      setOrderToCancel(null);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
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
              <SelectItem value="pending">{t('admin.pending')}</SelectItem>
              <SelectItem value="preparing">{t('admin.preparing')}</SelectItem>
              <SelectItem value="ready">{t('admin.ready')}</SelectItem>
              <SelectItem value="delivered">{t('admin.delivered')}</SelectItem>
              <SelectItem value="cancelled">{t('admin.cancelled')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Orders Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.orderId')}</TableHead>
                  <TableHead>{t('admin.customer')}</TableHead>
                  <TableHead>{t('admin.items')}</TableHead>
                  <TableHead>{t('admin.total')}</TableHead>
                  <TableHead>{t('admin.status')}</TableHead>
                  <TableHead>{t('admin.date')}</TableHead>
                  <TableHead className="text-right">{t('admin.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell>{order.items} {t('admin.items')}</TableCell>
                    <TableCell>${order.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[order.status]}>
                        {t(`admin.${order.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>{order.date}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2 items-center">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="View Details"
                          onClick={() => handleViewDetails(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {order.status === 'pending' && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-green-600" 
                              title="Accept"
                              onClick={() => handleAcceptOrder(order.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive" 
                              title="Reject"
                              onClick={() => handleCancelOrder(order.id)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {order.status === 'preparing' && (
                          <Button variant="ghost" size="icon" className="text-blue-600" title="Mark Ready">
                            <Clock className="h-4 w-4" />
                          </Button>
                        )}
                        {/* Courier Assignment for Delivery Orders */}
                        {order.type === 'delivery' && (order.status === 'ready' || order.status === 'preparing') && !order.courierId && (
                          <Select onValueChange={(value) => assignCourier(order.id, value)}>
                            <SelectTrigger className="w-[160px] h-8">
                              <SelectValue placeholder={t('admin.assignCourier')} />
                            </SelectTrigger>
                            <SelectContent>
                              {availableCouriers.filter(c => c.activeOrders < 2).map(courier => (
                                <SelectItem key={courier.id} value={courier.id}>
                                  <div className="flex items-center gap-2">
                                    <User className="h-3 w-3" />
                                    {courier.name} ({courier.activeOrders})
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {order.courierId && (
                          <Badge variant="outline" className="text-xs">
                            <User className="h-3 w-3 mr-1" />
                            {availableCouriers.find(c => c.id === order.courierId)?.name}
                          </Badge>
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('admin.orderDetails')} - {selectedOrder?.id}</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                {/* Customer Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('admin.customerInfo')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{selectedOrder.customer}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedOrder.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedOrder.email}</span>
                    </div>
                    {selectedOrder.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedOrder.address}</span>
                      </div>
                    )}
                    {selectedOrder.tableNumber && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{t('admin.table')}:</span>
                        <span>{selectedOrder.tableNumber}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Order Items */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('admin.orderItems')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('admin.product')}</TableHead>
                          <TableHead className="text-center">{t('admin.quantity')}</TableHead>
                          <TableHead className="text-right">{t('admin.price')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.orderItems?.map((item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={2} className="font-bold">{t('admin.total')}</TableCell>
                          <TableCell className="text-right font-bold">${selectedOrder.total.toFixed(2)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Order Info */}
                <div className="flex justify-between items-center p-4 bg-secondary rounded-lg">
                  <div>
                    <span className="text-sm text-muted-foreground">{t('admin.orderType')}:</span>
                    <span className="ml-2 font-medium">{selectedOrder.type === 'delivery' ? t('admin.delivery') : t('admin.dineIn')}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">{t('admin.status')}:</span>
                    <Badge className={`ml-2 ${statusColors[selectedOrder.status]}`}>
                      {t(`admin.${selectedOrder.status}`)}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">{t('admin.date')}:</span>
                    <span className="ml-2 font-medium">{selectedOrder.date}</span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Cancel Order Alert Dialog */}
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('admin.confirmCancel')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('admin.confirmCancelDescription')} {orderToCancel}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('admin.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmCancelOrder} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {t('admin.confirmButton')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default AdminOrdersPage;
