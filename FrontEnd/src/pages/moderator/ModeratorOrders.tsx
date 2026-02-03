import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock, ArrowLeft, Eye, Check, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Mock data
const availableCouriers = [
  { id: '1', name: 'Elvin Məmmədov', status: 'available' },
  { id: '2', name: 'Nigar Həsənova', status: 'available' },
  { id: '3', name: 'Rəşad Quliyev', status: 'available' },
];

const mockOrders = [
  {
    id: '1234',
    customerName: 'Əli Məmmədov',
    customerEmail: 'ali@example.com',
    customerPhone: '+994 50 123 45 67',
    address: 'Nizami küç. 23',
    type: 'delivery',
    items: [
      { name: 'Pizza Marqarita', quantity: 2, price: 18.99 },
      { name: 'Cola 0.5L', quantity: 2, price: 4.00 },
    ],
    status: 'preparing',
    total: 45.99,
    createdAt: new Date().toISOString(),
    courierId: null,
  },
  {
    id: '1235',
    customerName: 'Vəli İsmayılov',
    customerEmail: 'vali@example.com',
    customerPhone: '+994 55 234 56 78',
    tableNumber: '5',
    type: 'dine-in',
    items: [
      { name: 'Burger Classic', quantity: 1, price: 15.50 },
      { name: 'Kartof fri', quantity: 1, price: 8.00 },
      { name: 'Pepsi 0.5L', quantity: 1, price: 5.00 },
    ],
    status: 'pending',
    total: 28.50,
    createdAt: new Date().toISOString(),
  },
  {
    id: '1236',
    customerName: 'Leyla Həsənova',
    customerEmail: 'leyla@example.com',
    customerPhone: '+994 70 345 67 89',
    type: 'pickup',
    items: [
      { name: 'Lahmacun', quantity: 3, price: 6.00 },
    ],
    status: 'ready',
    total: 18.00,
    createdAt: new Date().toISOString(),
  },
];

export const ModeratorOrders = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [orders, setOrders] = useState(mockOrders);
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<typeof mockOrders[0] | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [acceptOrderId, setAcceptOrderId] = useState<string | null>(null);
  const previousReadyCountRef = useRef<number>(0);
  const previousPendingCountRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Request notification permission and initialize audio
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
      });
    } else if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // Initialize audio for notification sound
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBDV/zPLTgjMGHm7A7+OZURE');
    audioRef.current.volume = 0.5;

    // Initialize the count of ready and pending orders
    const readyOrders = mockOrders.filter(order => order.status === 'ready');
    previousReadyCountRef.current = readyOrders.length;
    const pendingOrders = mockOrders.filter(order => order.status === 'pending');
    previousPendingCountRef.current = pendingOrders.length;
  }, []);

  // Poll for ready orders and show notifications
  useEffect(() => {
    const checkForReadyOrders = () => {
      const readyOrders = orders.filter(order => order.status === 'ready');
      const currentReadyCount = readyOrders.length;

      if (currentReadyCount > previousReadyCountRef.current) {
        const newReadyOrders = currentReadyCount - previousReadyCountRef.current;
        
        // Play audio alert
        if (audioRef.current) {
          audioRef.current.play().catch(err => console.error('Audio play failed:', err));
        }

        // Show toast notification
        toast({
          title: t('admin.orderReady'),
          description: t('admin.orderReady') + ` (${newReadyOrders})`,
          duration: 5000,
        });

        // Show browser notification
        if (notificationPermission === 'granted') {
          new Notification(t('admin.orderReady'), {
            body: `${newReadyOrders} ${t('admin.order')}`,
            icon: '/logo.png',
            requireInteraction: true,
          });
        }
      }

      previousReadyCountRef.current = currentReadyCount;
    };

    const checkForPendingOrders = () => {
      const pendingOrders = orders.filter(order => order.status === 'pending');
      const currentPendingCount = pendingOrders.length;

      if (currentPendingCount > previousPendingCountRef.current) {
        const newPendingOrders = currentPendingCount - previousPendingCountRef.current;
        
        // Play audio alert
        if (audioRef.current) {
          audioRef.current.play().catch(err => console.error('Audio play failed:', err));
        }

        // Show toast notification
        toast({
          title: t('admin.newOrder'),
          description: t('admin.newOrder') + ` (${newPendingOrders})`,
          duration: 5000,
        });

        // Show browser notification
        if (notificationPermission === 'granted') {
          new Notification(t('admin.newOrder'), {
            body: `${newPendingOrders} ${t('admin.order')}`,
            icon: '/logo.png',
            requireInteraction: true,
          });
        }
      }

      previousPendingCountRef.current = currentPendingCount;
    };

    const interval = setInterval(() => {
      checkForReadyOrders();
      checkForPendingOrders();
    }, 5000);
    return () => clearInterval(interval);
  }, [orders, notificationPermission, t]);

  const handleViewDetails = (order: typeof mockOrders[0]) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const handleAcceptOrder = () => {
    if (acceptOrderId) {
      setOrders(orders.map(o => 
        o.id === acceptOrderId ? { ...o, status: 'preparing' } : o
      ));
      toast({
        title: t('admin.orderAccepted'),
        description: `${t('admin.order')} #${acceptOrderId} ${t('admin.orderAccepted')}`,
      });
      setAcceptOrderId(null);
    }
  };

  const handleCancelOrder = () => {
    if (cancelOrderId) {
      setOrders(orders.map(o => 
        o.id === cancelOrderId ? { ...o, status: 'cancelled' } : o
      ));
      toast({
        title: t('admin.orderCancelled'),
        description: `${t('admin.order')} #${cancelOrderId} ${t('admin.orderCancelled')}`,
        variant: 'destructive',
      });
      setCancelOrderId(null);
    }
  };

  const handleAssignCourier = (orderId: string, courierId: string) => {
    setOrders(orders.map(o => 
      o.id === orderId ? { ...o, courierId } : o
    ));
    const courier = availableCouriers.find(c => c.id === courierId);
    toast({
      title: t('admin.courierAssigned'),
      description: `${courier?.name} ${t('admin.assigned')} ${t('admin.order')} #${orderId}`,
    });
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { label: t('admin.pending'), variant: 'secondary' as const },
      preparing: { label: t('admin.preparing'), variant: 'default' as const },
      ready: { label: t('admin.ready'), variant: 'default' as const },
      delivered: { label: t('admin.delivered'), variant: 'default' as const },
      cancelled: { label: t('admin.cancelled'), variant: 'destructive' as const },
    };

    const s = config[status as keyof typeof config] || { label: status, variant: 'default' as const };
    const className = status === 'preparing' ? 'bg-blue-600' : status === 'ready' ? 'bg-green-600' : '';
    return <Badge variant={s.variant} className={className}>{s.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const labels = {
      delivery: t('admin.delivery'),
      'dine-in': t('admin.dineIn'),
      pickup: t('moderator.pickup'),
    };
    return <Badge variant="outline">{labels[type as keyof typeof labels]}</Badge>;
  };

  const filterOrders = (tab: string) => {
    if (tab === 'all') return orders;
    if (tab === 'external') return orders.filter(o => o.type === 'delivery' || o.type === 'pickup');
    if (tab === 'internal') return orders.filter(o => o.type === 'dine-in');
    return orders;
  };

  const filteredOrders = filterOrders(selectedTab);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/moderator')}
          className="hover:bg-accent"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{t('moderator.stats.orders')}</h1>
          <p className="text-muted-foreground">{t('moderator.ordersDesc')}</p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="all">{t('chef.all')} ({orders.length})</TabsTrigger>
          <TabsTrigger value="external">
            {t('moderator.external')} ({orders.filter(o => o.type === 'delivery' || o.type === 'pickup').length})
          </TabsTrigger>
          <TabsTrigger value="internal">
            {t('moderator.dineIn')} ({orders.filter(o => o.type === 'dine-in').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4 mt-6">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">{t('chef.noOrdersFound')}</p>
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map(order => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="bg-muted/30 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-xl">{t('admin.order')} #{order.id}</CardTitle>
                      {getTypeBadge(order.type)}
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">{t('admin.customer')}:</span>
                      <span className="font-semibold">{order.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">{t('admin.items')}:</span>
                      <span className="font-semibold">{order.items?.length || 0} {t('admin.items')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">{t('admin.total')}:</span>
                      <span className="font-bold text-green-600">${order.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {t('admin.time')}:
                      </span>
                      <span className="font-semibold">{new Date(order.createdAt).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* Courier Assignment for Delivery Orders */}
                  {order.type === 'delivery' && order.status !== 'cancelled' && (
                    <div className="pt-3 border-t">
                      <label className="text-sm font-semibold mb-2 block">
                        {t('admin.assignCourier')}:
                      </label>
                      <Select
                        value={order.courierId || undefined}
                        onValueChange={(value) => handleAssignCourier(order.id, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t('admin.assignCourier')} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCouriers.map((courier) => (
                            <SelectItem key={courier.id} value={courier.id}>
                              {courier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewDetails(order)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {t('courier.viewDetails')}
                    </Button>
                    {order.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => setAcceptOrderId(order.id)}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          {t('chef.acceptOrder')}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1"
                          onClick={() => setCancelOrderId(order.id)}
                        >
                          <X className="h-4 w-4 mr-2" />
                          {t('admin.cancel')}
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Order Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('admin.orderDetails')}</DialogTitle>
            <DialogDescription>
              {t('admin.order')} #{selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">{t('admin.customerInfo')}</h3>
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">{t('admin.name')}:</span> {selectedOrder.customerName}</p>
                    <p><span className="font-medium">{t('admin.email')}:</span> {selectedOrder.customerEmail}</p>
                    <p><span className="font-medium">{t('admin.phone')}:</span> {selectedOrder.customerPhone}</p>
                    {selectedOrder.address && (
                      <p><span className="font-medium">{t('admin.address')}:</span> {selectedOrder.address}</p>
                    )}
                    {selectedOrder.tableNumber && (
                      <p><span className="font-medium">{t('admin.table')}:</span> {selectedOrder.tableNumber}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">{t('admin.orderType')}</h3>
                  <div className="text-sm space-y-1">
                    <p>{getTypeBadge(selectedOrder.type)}</p>
                    <p>{getStatusBadge(selectedOrder.status)}</p>
                  </div>
                </div>
              </div>
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
                      {selectedOrder.items?.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-2">{item.name}</td>
                          <td className="text-center p-2">{item.quantity}</td>
                          <td className="text-right p-2">${item.price.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t font-bold">
                <span>{t('admin.total')}:</span>
                <span className="text-lg">${selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Accept Order Confirmation */}
      <AlertDialog open={!!acceptOrderId} onOpenChange={() => setAcceptOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('chef.confirmAccept')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('chef.confirmAcceptDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleAcceptOrder}>
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Order Confirmation */}
      <AlertDialog open={!!cancelOrderId} onOpenChange={() => setCancelOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.confirmCancel')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.confirmCancelDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelOrder} className="bg-destructive hover:bg-destructive/90">
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
