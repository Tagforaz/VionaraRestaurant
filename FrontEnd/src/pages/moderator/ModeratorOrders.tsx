import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, ArrowLeft } from 'lucide-react';

const mockOrders = [
  {
    id: '1234',
    customerName: 'Əli Məmmədov',
    type: 'delivery',
    items: 3,
    status: 'preparing',
    total: 45.99,
    createdAt: new Date().toISOString(),
  },
  {
    id: '1235',
    customerName: 'Masa 5',
    type: 'dine-in',
    items: 2,
    status: 'pending',
    total: 28.50,
    createdAt: new Date().toISOString(),
  },
  {
    id: '1236',
    customerName: 'Leyla Həsənova',
    type: 'pickup',
    items: 1,
    status: 'ready',
    total: 18.00,
    createdAt: new Date().toISOString(),
  },
];

export const ModeratorOrders = () => {
  const navigate = useNavigate();
  const [orders] = useState(mockOrders);
  const [selectedTab, setSelectedTab] = useState('all');

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { label: 'Gözləyir', variant: 'secondary' as const },
      preparing: { label: 'Hazırlanır', variant: 'default' as const },
      ready: { label: 'Hazırdır', variant: 'default' as const },
      delivered: { label: 'Çatdırıldı', variant: 'default' as const },
    };

    const s = config[status as keyof typeof config] || { label: status, variant: 'default' as const };
    const className = status === 'preparing' ? 'bg-blue-600' : status === 'ready' ? 'bg-green-600' : '';
    return <Badge variant={s.variant} className={className}>{s.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const labels = {
      delivery: 'Çatdırılma',
      'dine-in': 'Daxili',
      pickup: 'Götürmə',
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
          <h1 className="text-3xl font-bold">Sifarişlər</h1>
          <p className="text-muted-foreground">Daxili və xarici sifarişləri görüntüləyin</p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">Hamısı ({orders.length})</TabsTrigger>
          <TabsTrigger value="external">
            Xarici ({orders.filter(o => o.type === 'delivery' || o.type === 'pickup').length})
          </TabsTrigger>
          <TabsTrigger value="internal">
            Daxili ({orders.filter(o => o.type === 'dine-in').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4 mt-6">
          {filteredOrders.map(order => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Sifariş #{order.id}</CardTitle>
                  <div className="flex gap-2">
                    {getTypeBadge(order.type)}
                    {getStatusBadge(order.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Müştəri:</span>
                    <span className="font-medium">{order.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Məhsullar:</span>
                    <span>{order.items} ədəd</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ümumi:</span>
                    <span className="font-bold">${order.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      <Clock className="inline h-3 w-3 mr-1" />
                      Vaxt:
                    </span>
                    <span>{new Date(order.createdAt).toLocaleTimeString('az-AZ')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};
