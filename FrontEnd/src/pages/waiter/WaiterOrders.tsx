import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, ArrowLeft } from 'lucide-react';

const mockOrders = [
  {
    id: '1',
    tableNumber: 5,
    items: [
      { name: 'Pizza Marqarita', quantity: 2, price: 18.99 },
      { name: 'Cola', quantity: 2, price: 3.50 },
    ],
    status: 'preparing',
    createdAt: new Date().toISOString(),
    total: 44.98,
  },
  {
    id: '2',
    tableNumber: 8,
    items: [
      { name: 'Burger', quantity: 1, price: 15.50 },
      { name: 'Kartof fri', quantity: 1, price: 5.00 },
    ],
    status: 'ready',
    createdAt: new Date().toISOString(),
    total: 20.50,
  },
  {
    id: '3',
    tableNumber: 12,
    items: [
      { name: 'Sushi set', quantity: 1, price: 38.00 },
    ],
    status: 'pending',
    createdAt: new Date().toISOString(),
    total: 38.00,
  },
];

export const WaiterOrders = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [orders, setOrders] = useState(mockOrders);

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { label: t('waiter.pending'), variant: 'secondary' as const },
      preparing: { label: t('waiter.preparing'), variant: 'default' as const },
      ready: { label: t('waiter.ready'), variant: 'default' as const },
      served: { label: t('waiter.served'), variant: 'default' as const },
    };

    const s = config[status as keyof typeof config] || { label: status, variant: 'default' as const };
    const className = status === 'preparing' ? 'bg-blue-600' : status === 'ready' ? 'bg-green-600' : '';
    return <Badge variant={s.variant} className={className}>{s.label}</Badge>;
  };

  const updateOrderStatus = (id: string, status: string) => {
    setOrders(prev =>
      prev.map(o => (o.id === id ? { ...o, status } : o))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/waiter')}
            className="hover:bg-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{t('waiter.dineInOrders')}</h1>
            <p className="text-muted-foreground">{t('waiter.manageDineInOrders')}</p>
          </div>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {t('waiter.newOrder')}
        </Button>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            {t('waiter.active')} ({orders.filter(o => o.status !== 'served').length})
          </TabsTrigger>
          <TabsTrigger value="served">
            {t('waiter.served')} ({orders.filter(o => o.status === 'served').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-6">
          {orders.filter(o => o.status !== 'served').map(order => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{t('waiter.table')} {order.tableNumber}</CardTitle>
                  {getStatusBadge(order.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Order Items */}
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}x {item.name}
                      </span>
                      <span className="font-medium">${item.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="font-bold">{t('waiter.total')}:</span>
                  <span className="font-bold">${order.total.toFixed(2)}</span>
                </div>

                {/* Action Buttons */}
                {order.status === 'ready' && (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => updateOrderStatus(order.id, 'served')}
                  >
                    {t('waiter.deliveredToTable')}
                  </Button>
                )}
                
                {order.status === 'pending' && (
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      ⏳ {t('waiter.waitingKitchenAcceptance')}
                    </p>
                  </div>
                )}

                {order.status === 'preparing' && (
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      👨‍🍳 {t('waiter.orderBeingPrepared')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {orders.filter(o => o.status !== 'served').length === 0 && (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">{t('waiter.noActiveOrders')}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="served" className="space-y-4 mt-6">
          {orders.filter(o => o.status === 'served').map(order => (
            <Card key={order.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t('waiter.table')} {order.tableNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.items.length} {t('waiter.items')} • ${order.total.toFixed(2)}
                    </p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
              </CardContent>
            </Card>
          ))}

          {orders.filter(o => o.status === 'served').length === 0 && (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">{t('waiter.noServedOrders')}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
