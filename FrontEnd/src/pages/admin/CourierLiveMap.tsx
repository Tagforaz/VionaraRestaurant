import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export const CourierLiveMap = () => {
  // Simple static map, can be extended for live courier locations
  return (
    <div style={{ height: 350, width: '100%', borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
      <MapContainer center={[40.4093, 49.8671]} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </MapContainer>
    </div>
  );
};
