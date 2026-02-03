import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react';
import { Courier } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CourierMapProps {
  couriers: Courier[];
}

export const CourierMap = ({ couriers }: CourierMapProps) => {
  const { t } = useTranslation();

  // Simple map view with courier positions
  // In real app, integrate with Leaflet or Google Maps
  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'busy':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Couriers Live Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-[400px] bg-secondary/20 rounded-lg overflow-hidden border">
          {/* Simple map background */}
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MapPin className="h-16 w-16 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Real-time courier locations</p>
              <p className="text-xs text-muted-foreground mt-1">
                Baku, Azerbaijan
              </p>
            </div>
          </div>

          {/* Courier markers - positioned relatively */}
          {couriers.map((courier, index) => {
            const online = courier.status !== 'offline';
            if (!online) return null;

            // Simple positioning based on index (in real app, use actual lat/lng)
            const positions = [
              { top: '30%', left: '40%' },
              { top: '50%', left: '60%' },
              { top: '65%', left: '35%' },
              { top: '25%', left: '70%' },
              { top: '75%', left: '55%' },
            ];
            const position = positions[index % positions.length];

            return (
              <div
                key={courier.id}
                className="absolute group cursor-pointer"
                style={position}
              >
                {/* Marker */}
                <div className="relative">
                  <div className={`h-6 w-6 rounded-full ${getMarkerColor(courier.status)} border-2 border-white shadow-lg flex items-center justify-center`}>
                    <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="bg-popover text-popover-foreground px-3 py-2 rounded-lg shadow-lg border whitespace-nowrap">
                      <div className="font-medium">
                        {courier.firstName} {courier.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {t(`courier.status.${courier.status}`)}
                        {courier.activeDeliveries > 0 && ` • ${courier.activeDeliveries} ${t('courier.active')}`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {courier.vehicleNumber}
                      </div>
                    </div>
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                      <div className="border-4 border-transparent border-t-popover"></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Legend */}
          <div className="absolute bottom-4 right-4 bg-background/95 backdrop-blur-sm rounded-lg border p-3 shadow-lg">
            <div className="text-xs font-medium mb-2">{t('courier.status.label')}</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                <span className="text-xs">{t('courier.status.available')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                <span className="text-xs">{t('courier.status.busy')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                <span className="text-xs">{t('courier.status.offline')}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
