import { MapPin, Home, Package } from 'lucide-react';

interface Location {
  lat: number;
  lng: number;
}

interface OrderTrackingMapProps {
  courierLocation?: Location;
  customerLocation?: Location;
  restaurantLocation?: Location;
}

export default function OrderTrackingMap({
  courierLocation,
  customerLocation,
  restaurantLocation
}: OrderTrackingMapProps) {
  return (
    <div className="relative h-[400px] bg-muted rounded-lg overflow-hidden border">
      {/* Simple visual map representation */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 dark:from-slate-900 dark:to-slate-800">
        {/* Grid pattern for map effect */}
        <div className="absolute inset-0 opacity-20">
          <div className="grid grid-cols-8 grid-rows-8 h-full">
            {Array.from({ length: 64 }).map((_, i) => (
              <div key={i} className="border border-gray-300 dark:border-gray-700" />
            ))}
          </div>
        </div>

        {/* Restaurant Location */}
        {restaurantLocation && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
            style={{
              left: '30%',
              top: '30%',
            }}
          >
            <div className="relative">
              <div className="absolute -inset-2 bg-red-500/20 rounded-full animate-ping" />
              <div className="relative flex items-center justify-center w-10 h-10 bg-red-500 rounded-full shadow-lg">
                <Home className="h-5 w-5 text-white" />
              </div>
              <p className="absolute top-12 left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap bg-white dark:bg-slate-800 px-2 py-1 rounded shadow">
                Restaurant
              </p>
            </div>
          </div>
        )}

        {/* Customer Location */}
        {customerLocation && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
            style={{
              left: '70%',
              top: '70%',
            }}
          >
            <div className="relative">
              <div className="absolute -inset-2 bg-green-500/20 rounded-full animate-pulse" />
              <div className="relative flex items-center justify-center w-10 h-10 bg-green-500 rounded-full shadow-lg">
                <Package className="h-5 w-5 text-white" />
              </div>
              <p className="absolute top-12 left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap bg-white dark:bg-slate-800 px-2 py-1 rounded shadow">
                Delivery Address
              </p>
            </div>
          </div>
        )}

        {/* Courier Location (Moving) */}
        {courierLocation && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 transition-all duration-1000 ease-in-out"
            style={{
              left: '50%',
              top: '50%',
            }}
          >
            <div className="relative">
              <div className="absolute -inset-3 bg-blue-500/30 rounded-full animate-ping" />
              <div className="relative flex items-center justify-center w-12 h-12 bg-blue-600 rounded-full shadow-xl ring-4 ring-blue-200 dark:ring-blue-900">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full shadow-lg text-xs font-medium whitespace-nowrap">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  Courier Location
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Path line (visual) */}
        {courierLocation && customerLocation && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            <path
              d="M 50% 50% Q 60% 60%, 70% 70%"
              stroke="url(#pathGradient)"
              strokeWidth="3"
              strokeDasharray="10 5"
              fill="none"
              className="animate-pulse"
            />
          </svg>
        )}

        {/* Info text when no courier location */}
        {!courierLocation && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Waiting for courier location...</p>
            </div>
          </div>
        )}
      </div>

      {/* Map legend */}
      <div className="absolute bottom-4 left-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg p-3 text-xs space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full" />
          <span>Restaurant</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-600 rounded-full" />
          <span>Courier</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <span>Destination</span>
        </div>
      </div>

      {/* Live indicator */}
      {courierLocation && (
        <div className="absolute top-4 right-4 bg-white dark:bg-slate-800 rounded-full shadow-lg px-3 py-1.5 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium">Live Tracking</span>
        </div>
      )}
    </div>
  );
}
