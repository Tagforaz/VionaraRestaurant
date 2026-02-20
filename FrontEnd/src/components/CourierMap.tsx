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

// Ev ikonu — çatdırılma ünvanı üçün
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
  // Çatdırılma ünvanı koordinatları
  destLat?: number;
  destLng?: number;
  destAddress?: string;
}

// Aktiv sifariş — orders API-dan gələn məlumat
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
  // courierId → order məlumatı (ev koordinatları üçün)
  const activeOrdersRef = useRef<Map<string, ActiveOrderInfo>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<string>('Qoşulmur...');
  const [eventLog, setEventLog] = useState<string[]>([]);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('az-AZ');
    console.log(`[CourierMap ${time}] ${msg}`);
    setEventLog(prev => [`[${time}] ${msg}`, ...prev].slice(0, 10));
  };

  // Aktiv sifarişləri çək (status=5 OutForDelivery) — ev koordinatları + kuryer adı üçün
  const loadActiveOrders = async () => {
    try {
      const token = localStorage.getItem('auth_token') || '';
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7156';
      const res = await fetch(`${baseUrl}/api/orders?page=1&take=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const orders: ActiveOrderInfo[] = await res.json();

      // Status 5 = OutForDelivery, courierId olan sifarişlər
      const active = orders.filter((o: any) => o.status === 5 && o.courierId);
      const map = new Map<string, ActiveOrderInfo>();
      active.forEach((o: any) => {
        map.set(o.courierId, {
          courierId: o.courierId,
          courierName: o.courierName,
          deliveryLatitude: o.deliveryLatitude ?? null,
          deliveryLongitude: o.deliveryLongitude ?? null,
          deliveryAddress: o.deliveryAddress ?? null,
          id: o.id,
        });
      });
      activeOrdersRef.current = map;
      addLog(`📦 Aktiv çatdırılma: ${active.length}`);
    } catch {
      addLog(`⚠️ Sifariş yükləmə xətası`);
    }
  };

  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7156';

    addLog(`🚀 Qoşulma: ${baseUrl}/hubs/courier-tracking`);

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${baseUrl}/hubs/courier-tracking`, {
        accessTokenFactory: () => localStorage.getItem('auth_token') || '',
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connection.on('CourierLocationUpdated', (location: CourierLocationDto) => {
      addLog(`📍 LocationUpdated: ${location.courierId?.slice(0, 8)} lat=${location.latitude} lng=${location.longitude}`);

      // Bu kuryer üçün aktiv sifariş məlumatını götür (ev koordinatları)
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
          // Ev koordinatları — orders API-dan gəlir
          destLat: orderInfo?.deliveryLatitude ?? undefined,
          destLng: orderInfo?.deliveryLongitude ?? undefined,
          destAddress: orderInfo?.deliveryAddress ?? undefined,
        });
        return updated;
      });
    });

    connection.on('CourierDisconnected', (courierId: string) => {
      addLog(`🔴 Disconnected: ${courierId?.slice(0, 8)}`);
      setCourierPositions(prev => {
        const updated = new Map(prev);
        const existing = updated.get(courierId);
        if (existing) updated.set(courierId, { ...existing, lastSeen: new Date(0) });
        return updated;
      });
    });

    connection.onclose((err) => {
      addLog(`❌ Bağlantı kəsildi: ${err?.message || 'səbəbsiz'}`);
      setIsConnected(false);
      setConnectionState('Kəsildi');
    });

    connection.onreconnecting(() => {
      setIsConnected(false);
      setConnectionState('Yenidən qoşulur...');
    });

    connection.onreconnected(async (connId) => {
      addLog(`✅ Reconnected: ${connId}`);
      setIsConnected(true);
      setConnectionState(`Qoşuldu`);
      // Reconnect-də sifarişləri yenilə
      await loadActiveOrders();
    });

    connection
      .start()
      .then(async () => {
        const connId = connection.connectionId;
        const transport = (connection as any)._transport?.constructor?.name || 'bilinmir';
        addLog(`✅ Qoşuldu! ID: ${connId?.slice(0, 8)} Transport: ${transport}`);
        setIsConnected(true);
        setConnectionState(`Qoşuldu (${transport})`);
        // Qoşulduqdan dərhal sonra aktiv sifarişləri yüklə
        await loadActiveOrders();
      })
      .catch(err => {
        addLog(`❌ Xəta: ${err.message}`);
        setIsConnected(false);
        setConnectionState(`Xəta`);
      });

    connectionRef.current = connection;
    return () => { connection.stop(); };
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

        {/* DEBUG LOG PANELİ */}
        <div className="mt-2 p-2 bg-slate-900 rounded text-xs font-mono text-green-400 max-h-36 overflow-y-auto">
          <div className="text-yellow-400 mb-1">📡 {connectionState}</div>
          {eventLog.length === 0
            ? <div className="text-slate-500">Hadisə gözlənilir...</div>
            : eventLog.map((log, i) => <div key={i}>{log}</div>)
          }
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

            {/* Ev markerləri — hər aktiv kuryer üçün çatdırılma ünvanı */}
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