import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ShoppingBag, CalendarDays, Star, QrCode, Shield, TrendingUp, Package, Clock, X, MapPin, Phone, User } from 'lucide-react';

export const ModeratorDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  const stats = {
    totalOrders: 85,
    activeReservations: 12,
    pendingReviews: 8,
  };

  const recentActivity = [
    { id: '1234', type: 'order', action: 'Yeni sifariş - Çatdırılma', time: '3 dəq əvvəl', status: 'new' },
    { id: '1235', type: 'reservation', action: 'Masa rezervasiyası', time: '15 dəq əvvəl', status: 'pending' },
    { id: '1236', type: 'review', action: 'Yeni rəy - 5 ulduz', time: '25 dəq əvvəl', status: 'new' },
  ];

  const orderHistory = [
    { 
      id: '5432', 
      date: '16 Yan 2026', 
      time: '14:30', 
      type: 'delivery', 
      total: 45.50, 
      status: 'completed', 
      items: 3,
      customer: { name: 'Əli Məmmədov', phone: '+994 50 123 45 67', address: 'Nizami küç. 12, Bakı' },
      orderItems: [
        { name: 'Marqarita Pizza', quantity: 2, price: 18.00 },
        { name: 'Coca Cola 0.5L', quantity: 2, price: 4.50 },
        { name: 'Çərəz', quantity: 1, price: 5.00 }
      ]
    },
    { 
      id: '5431', 
      date: '16 Yan 2026', 
      time: '13:15', 
      type: 'dine-in', 
      total: 78.20, 
      status: 'completed', 
      items: 5,
      customer: { name: 'Nigar Əliyeva', phone: '+994 55 987 65 43', table: 'Masa 8' },
      orderItems: [
        { name: 'Lənkəran Plovundan', quantity: 2, price: 25.00 },
        { name: 'Qutab', quantity: 3, price: 4.50 },
        { name: 'Kompot', quantity: 2, price: 6.00 },
        { name: 'Salatlar', quantity: 2, price: 8.60 },
        { name: 'Deserti', quantity: 1, price: 9.00 }
      ]
    },
    { 
      id: '5430', 
      date: '16 Yan 2026', 
      time: '12:45', 
      type: 'delivery', 
      total: 32.90, 
      status: 'completed', 
      items: 2,
      customer: { name: 'Rəşad Həsənov', phone: '+994 51 234 56 78', address: '28 May küç. 45, Bakı' },
      orderItems: [
        { name: 'Burger Menu', quantity: 1, price: 22.00 },
        { name: 'Fanta 0.5L', quantity: 2, price: 5.45 }
      ]
    },
    { 
      id: '5429', 
      date: '16 Yan 2026', 
      time: '11:20', 
      type: 'dine-in', 
      total: 95.00, 
      status: 'completed', 
      items: 7,
      customer: { name: 'Günel İsmayılova', phone: '+994 70 345 67 89', table: 'Masa 3' },
      orderItems: [
        { name: 'Xəngəl', quantity: 2, price: 18.00 },
        { name: 'Düşbərə', quantity: 2, price: 16.00 },
        { name: 'Balıq Plovu', quantity: 1, price: 28.00 },
        { name: 'Salatlar', quantity: 3, price: 12.00 },
        { name: 'Çay dəsti', quantity: 2, price: 8.00 },
        { name: 'Paşmaq', quantity: 1, price: 6.00 },
        { name: 'Su', quantity: 2, price: 3.00 }
      ]
    },
    { 
      id: '5428', 
      date: '16 Yan 2026', 
      time: '10:50', 
      type: 'delivery', 
      total: 56.30, 
      status: 'completed', 
      items: 4,
      customer: { name: 'Kamran Quliyev', phone: '+994 55 456 78 90', address: 'Ə.Rəcəbli küç. 23, Bakı' },
      orderItems: [
        { name: 'Lahmacun', quantity: 4, price: 12.00 },
        { name: 'Ayran', quantity: 2, price: 5.00 },
        { name: 'Xəngəl', quantity: 1, price: 18.00 },
        { name: 'Salatlar', quantity: 1, price: 9.30 }
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-50/20 dark:to-purple-950/10">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-white hover:bg-white/20 text-2xl font-bold px-6"
            >
              Vionara
            </Button>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Shield className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{t('moderator.welcome')}</h1>
                <p className="text-purple-100 mt-1">{t('moderator.controlAllOperations')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card 
            onClick={() => navigate('/moderator/orders')}
            className="group cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-500 to-amber-600 text-white overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <ShoppingBag className="h-8 w-8 opacity-80" />
                <div className="text-right">
                  <div className="text-4xl font-bold">{stats.totalOrders}</div>
                  <p className="text-sm opacity-90 mt-1">{t('moderator.today')}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-sm font-medium opacity-90">{t('moderator.stats.orders')}</p>
              <div className="mt-2 text-xs opacity-75">{t('moderator.ordersDesc')}</div>
            </CardContent>
          </Card>

          <Card 
            onClick={() => navigate('/moderator/reservations')}
            className="group cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <CalendarDays className="h-8 w-8 opacity-80" />
                <div className="text-right">
                  <div className="text-4xl font-bold">{stats.activeReservations}</div>
                  <p className="text-sm opacity-90 mt-1">{t('moderator.active')}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-sm font-medium opacity-90">{t('moderator.stats.reservations')}</p>
              <div className="mt-2 text-xs opacity-75">{t('moderator.reservationsDesc')}</div>
            </CardContent>
          </Card>

          <Card 
            onClick={() => navigate('/moderator/reviews')}
            className="group cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-amber-500 to-yellow-600 text-white overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <Star className="h-8 w-8 opacity-80" />
                <div className="text-right">
                  <div className="text-4xl font-bold">{stats.pendingReviews}</div>
                  <p className="text-sm opacity-90 mt-1">{t('moderator.pending')}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <p className="text-sm font-medium opacity-90">{t('moderator.stats.reviews')}</p>
              <div className="mt-2 text-xs opacity-75">{t('moderator.reviewsDesc')}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-950 rounded-lg">
                  <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">{t('moderator.orderType')}</CardTitle>
                  <p className="text-sm text-muted-foreground">{t('moderator.today')}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('moderator.delivery')}</span>
                  <span className="font-semibold">52</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('moderator.dineIn')}</span>
                  <span className="font-semibold text-blue-600">33</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-950 rounded-lg">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">{t('moderator.moderation')}</CardTitle>
                  <p className="text-sm text-muted-foreground">{t('moderator.status')}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('moderator.pending')}</span>
                  <span className="font-semibold">8</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t('moderator.completed')}</span>
                  <span className="font-semibold text-green-600">142</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order History */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-950 dark:to-indigo-950 rounded-lg">
                  <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-xl">{t('moderator.orderHistory')}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{t('moderator.completedOrders')}</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => navigate('/moderator/orders')}
                className="hover:bg-purple-50 dark:hover:bg-purple-950"
              >
                {t('moderator.viewAll')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orderHistory.map((order) => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-all hover:shadow-md group"
                >
                  <div className={`p-3 rounded-full group-hover:scale-110 transition-transform ${
                    order.type === 'delivery' ? 'bg-orange-100 dark:bg-orange-950' : 'bg-blue-100 dark:bg-blue-950'
                  }`}>
                    {order.type === 'delivery' ? (
                      <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    ) : (
                      <ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">#{order.id}</p>
                      <Badge variant="secondary" className="text-xs">
                        {order.type === 'delivery' ? t('moderator.delivery') : t('moderator.dineIn')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{order.date}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{order.time}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{order.items} {t('moderator.items')}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="font-bold text-lg text-green-600">₼{order.total.toFixed(2)}</p>
                    <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
                      {t('moderator.completed')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    selectedOrder.type === 'delivery' ? 'bg-orange-100 dark:bg-orange-950' : 'bg-blue-100 dark:bg-blue-950'
                  }`}>
                    {selectedOrder.type === 'delivery' ? (
                      <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    ) : (
                      <ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span>{t('moderator.orderDetails')}</span>
                      <span className="text-muted-foreground">#{selectedOrder.id}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {selectedOrder.type === 'delivery' ? t('moderator.delivery') : t('moderator.dineIn')}
                      </Badge>
                      <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 text-xs">
                        {t('moderator.completed')}
                      </Badge>
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Order Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{selectedOrder.date} • {selectedOrder.time}</span>
                  </div>

                  {/* Customer Info */}
                  <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {t('moderator.customerInfo')}
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p className="flex items-center gap-2">
                        <span className="text-muted-foreground">{t('moderator.name')}:</span>
                        <span className="font-medium">{selectedOrder.customer.name}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{selectedOrder.customer.phone}</span>
                      </p>
                      {selectedOrder.type === 'delivery' && selectedOrder.customer.address && (
                        <p className="flex items-start gap-2">
                          <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                          <span className="font-medium">{selectedOrder.customer.address}</span>
                        </p>
                      )}
                      {selectedOrder.type === 'dine-in' && selectedOrder.customer.table && (
                        <p className="flex items-center gap-2">
                          <span className="text-muted-foreground">{t('moderator.table')}:</span>
                          <span className="font-medium">{selectedOrder.customer.table}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Order Items */}
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    {t('moderator.orderItems')}
                  </h4>
                  <div className="space-y-2">
                    {selectedOrder.orderItems.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                            {item.quantity}
                          </div>
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <span className="font-semibold">₼{(item.quantity * item.price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Total */}
                <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 dark:bg-green-950/30">
                  <span className="text-lg font-semibold">{t('moderator.total')}</span>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">₼{selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
