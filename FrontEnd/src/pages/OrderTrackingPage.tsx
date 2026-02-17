import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Phone, Clock, Package, Bike, Check, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CustomerLayout } from '@/layouts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Order, OrderStatus } from '@/types';
import courierTrackingService, { CourierLocationDto, CourierAssignedDto } from '@/services/courierTrackingService';
import orderStatusService, { OrderStatusUpdateDto } from '@/services/orderStatusService';
import { toast } from 'sonner';
import OrderTrackingMap from '@/components/OrderTrackingMap';

// Mock data
const DEMO_ORDER: Order = {
  id: 'ORD-12345',
  userId: 'user1',
  customerName: 'Elvin Məmmədov',
  customerPhone: '+994 50 123 45 67',
  customerEmail: 'elvin@example.com',
  items: [
    { productId: '1', productName: 'Grilled Ribeye Steak', price: 42.99, quantity: 1 },
    { productId: '5', productName: 'Tiramisu', price: 8.99, quantity: 2 },
  ],
  status: 'out_for_delivery',
  type: 'delivery',
  deliveryAddress: {
    street: '28 May küçəsi 15',
    city: 'Bakı',
    state: 'Nizami rayonu',
    zipCode: 'AZ1000',
    country: 'Azerbaijan',
    latitude: 40.3777,
    longitude: 49.8920,
  },
  courier: {
    id: '2',
    userId: 'user2',
    firstName: 'Nigar',
    lastName: 'Əliyeva',
    email: 'nigar@courier.com',
    phone: '+994 51 234 56 78',
    vehicleType: 'scooter',
    vehicleNumber: '90-BB-456',
    status: 'busy',
    rating: 4.9,
    totalDeliveries: 312,
    activeDeliveries: 2,
    isActive: true,
    profilePhoto: undefined,
    currentLocation: {
      latitude: 40.3777,
      longitude: 49.8920,
      lastUpdated: new Date().toISOString(),
    },
    createdAt: '2023-11-20T10:00:00Z',
  },
  subtotal: 60.97,
  deliveryFee: 3.00,
  discount: 0,
  total: 63.97,
  specialInstructions: 'Please ring the bell',
  estimatedTime: '25-35 min',
  deliveryTracking: {
    orderId: 'ORD-12345',
    courierId: '2',
    status: 'out_for_delivery',
    estimatedDeliveryTime: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
    deliveryAddress: {
      street: '28 May küçəsi 15',
      city: 'Bakı',
      state: 'Nizami rayonu',
      zipCode: 'AZ1000',
      country: 'Azerbaijan',
      latitude: 40.3777,
      longitude: 49.8920,
    },
    customerLocation: {
      latitude: 40.3777,
      longitude: 49.8920,
    },
    currentLocation: {
      latitude: 40.3850,
      longitude: 49.8850,
    },
    updates: [
      {
        id: '1',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        status: 'confirmed',
        message: 'Order confirmed',
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        status: 'preparing',
        message: 'Preparing your order',
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        status: 'out_for_delivery',
        message: 'Courier is on the way',
      },
    ],
  },
  createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
};

const STATUS_STEPS: OrderStatus[] = ['confirmed', 'preparing', 'out_for_delivery', 'delivered'];

// Helper to convert backend enum to frontend string
const getOrderStatusString = (status: number): OrderStatus => {
  const statusMap: Record<number, OrderStatus> = {
    0: 'pending',
    1: 'confirmed',
    2: 'preparing',
    3: 'confirmed', // Ready
    4: 'out_for_delivery',
    5: 'delivered',
    6: 'delivered', // Completed
    7: 'cancelled',
    8: 'cancelled', // Failed
  };
  return statusMap[status] || 'pending';
};

export default function OrderTrackingPage() {
  const { orderId } = useParams();
  const { t } = useTranslation();
  const [order, setOrder] = useState<Order>(DEMO_ORDER);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [courierLocation, setCourierLocation] = useState<CourierLocationDto | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // SignalR Connection & Real-time updates
  useEffect(() => {
    const initSignalR = async () => {
      try {
        // Start both hubs
        await Promise.all([
          orderStatusService.start(),
          courierTrackingService.start()
        ]);
        
        setIsConnected(true);
        console.log('✅ SignalR connected for order tracking');

        // Subscribe to order status changes
        orderStatusService.on('OrderStatusChanged', (update: OrderStatusUpdateDto) => {
          console.log('📦 Order status updated:', update);
          
          if (update.orderId === orderId) {
            setOrder(prev => ({
              ...prev,
              status: getOrderStatusString(update.status),
            }));
            
            toast.success(update.message || `Status: ${t(`order.status.${getOrderStatusString(update.status)}`)}`);
          }
        });

        // Subscribe to courier assignment
        courierTrackingService.on('CourierAssigned', (data: CourierAssignedDto) => {
          console.log('🚗 Courier assigned:', data);
          
          if (data.orderId === orderId) {
            toast.success(`${t('order.tracking.courierAssigned')}: ${data.courierName}`);
          }
        });

        // Subscribe to courier location updates
        courierTrackingService.on('CourierLocationUpdated', (location: CourierLocationDto) => {
          console.log('📍 Courier location updated:', location);
          
          if (location.orderId === orderId) {
            setCourierLocation(location);
          }
        });

        // Subscribe to specific order if orderId exists
        if (orderId) {
          await Promise.all([
            orderStatusService.subscribeToOrder(orderId),
            courierTrackingService.trackOrder(orderId)
          ]);
        }

      } catch (error) {
        console.error('SignalR initialization failed:', error);
        toast.error(t('order.tracking.connectionFailed'));
      }
    };

    initSignalR();

    // Cleanup on unmount
    return () => {
      if (orderId) {
        orderStatusService.unsubscribeFromOrder(orderId).catch(console.error);
        courierTrackingService.stopTrackingOrder(orderId).catch(console.error);
      }
      
      orderStatusService.off('OrderStatusChanged');
      courierTrackingService.off('CourierAssigned');
      courierTrackingService.off('CourierLocationUpdated');
      
      orderStatusService.stop();
      courierTrackingService.stop();
    };
  }, [orderId, t]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000); // Update every 10 seconds

    return () => clearInterval(timer);
  }, []);

  const getStatusIndex = (status: OrderStatus) => {
    return STATUS_STEPS.indexOf(status);
  };

  const currentStatusIndex = getStatusIndex(order.status);

  const getStatusColor = (stepIndex: number) => {
    if (stepIndex < currentStatusIndex) return 'bg-green-500';
    if (stepIndex === currentStatusIndex) return 'bg-blue-500';
    return 'bg-gray-300';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' });
  };

  const getEstimatedTime = () => {
    if (!order.deliveryTracking?.estimatedDeliveryTime) return null;
    const eta = new Date(order.deliveryTracking.estimatedDeliveryTime);
    const diff = eta.getTime() - currentTime.getTime();
    const minutes = Math.floor(diff / 60000);
    return minutes > 0 ? `~${minutes} ${t('order.tracking.minutes')}` : t('order.tracking.arriving');
  };

  return (
    <CustomerLayout>
      <div className="container max-w-6xl py-8">
        {/* Back Button */}
        <Link to="/menu">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Button>
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Tracking Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">
                      {t('order.tracking.title')}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('order.tracking.orderNumber')}: {order.id}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    {t(`order.status.${order.status}`)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {order.type === 'delivery' && order.deliveryTracking && (
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{t('order.tracking.estimatedArrival')}</p>
                        <p className="text-2xl font-bold text-primary">
                          {getEstimatedTime()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progress Steps */}
            <Card>
              <CardHeader>
                <CardTitle>{t('order.tracking.orderProgress')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {STATUS_STEPS.map((status, index) => {
                    const isCompleted = index < currentStatusIndex;
                    const isCurrent = index === currentStatusIndex;
                    const update = order.deliveryTracking?.updates.find((u) => u.status === status);

                    return (
                      <div key={status} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full ${
                              isCompleted || isCurrent
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {isCompleted ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              <span>{index + 1}</span>
                            )}
                          </div>
                          {index < STATUS_STEPS.length - 1 && (
                            <div
                              className={`h-16 w-0.5 ${
                                isCompleted ? 'bg-primary' : 'bg-muted'
                              }`}
                            />
                          )}
                        </div>
                        <div className="flex-1 pb-8">
                          <p className={`font-medium ${isCurrent ? 'text-primary' : ''}`}>
                            {t(`order.status.${status}`)}
                          </p>
                          {update && (
                            <>
                              <p className="text-sm text-muted-foreground">
                                {update.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatTime(update.timestamp)}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Map - Live Courier Tracking */}
            {order.type === 'delivery' && order.courier && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{t('order.tracking.liveTracking')}</CardTitle>
                    {isConnected && (
                      <Badge variant="outline" className="text-green-600">
                        <div className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse" />
                        Live
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {courierLocation ? (
                    <OrderTrackingMap
                      courierLocation={{
                        lat: Number(courierLocation.latitude),
                        lng: Number(courierLocation.longitude)
                      }}
                      customerLocation={order.deliveryAddress ? {
                        lat: order.deliveryAddress.latitude,
                        lng: order.deliveryAddress.longitude
                      } : undefined}
                      restaurantLocation={{
                        lat: 40.3777,
                        lng: 49.8920
                      }}
                    />
                  ) : (
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {isConnected 
                            ? t('order.tracking.waitingForCourier')
                            : t('order.tracking.mapPlaceholder')
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Courier Info */}
            {order.type === 'delivery' && order.courier && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('order.tracking.yourCourier')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={order.courier.profilePhoto} />
                      <AvatarFallback>
                        {order.courier.firstName[0]}
                        {order.courier.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {order.courier.firstName} {order.courier.lastName}
                      </p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Bike className="h-3 w-3" />
                        <span>{t(`courier.vehicleTypes.${order.courier.vehicleType}`)}</span>
                        <span>• {order.courier.vehicleNumber}</span>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <Button variant="outline" className="w-full" asChild>
                    <a href={`tel:${order.courier.phone}`}>
                      <Phone className="mr-2 h-4 w-4" />
                      {t('order.tracking.callCourier')}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Delivery Address */}
            {order.type === 'delivery' && order.deliveryAddress && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('order.tracking.deliveryAddress')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p>{order.deliveryAddress.street}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.deliveryAddress.city}, {order.deliveryAddress.state}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>{t('order.tracking.orderSummary')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.productId} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}x {item.productName}
                      </span>
                      <span className="font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{t('cart.subtotal')}</span>
                    <span>${order.subtotal.toFixed(2)}</span>
                  </div>
                  {order.deliveryFee > 0 && (
                    <div className="flex justify-between">
                      <span>{t('order.deliveryFee')}</span>
                      <span>${order.deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  {order.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>{t('order.discount')}</span>
                      <span>-${order.discount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>{t('cart.total')}</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
