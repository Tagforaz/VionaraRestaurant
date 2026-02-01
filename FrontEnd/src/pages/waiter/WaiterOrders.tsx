import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [orders, setOrders] = useState(mockOrders);

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { label: 'Gözləyir', variant: 'secondary' as const },
      preparing: { label: 'Hazırlanır', variant: 'default' as const },
      ready: { label: 'Hazırdır', variant: 'default' as const },
      served: { label: 'Xidmət olunub', variant: 'default' as const },
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
            <h1 className="text-3xl font-bold">Daxili Sifarişlər</h1>
            <p className="text-muted-foreground">Restoran daxili sifarişləri idarə edin</p>
          </div>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Sifariş
        </Button>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Aktiv ({orders.filter(o => o.status !== 'served').length})
          </TabsTrigger>
          <TabsTrigger value="served">
            Xidmət olunub ({orders.filter(o => o.status === 'served').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-6">
          {orders.filter(o => o.status !== 'served').map(order => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Masa {order.tableNumber}</CardTitle>
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
                  <span className="font-bold">Ümumi:</span>
                  <span className="font-bold">${order.total.toFixed(2)}</span>
                </div>

                {/* Action Buttons */}
                {order.status === 'ready' && (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => updateOrderStatus(order.id, 'served')}
                  >
                    Masaya çatdırıldı
                  </Button>
                )}
                
                {order.status === 'pending' && (
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      ⏳ Mətbəx tərəfindən qəbul gözlənilir
                    </p>
                  </div>
                )}

                {order.status === 'preparing' && (
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      👨‍🍳 Sifariş hazırlanır
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {orders.filter(o => o.status !== 'served').length === 0 && (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Aktiv sifariş yoxdur</p>
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
                    <p className="font-medium">Masa {order.tableNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.items.length} məhsul • ${order.total.toFixed(2)}
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
                <p className="text-muted-foreground">Xidmət olunmuş sifariş yoxdur</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
