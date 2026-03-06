import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Wifi, WifiOff, Navigation } from 'lucide-react';
import * as signalR from '@microsoft/signalr';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createCourierIcon = (name: string) =>
  L.divIcon({
    html: `
      <div style="background:linear-gradient(135deg,#3b82f6,#6366f1);border:3px solid white;border-radius:50% 50% 50% 0;width:36px;height:36px;transform:rotate(-45deg);box-shadow:0 4px 12px rgba(59,130,246,0.5);display:flex;align-items:center;justify-content:center;">
        <div style="transform:rotate(45deg);font-size:14px;">🛵</div>
      </div>
      <div style="background:white;border-radius:6px;padding:2px 6px;font-size:11px;font-weight:600;color:#1e293b;box-shadow:0 2px 6px rgba(0,0,0,0.15);margin-top:2px;white-space:nowrap;text-align:center;">${name}</div>
    `,
    className: '',
    iconSize: [80, 60],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });

const createHomeIcon = () =>
  L.divIcon({
    html: `
      <div style="
        background: #22c55e;
        border: 3px solid white;
        border-radius: 50%;
        width: 36px; height: 36px;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        font-size: 18px;
      ">🏠</div>
    `,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });

interface CourierLocationDto {
  courierId: string;
  orderId?: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  courierName?: string;
}

interface LiveCourierPosition {
  courierId: string;
  courierName: string;
  latitude: number;
  longitude: number;
  lastSeen: Date;
  orderId?: string;
  destLat?: number;
  destLng?: number;
  destAddress?: string;
}

interface ActiveOrderInfo {
  courierId: string;
  courierName: string | null;
  deliveryLatitude: number | null;
  deliveryLongitude: number | null;
  deliveryAddress: string | null;
  id: string;
}

function MapAutoCenter({ positions }: { positions: LiveCourierPosition[] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 1) {
      map.setView([positions[0].latitude, positions[0].longitude], 14);
    } else if (positions.length > 1) {
      const bounds = L.latLngBounds(positions.map(p => [p.latitude, p.longitude]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [positions.length]);
  return null;
}

export const CourierMap = () => {
  const { t } = useTranslation();
  const [courierPositions, setCourierPositions] = useState<Map<string, LiveCourierPosition>>(new Map());
  const activeOrdersRef = useRef<Map<string, ActiveOrderInfo>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  const loadActiveOrders = async () => {
    try {
      const token = localStorage.getItem('auth_token') || '';
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7156';

      // Əvvəlcə siyahını gətir
      const res = await fetch(`${baseUrl}/api/orders?page=1&take=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;

      const raw = await res.json();
      const allOrders: any[] = Array.isArray(raw) ? raw : raw?.data ?? [];

      // Yalnız "Yoldadır" (status=5) və courierId olan sifarişlər
      const activeList = allOrders.filter((o: any) => o.status === 5 && o.courierId);

      // ✅ Hər aktiv sifariş üçün detail endpoint-i çağır
      //    çünki siyahı DTO-sunda deliveryLatitude/Longitude olmaya bilər
      const detailedResults = await Promise.allSettled(
        activeList.map(async (o: any) => {
          try {
            const detailRes = await fetch(`${baseUrl}/api/orders/${o.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!detailRes.ok) return o; // fallback: siyahı datası
            const detail = await detailRes.json();
            // Detail-dən koordinatları götür, siyahıdan gələn sahələri saxla
            return {
              ...o,
              deliveryLatitude: detail.deliveryLatitude ?? o.deliveryLatitude ?? null,
              deliveryLongitude: detail.deliveryLongitude ?? o.deliveryLongitude ?? null,
              deliveryAddress: detail.deliveryAddress ?? o.deliveryAddress ?? null,
              courierName: detail.courierName ?? o.courierName ?? null,
            };
          } catch {
            return o;
          }
        })
      );

      const map = new Map<string, ActiveOrderInfo>();
      detailedResults.forEach(result => {
        if (result.status === 'fulfilled') {
          const o = result.value;
          if (o.courierId) {
            map.set(o.courierId, {
              courierId: o.courierId,
              courierName: o.courierName ?? null,
              deliveryLatitude: o.deliveryLatitude ?? null,
              deliveryLongitude: o.deliveryLongitude ?? null,
              deliveryAddress: o.deliveryAddress ?? null,
              id: o.id,
            });
          }
        }
      });

      activeOrdersRef.current = map;

      // ✅ Artıq aktiv sifarişi olmayan kuryer pozisiyalarını xəritədən sil
      setCourierPositions(prev => {
        const updated = new Map(prev);

        // Xəritədəki hər kuryeri yoxla
        updated.forEach((_, courierId) => {
          if (!map.has(courierId)) {
            // Bu kuryerin artıq status=5 sifarişi yoxdur → xəritədən çıxar
            updated.delete(courierId);
          }
        });

        // Aktiv kuryer pozisiyalarını yenilə (koordinatlar)
        updated.forEach((pos, courierId) => {
          const orderInfo = map.get(courierId);
          if (orderInfo) {
            updated.set(courierId, {
              ...pos,
              destLat: orderInfo.deliveryLatitude ?? undefined,
              destLng: orderInfo.deliveryLongitude ?? undefined,
              destAddress: orderInfo.deliveryAddress ?? undefined,
            });
          }
        });

        return updated;
      });

    } catch {
      // səssiz xəta
    }
  };

  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7156';

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${baseUrl}/hubs/courier-tracking`, {
        accessTokenFactory: () => localStorage.getItem('auth_token') || '',
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.None)
      .build();

    connection.on('CourierLocationUpdated', (location: CourierLocationDto) => {
      const orderInfo = activeOrdersRef.current.get(location.courierId);

      setCourierPositions(prev => {
        const updated = new Map(prev);
        updated.set(location.courierId, {
          courierId: location.courierId,
          courierName: location.courierName || orderInfo?.courierName || 'Kuryer',
          latitude: location.latitude,
          longitude: location.longitude,
          lastSeen: new Date(location.timestamp),
          orderId: location.orderId,
          destLat: orderInfo?.deliveryLatitude ?? undefined,
          destLng: orderInfo?.deliveryLongitude ?? undefined,
          destAddress: orderInfo?.deliveryAddress ?? undefined,
        });
        return updated;
      });
    });

    connection.on('CourierDisconnected', (courierId: string) => {
      setCourierPositions(prev => {
        const updated = new Map(prev);
        const existing = updated.get(courierId);
        if (existing) updated.set(courierId, { ...existing, lastSeen: new Date(0) });
        return updated;
      });
    });

    connection.onclose(() => setIsConnected(false));
    connection.onreconnecting(() => setIsConnected(false));
    connection.onreconnected(async () => {
      setIsConnected(true);
      await loadActiveOrders();
    });

    connection
      .start()
      .then(async () => {
        setIsConnected(true);
        await loadActiveOrders();
      })
      .catch(() => setIsConnected(false));

    connectionRef.current = connection;

    // ✅ Hər 5 saniyədə aktiv sifarişləri yenilə (çatdırılma koordinatları dəyişə bilər)
    const intervalId = setInterval(() => {
      loadActiveOrders();
    }, 5000);

    return () => {
      clearInterval(intervalId);
      connection.stop();
    };
  }, []);

  const now = new Date();
  const positions = Array.from(courierPositions.values());
  const activePositions = positions.filter(p => now.getTime() - p.lastSeen.getTime() < 3 * 60 * 1000);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-blue-500" />
            {t('courier.liveMap', 'Canlı Kuryer Xəritəsi')}
          </CardTitle>
          <div className="flex items-center gap-2">
            {activePositions.length > 0 && (
              <Badge variant="secondary" className="text-xs">{activePositions.length} aktiv</Badge>
            )}
            <Badge variant={isConnected ? 'default' : 'destructive'} className="flex items-center gap-1 text-xs">
              {isConnected ? <><Wifi className="h-3 w-3" /> Canlı</> : <><WifiOff className="h-3 w-3" /> Bağlantı yoxdur</>}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative" style={{ height: '400px' }}>
          {positions.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl px-6 py-4 shadow-lg text-center">
                <div className="text-4xl mb-2">🛵</div>
                <p className="text-sm font-medium text-slate-600">
                  {isConnected ? 'Kuryer hərəkət etdikdə burada görünəcək' : 'Qoşulunur...'}
                </p>
              </div>
            </div>
          )}
          <MapContainer
            center={[40.4093, 49.8671]}
            zoom={12}
            style={{ height: '100%', width: '100%', borderRadius: '0 0 0.5rem 0.5rem' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapAutoCenter positions={activePositions} />

            {/* Kuryer markerləri */}
            {positions.map(courier => {
              const isActive = now.getTime() - courier.lastSeen.getTime() < 3 * 60 * 1000;
              return (
                <Marker
                  key={courier.courierId}
                  position={[courier.latitude, courier.longitude]}
                  icon={createCourierIcon(courier.courierName)}
                  opacity={isActive ? 1 : 0.4}
                >
                  <Popup>
                    <div className="min-w-[160px]">
                      <p className="font-semibold text-sm mb-1">{courier.courierName}</p>
                      <p className="text-xs text-gray-400">Son: {courier.lastSeen.toLocaleTimeString('az-AZ')}</p>
                      {courier.destAddress && (
                        <p className="text-xs text-gray-500 mt-1">📍 {courier.destAddress}</p>
                      )}
                      <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-white text-[10px] ${isActive ? 'bg-green-500' : 'bg-gray-400'}`}>
                        {isActive ? 'Aktiv' : 'Qeyri-aktiv'}
                      </span>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* ✅ Çatdırılma ünvanı markerləri */}
            {positions.map(courier => {
              const isActive = now.getTime() - courier.lastSeen.getTime() < 3 * 60 * 1000;
              if (!isActive || !courier.destLat || !courier.destLng) return null;
              return (
                <Marker
                  key={`home-${courier.courierId}`}
                  position={[courier.destLat, courier.destLng]}
                  icon={createHomeIcon()}
                >
                  <Popup>
                    <div className="min-w-[160px]">
                      <p className="font-semibold text-sm mb-1">Çatdırılma ünvanı</p>
                      <p className="text-xs text-gray-500">{courier.destAddress || 'Ünvan məlumatı yoxdur'}</p>
                      <p className="text-xs text-gray-400 mt-1">Kuryer: {courier.courierName}</p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          <div className="absolute bottom-4 right-4 z-[1000] bg-background/95 backdrop-blur-sm rounded-lg border p-3 shadow-lg">
            <div className="text-xs font-medium mb-2">Status</div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-blue-500"></div><span className="text-xs">Aktiv kuryer</span></div>
              <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-green-500"></div><span className="text-xs">Çatdırılma ünvanı</span></div>
              <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-gray-400 opacity-40"></div><span className="text-xs">Qeyri-aktiv</span></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};