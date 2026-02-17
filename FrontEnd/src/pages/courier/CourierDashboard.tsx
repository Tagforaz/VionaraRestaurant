import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Package, MapPin, CheckCircle, DollarSign, ArrowLeft, Eye, History } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import courierTrackingService from '@/services/courierTrackingService';
import { useAuth } from '@/auth';

// Mock deliveries data
const mockDeliveries = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    customerName: 'John Doe',
    address: 'Nizami küç. 23',
    phone: '+994 50 123 45 67',
    status: 'on-the-way' as const,
    total: 45.99,
    deliveryFee: 5.00,
    items: [
      { name: 'Pizza Marqarita', quantity: 2 },
      { name: 'Cola 0.5L', quantity: 2 },
    ],
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    customerName: 'Jane Smith',
    address: '28 May küç. 45',
    phone: '+994 50 987 65 43',
    status: 'assigned' as const,
    total: 28.50,
    deliveryFee: 4.50,
    items: [
      { name: 'Burger Classic', quantity: 1 },
      { name: 'Kartof fri böyük', quantity: 1 },
      { name: 'Pepsi 0.5L', quantity: 1 },
    ],
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
  },
];

export const CourierDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState(mockDeliveries);
  const [selectedDelivery, setSelectedDelivery] = useState<typeof mockDeliveries[0] | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const previousAssignedCountRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [locationTracking, setLocationTracking] = useState(false);
  const [signalRConnected, setSignalRConnected] = useState(false);
  const [locationUpdateCount, setLocationUpdateCount] = useState(0);
  const locationWatchIdRef = useRef<number | null>(null);
  
  const stats = {
    assigned: deliveries.filter(d => d.status === 'assigned').length,
    completed: 15,
    active: deliveries.filter(d => d.status === 'on-the-way').length,
    earnings: 245.50,
  };

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
    
    // Initialize previous count
    const assignedDeliveries = mockDeliveries.filter(d => d.status === 'assigned');
    previousAssignedCountRef.current = assignedDeliveries.length;
  }, []);

  // Initialize SignalR and start location tracking
  useEffect(() => {
    const initTracking = async () => {
      try {
        console.log('🔄 SignalR qoşulması başlayır...');
        await courierTrackingService.start();
        console.log('✅ SignalR uğurla qoşuldu!');
        console.log('📡 Courier tracking aktivdir');
        setSignalRConnected(true);
        setLocationTracking(true);
        
        // Start real-time location updates
        if ('geolocation' in navigator) {
          locationWatchIdRef.current = navigator.geolocation.watchPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              
              // Get active delivery (on-the-way status)
              const activeDelivery = deliveries.find(d => d.status === 'on-the-way');
              
              console.log('🔍 User ID:', user?.id, 'tipi:', typeof user?.id);
              console.log('🔍 Active delivery:', activeDelivery?.id);
              
              try {
                // Test üçün OrderId göndərmirik (mock data-dır, database-də real order yoxdur)
                // Real production-da activeDelivery?.id istifadə ediləcək
                await courierTrackingService.updateLocation({
                  courierId: user?.id || '',
                  orderId: undefined, // Mock data olduğu üçün OrderId göndərmirik
                  latitude,
                  longitude,
                  timestamp: new Date(),
                  courierName: `${user?.firstName} ${user?.lastName}`
                });
                setLocationUpdateCount(prev => prev + 1);
                console.log('📍 GPS yeniləndi:', { 
                  latitude: latitude.toFixed(6), 
                  longitude: longitude.toFixed(6),
                  orderId: activeDelivery?.id || 'Aktiv sifariş yoxdur',
                  updateCount: locationUpdateCount + 1
                });
              } catch (error) {
                console.error('Failed to update location:', error);
              }
            },
            (error) => {
              console.error('Geolocation error:', error);
              toast({
                title: 'Konum xətası',
                description: 'GPS koordinatları əldə edilə bilmədi',
                variant: 'destructive',
              });
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            }
          );
        } else {
          toast({
            title: 'GPS dəstəklənmir',
            description: 'Brauzeriniz geolocation dəstəkləmir',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('❌ SignalR qoşulma xətası:', error);
        setSignalRConnected(false);
        setLocationTracking(false);
        toast({
          title: 'Qoşulma xətası',
          description: 'SignalR serverə qoşula bilmədi',
          variant: 'destructive',
        });
      }
    };

    initTracking();

    // Cleanup on unmount
    return () => {
      if (locationWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(locationWatchIdRef.current);
      }
      courierTrackingService.stop();
    };
  }, [deliveries, user]);

  // Check for new assigned deliveries
  useEffect(() => {
    const checkForNewDeliveries = () => {
      const assignedDeliveries = deliveries.filter(d => d.status === 'assigned');
      const currentAssignedCount = assignedDeliveries.length;

      if (currentAssignedCount > previousAssignedCountRef.current) {
        const newDeliveriesCount = currentAssignedCount - previousAssignedCountRef.current;
        const latestDelivery = assignedDeliveries[0];

        // Play notification sound
        if (audioRef.current) {
          audioRef.current.play().catch(err => console.log('Audio play failed:', err));
        }

        // Show toast notification
        toast({
          title: t('courier.newDeliveryAlert'),
          description: `${t('courier.order')} #${latestDelivery.id} - ${latestDelivery.address}`,
          duration: 5000,
        });

        // Show browser notification
        if (notificationPermission === 'granted') {
          new Notification(t('courier.newDeliveryAlert'), {
            body: `${t('courier.order')} #${latestDelivery.id} - ${latestDelivery.customerName}`,
            icon: '/favicon.ico',
            tag: `delivery-${latestDelivery.id}`,
            requireInteraction: true,
          });
        }
      }

      previousAssignedCountRef.current = currentAssignedCount;
    };

    // Check every 5 seconds
    const interval = setInterval(checkForNewDeliveries, 5000);

    return () => clearInterval(interval);
  }, [deliveries, notificationPermission, t]);

  const handleMarkAsDelivered = (deliveryId: string) => {
    setDeliveries(prevDeliveries =>
      prevDeliveries.filter(d => d.id !== deliveryId)
    );
    toast({
      title: t('courier.deliveryCompleted'),
      description: t('courier.deliveryCompletedDesc'),
    });
  };

  const handleStartDelivery = (deliveryId: string) => {
    setDeliveries(prevDeliveries =>
      prevDeliveries.map(d =>
        d.id === deliveryId ? { ...d, status: 'on-the-way' as const } : d
      )
    );
    toast({
      title: t('courier.deliveryStarted'),
      description: t('courier.deliveryStartedDesc'),
    });
  };

  const handleViewDetails = (delivery: typeof mockDeliveries[0]) => {
    setSelectedDelivery(delivery);
    setDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="hover:bg-accent"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{t('courier.panel')}</h1>
          <p className="text-muted-foreground">{t('courier.manageDeliveries')}</p>
        </div>
        <div className="flex gap-2">
          {signalRConnected && (
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse" />
              SignalR Qoşulu
            </Badge>
          )}
          {locationTracking && (
            <Badge variant="outline" className="text-green-600 border-green-600">
              <div className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse" />
              GPS Aktiv {locationUpdateCount > 0 && `(${locationUpdateCount})`}
            </Badge>
          )}
          {!signalRConnected && (
            <Badge variant="outline" className="text-red-600 border-red-600">
              <div className="w-2 h-2 bg-red-600 rounded-full mr-2" />
              SignalR Kəsilib
            </Badge>
          )}
        </div>
        <Button onClick={() => navigate('/courier/history')} variant="outline">
          <History className="h-4 w-4 mr-2" />
          {t('courier.myHistory')}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('courier.assigned')}</CardTitle>
            <Package className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assigned}</div>
            <p className="text-xs text-muted-foreground">{t('courier.assignedDeliveries')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('courier.activeStatus')}</CardTitle>
            <MapPin className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">{t('courier.onTheWay')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('courier.completedToday')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">{t('courier.todayShort')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('courier.earnings')}</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.earnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{t('courier.todayShort')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Deliveries */}
      <Card>
        <CardHeader>
          <CardTitle>{t('courier.activeDeliveries')}</CardTitle>
        </CardHeader>
        <CardContent>
          {deliveries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('courier.noActiveDeliveries')}
            </div>
          ) : (
            <div className="space-y-4">
              {deliveries.map(delivery => (
                <Card key={delivery.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-lg">{t('courier.order')} #{delivery.id}</p>
                          <Badge className={delivery.status === 'on-the-way' ? 'bg-blue-600' : 'bg-amber-600'}>
                            {delivery.status === 'on-the-way' ? t('courier.onTheWayBadge') : t('courier.assignedBadge')}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="font-medium">{delivery.customerName}</p>
                          <p className="text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {delivery.address}
                          </p>
                          <p className="font-bold text-green-600">${delivery.total.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(delivery)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {t('courier.viewDetails')}
                        </Button>
                        {delivery.status === 'assigned' ? (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => handleStartDelivery(delivery.id)}
                          >
                            {t('courier.startDelivery')}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleMarkAsDelivered(delivery.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {t('courier.markDelivered')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('courier.orderDetails')}</DialogTitle>
            <DialogDescription>
              {t('courier.order')} #{selectedDelivery?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedDelivery && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">{t('courier.customerInfo')}</h3>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">{t('courier.name')}:</span> {selectedDelivery.customerName}</p>
                  <p><span className="font-medium">{t('courier.phone')}:</span> {selectedDelivery.phone}</p>
                  <p><span className="font-medium">{t('courier.address')}:</span> {selectedDelivery.address}</p>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">{t('courier.orderItems')}</h3>
                <div className="text-sm space-y-1">
                  {selectedDelivery.items.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{item.quantity}x {item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t pt-3 space-y-1 text-sm">
                <div className="flex justify-between font-semibold">
                  <span>{t('courier.orderTotal')}:</span>
                  <span>${selectedDelivery.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-600 font-semibold">
                  <span>{t('courier.yourEarning')}:</span>
                  <span>${selectedDelivery.deliveryFee.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
