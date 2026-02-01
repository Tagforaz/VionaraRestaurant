import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Navigation, CheckCircle, ArrowLeft } from 'lucide-react';

const mockDeliveries = [
  {
    id: '1234',
    orderId: '1234',
    customerName: 'Əli Məmmədov',
    customerPhone: '+994501234567',
    address: 'Nizami küç. 23, Bakı',
    status: 'assigned',
    items: 2,
    total: 45.99,
    distance: '2.5 km',
  },
  {
    id: '1235',
    orderId: '1235',
    customerName: 'Leyla Həsənova',
    customerPhone: '+994557654321',
    address: '28 May küç. 45, Bakı',
    status: 'in-progress',
    items: 3,
    total: 62.50,
    distance: '1.8 km',
  },
];

export const CourierDeliveries = () => {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState(mockDeliveries);

  const updateDeliveryStatus = (id: string, status: string) => {
    setDeliveries(prev =>
      prev.map(d => (d.id === id ? { ...d, status } : d))
    );
  };

  const getStatusBadge = (status: string) => {
    const config = {
      assigned: { label: 'Təyin olunub', variant: 'secondary' as const },
      'in-progress': { label: 'Yoldadır', variant: 'default' as const },
      delivered: { label: 'Çatdırıldı', variant: 'default' as const },
    };

    const s = config[status as keyof typeof config] || { label: status, variant: 'default' as const };
    return <Badge variant={s.variant} className={status === 'in-progress' ? 'bg-blue-600' : ''}>{s.label}</Badge>;
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
          <h1 className="text-3xl font-bold">Çatdırılmalar</h1>
          <p className="text-muted-foreground">Sizə təyin olunmuş çatdırılmalar</p>
        </div>
      </div>

      <div className="space-y-4">
        {deliveries.filter(d => d.status !== 'delivered').map(delivery => (
          <Card key={delivery.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sifariş #{delivery.orderId}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {delivery.items} məhsul • ${delivery.total}
                  </p>
                </div>
                {getStatusBadge(delivery.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Customer Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{delivery.customerName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`tel:${delivery.customerPhone}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {delivery.customerPhone}
                  </a>
                </div>
                <div className="flex items-start gap-2">
                  <Navigation className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm">{delivery.address}</p>
                    <p className="text-xs text-muted-foreground">{delivery.distance}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                {delivery.status === 'assigned' && (
                  <>
                    <Button
                      className="flex-1"
                      onClick={() => updateDeliveryStatus(delivery.id, 'in-progress')}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Çatdırmağa başla
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(delivery.address)}`, '_blank')}
                    >
                      <Navigation className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {delivery.status === 'in-progress' && (
                  <>
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => updateDeliveryStatus(delivery.id, 'delivered')}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Çatdırıldı
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(delivery.address)}`, '_blank')}
                    >
                      <Navigation className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {deliveries.filter(d => d.status !== 'delivered').length === 0 && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Aktiv çatdırılma yoxdur</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Completed Deliveries */}
      {deliveries.filter(d => d.status === 'delivered').length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Tamamlanmış Çatdırılmalar</h2>
          {deliveries.filter(d => d.status === 'delivered').map(delivery => (
            <Card key={delivery.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sifariş #{delivery.orderId}</p>
                    <p className="text-sm text-muted-foreground">{delivery.customerName}</p>
                  </div>
                  <Badge className="bg-green-600">Çatdırıldı</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
