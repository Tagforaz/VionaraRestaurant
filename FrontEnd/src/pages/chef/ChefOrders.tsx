import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, X, Clock, ArrowLeft } from 'lucide-react';
import { OrderStatus } from '@/types';

// Mock orders data
const mockOrders = [
  {
    id: '1234',
    customerName: 'John Doe',
    items: [
      { name: 'Pizza Marqarita', quantity: 2 },
      { name: 'Cola 0.5L', quantity: 2 },
    ],
    status: 'pending' as OrderStatus,
    type: 'delivery',
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    total: 45.99,
  },
  {
    id: '1233',
    customerName: 'Jane Smith',
    items: [
      { name: 'Burger Classic', quantity: 1 },
      { name: 'Kartof fri böyük', quantity: 1 },
      { name: 'Pepsi 0.5L', quantity: 1 },
    ],
    status: 'pending' as OrderStatus,
    type: 'dine-in',
    createdAt: new Date(Date.now() - 3 * 60000).toISOString(),
    total: 28.50,
  },
  {
    id: '1235',
    customerName: 'Alice Brown',
    items: [
      { name: 'Lahmacun', quantity: 3 },
      { name: 'Ayran', quantity: 2 },
    ],
    status: 'accepted' as OrderStatus,
    type: 'dine-in',
    createdAt: new Date(Date.now() - 12 * 60000).toISOString(),
    total: 25.50,
  },
  {
    id: '1236',
    customerName: 'Bob Wilson',
    items: [
      { name: 'Sushi set California', quantity: 1 },
      { name: 'Miso soup', quantity: 1 },
    ],
    status: 'preparing' as OrderStatus,
    type: 'delivery',
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    total: 38.00,
  },
  {
    id: '1232',
    customerName: 'Mike Johnson',
    items: [
      { name: 'Döner dürüm', quantity: 2 },
      { name: 'Fanta 0.33L', quantity: 2 },
    ],
    status: 'preparing' as OrderStatus,
    type: 'delivery',
    createdAt: new Date(Date.now() - 18 * 60000).toISOString(),
    total: 32.00,
  },
  {
    id: '1231',
    customerName: 'Sarah Davis',
    items: [
      { name: 'Pizza Pepperoni', quantity: 1 },
      { name: 'Caesar salat', quantity: 1 },
    ],
    status: 'completed' as OrderStatus,
    type: 'dine-in',
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
    total: 42.00,
  },
  {
    id: '1230',
    customerName: 'Tom Anderson',
    items: [
      { name: 'Steak medium', quantity: 1 },
    ],
    status: 'completed' as OrderStatus,
    type: 'dine-in',
    createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
    total: 55.00,
  },
  {
    id: '1229',
    customerName: 'Emma White',
    items: [
      { name: 'Pasta Carbonara', quantity: 1 },
      { name: 'Tiramisu', quantity: 1 },
    ],
    status: 'rejected' as OrderStatus,
    type: 'delivery',
    createdAt: new Date(Date.now() - 35 * 60000).toISOString(),
    total: 28.50,
  },
];

export const ChefOrders = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [orders, setOrders] = useState(mockOrders);
  const [selectedTab, setSelectedTab] = useState('all');

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
  };

  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig = {
      pending: { label: t('chef.status.waiting'), variant: 'secondary' as const },
      accepted: { label: t('chef.status.acceptedStatus'), variant: 'default' as const },
      rejected: { label: t('chef.status.rejectedStatus'), variant: 'destructive' as const },
      preparing: { label: t('chef.status.preparingStatus'), variant: 'default' as const },
      ready: { label: t('chef.status.ready'), variant: 'default' as const },
      completed: { label: t('chef.status.completedStatus'), variant: 'default' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'default' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filterOrders = (status: string) => {
    if (status === 'all') return orders;
    return orders.filter(order => order.status === status);
  };

  const filteredOrders = filterOrders(selectedTab);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/chef')}
          className="hover:bg-accent"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{t('chef.ordersTitle')}</h1>
          <p className="text-muted-foreground">{t('chef.manageAllOrders')}</p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">{t('chef.all')} ({orders.length})</TabsTrigger>
          <TabsTrigger value="pending">
            {t('chef.waiting')} ({orders.filter(o => o.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="accepted">
            {t('chef.accepted')} ({orders.filter(o => o.status === 'accepted').length})
          </TabsTrigger>
          <TabsTrigger value="preparing">
            {t('chef.stats.preparing')} ({orders.filter(o => o.status === 'preparing').length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            {t('chef.stats.completed')} ({orders.filter(o => o.status === 'completed').length})
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
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{t('chef.order')} #{order.id}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {order.customerName} • {order.type === 'delivery' ? t('chef.delivery') : t('chef.dineIn')}
                      </p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Order Items */}
                  <div className="space-y-2">
                    <p className="font-medium">{t('chef.products')}:</p>
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="font-bold">{t('chef.total')}: ${order.total.toFixed(2)}</span>
                    <div className="text-sm text-muted-foreground">
                      <Clock className="inline h-4 w-4 mr-1" />
                      {new Date(order.createdAt).toLocaleTimeString('az-AZ')}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 pt-2">
                    {order.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => updateOrderStatus(order.id, 'accepted')}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          {t('chef.acceptOrder')}
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1"
                          onClick={() => updateOrderStatus(order.id, 'rejected')}
                        >
                          <X className="h-4 w-4 mr-2" />
                          {t('chef.rejectOrder')}
                        </Button>
                      </div>
                    )}
                    {order.status === 'accepted' && (
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        {t('chef.startPreparing')}
                      </Button>
                    )}
                    {order.status === 'preparing' && (
                      <Button
                        className="w-full bg-amber-600 hover:bg-amber-700"
                        onClick={() => updateOrderStatus(order.id, 'completed')}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        {t('chef.markAsReady')}
                      </Button>
                    )}
                    {(order.status === 'completed' || order.status === 'rejected') && (
                      <div className="text-center py-2 text-sm text-muted-foreground">
                        {order.status === 'completed' ? t('chef.orderCompleted') : t('chef.orderRejected')}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
