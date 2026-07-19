import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef, useMemo } from "react";
import React from 'react';

interface DriverMapProps {
  driverLoc: { lat: number; lng: number };
  customerLoc: { lat: number; lng: number };
  address?: string;
  onDriverMove?: (lat: number, lng: number) => void;
}

// Component to handle map camera updates
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

// Draggable Marker Component
function DraggableDriverMarker({ position, onMove }: { position: { lat: number, lng: number }, onMove?: (lat: number, lng: number) => void }) {
    const markerRef = useRef<L.Marker>(null);
    const eventHandlers = useMemo(
      () => ({
        dragend() {
          const marker = markerRef.current;
          if (marker != null && onMove) {
            const { lat, lng } = marker.getLatLng();
            onMove(lat, lng);
          }
        },
      }),
      [onMove],
    );
  
    return (
      <Marker
        draggable={!!onMove}
        eventHandlers={eventHandlers}
        position={[position.lat, position.lng]}
        ref={markerRef}
      >
         <Popup>You (Driver) - Drag to adjust</Popup>
      </Marker>
    )
}

export default function DriverMap({ driverLoc, customerLoc, address, onDriverMove }: DriverMapProps) {
  
  useEffect(() => {
    // Fix Leaflet icons only on client side mount
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });
  }, []);

  // Ensure locations are valid numbers before rendering
  if (!driverLoc || !customerLoc || 
      isNaN(driverLoc.lat) || isNaN(driverLoc.lng) || 
      isNaN(customerLoc.lat) || isNaN(customerLoc.lng)) {
      return <div className="h-[300px] w-full bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">Loading Map...</div>;
  }

  return (
    <div className="h-[300px] w-full rounded-lg overflow-hidden border-2 border-slate-200 isolate">
      <MapContainer 
        key={`${JSON.stringify(customerLoc)}`} // Remount if destination (customer) changes radically
        center={[driverLoc.lat, driverLoc.lng]} 
        zoom={14} 
        scrollWheelZoom={false} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <RecenterMap lat={driverLoc.lat} lng={driverLoc.lng} />

        {/* Route Line */}
        {driverLoc && customerLoc && (
          <Polyline 
            key={`${driverLoc.lat}-${driverLoc.lng}-${customerLoc.lat}-${customerLoc.lng}`}
            positions={[
              [driverLoc.lat, driverLoc.lng], 
              [customerLoc.lat, customerLoc.lng]
            ]} 
            pathOptions={{ color: 'red', weight: 4, opacity: 0.7, dashArray: '10, 10' }} 
          />
        )}

        {/* Draggable Driver Marker */}
        <DraggableDriverMarker position={driverLoc} onMove={onDriverMove} />

        {/* Customer Marker */}
        <Marker position={[customerLoc.lat, customerLoc.lng]}>
            <Popup>
              <div className="text-sm font-semibold">Destination</div>
              <div className="text-xs">{address || "Customer Location"}</div>
            </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
