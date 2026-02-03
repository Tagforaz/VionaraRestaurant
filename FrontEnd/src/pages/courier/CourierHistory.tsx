import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Package, Calendar, DollarSign, MapPin } from 'lucide-react';

// Mock history data
const mockHistory = [
  {
    id: '1230',
    customerName: 'Sarah Davis',
    address: 'Fountain Square, 12',
    total: 42.00,
    deliveryFee: 5.00,
    status: 'completed' as const,
    completedAt: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
  },
  {
    id: '1229',
    customerName: 'Tom Anderson',
    address: 'Nobel Avenue, 89',
    total: 55.00,
    deliveryFee: 6.00,
    status: 'completed' as const,
    completedAt: new Date(Date.now() - 4 * 60 * 60000).toISOString(),
  },
  {
    id: '1228',
    customerName: 'Emma White',
    address: 'Bulbul Avenue, 34',
    total: 28.50,
    deliveryFee: 4.50,
    status: 'completed' as const,
    completedAt: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
  },
  {
    id: '1227',
    customerName: 'Mike Johnson',
    address: 'Azadlig Avenue, 67',
    total: 32.00,
    deliveryFee: 5.50,
    status: 'completed' as const,
    completedAt: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
  },
  {
    id: '1226',
    customerName: 'Alice Brown',
    address: 'Neftchilar Avenue, 12',
    total: 25.50,
    deliveryFee: 4.00,
    status: 'completed' as const,
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60000).toISOString(),
  },
  {
    id: '1225',
    customerName: 'Bob Wilson',
    address: 'Heydar Aliyev Avenue, 45',
    total: 38.00,
    deliveryFee: 5.00,
    status: 'completed' as const,
    completedAt: new Date(Date.now() - 3 * 24 * 60 * 60000).toISOString(),
  },
  {
    id: '1224',
    customerName: 'Jane Smith',
    address: '28 May Street, 78',
    total: 48.50,
    deliveryFee: 6.50,
    status: 'completed' as const,
    completedAt: new Date(Date.now() - 7 * 24 * 60 * 60000).toISOString(),
  },
  {
    id: '1223',
    customerName: 'John Doe',
    address: 'Nizami Street, 23',
    total: 35.00,
    deliveryFee: 4.50,
    status: 'completed' as const,
    completedAt: new Date(Date.now() - 8 * 24 * 60 * 60000).toISOString(),
  },
];

export const CourierHistory = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState('today');

  const filterDeliveries = (period: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60000);

    return mockHistory.filter(delivery => {
      const deliveryDate = new Date(delivery.completedAt);
      
      switch(period) {
        case 'today':
          return deliveryDate >= today;
        case 'week':
          return deliveryDate >= weekAgo;
        case 'month':
          return deliveryDate >= monthAgo;
        case 'all':
        default:
          return true;
      }
    });
  };

  const filteredDeliveries = filterDeliveries(selectedTab);
  const totalEarnings = filteredDeliveries.reduce((sum, d) => sum + d.deliveryFee, 0);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60000);

    if (date >= today) {
      return t('courier.today') + ' ' + date.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' });
    } else if (date >= yesterday) {
      return t('courier.yesterday') + ' ' + date.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + 
             date.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/courier')}
          className="hover:bg-accent"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{t('courier.myHistory')}</h1>
          <p className="text-muted-foreground">{t('courier.deliveryHistory')}</p>
        </div>
      </div>

      {/* Earnings Summary */}
      <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">{t('courier.totalEarnings')}</p>
              <h2 className="text-3xl font-bold">${totalEarnings.toFixed(2)}</h2>
              <p className="text-xs opacity-75 mt-1">{filteredDeliveries.length} {t('courier.deliveries')}</p>
            </div>
            <DollarSign className="h-12 w-12 opacity-80" />
          </div>
        </CardContent>
      </Card>

      {/* History Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="today">{t('courier.today')}</TabsTrigger>
          <TabsTrigger value="week">{t('courier.thisWeek')}</TabsTrigger>
          <TabsTrigger value="month">{t('courier.thisMonth')}</TabsTrigger>
          <TabsTrigger value="all">{t('courier.allTime')}</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4 mt-6">
          {filteredDeliveries.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">{t('courier.noDeliveriesFound')}</p>
              </CardContent>
            </Card>
          ) : (
            filteredDeliveries.map(delivery => (
              <Card key={delivery.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <p className="font-bold">{t('courier.order')} #{delivery.id}</p>
                        <Badge className="bg-green-600">{t('courier.completed')}</Badge>
                      </div>
                      <div className="space-y-1 text-sm ml-6">
                        <p className="font-medium">{delivery.customerName}</p>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {delivery.address}
                        </p>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(delivery.completedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm text-muted-foreground">{t('courier.orderTotal')}</p>
                      <p className="font-bold">${delivery.total.toFixed(2)}</p>
                      <p className="text-sm font-semibold text-green-600">
                        +${delivery.deliveryFee.toFixed(2)}
                      </p>
                    </div>
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
