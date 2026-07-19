import { useState, useMemo, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Navigation } from 'lucide-react';

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationPickerProps {
    onLocationSelect: (lat: number, lng: number) => void;
    currentLocation?: { lat: number, lng: number };
}

function LocationMarker({ position, setPosition }: { position: L.LatLng, setPosition: (acc: L.LatLng) => void }) {
    const markerRef = useRef<L.Marker>(null);
    
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng);
            map.flyTo(e.latlng, map.getZoom());
        },
    });

    const eventHandlers = useMemo(
      () => ({
        dragend() {
          const marker = markerRef.current;
          if (marker != null) {
            setPosition(marker.getLatLng());
          }
        },
      }),
      [setPosition],
    );
  
    return (
      <Marker
        draggable={true}
        eventHandlers={eventHandlers}
        position={position}
        ref={markerRef}
      >
      </Marker>
    )
}

export function LocationPicker({ onLocationSelect, currentLocation }: LocationPickerProps) {
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState<L.LatLng>(
        currentLocation ? new L.LatLng(currentLocation.lat, currentLocation.lng) : new L.LatLng(19.9975, 73.7898) // Default Nashik
    );
    const [loadingLoc, setLoadingLoc] = useState(false);

    // Update position if prop changes
    useEffect(() => {
        if(currentLocation) {
            setPosition(new L.LatLng(currentLocation.lat, currentLocation.lng));
        }
    }, [currentLocation]);

    const handleCurrentLocation = () => {
        setLoadingLoc(true);
        navigator.geolocation.getCurrentPosition((pos) => {
            const newPos = new L.LatLng(pos.coords.latitude, pos.coords.longitude);
            setPosition(newPos);
            setLoadingLoc(false);
        }, (err) => {
            console.error(err);
            setLoadingLoc(false);
            alert("Could not fetch location.");
        });
    };

    const handleConfirm = () => {
        onLocationSelect(position.lat, position.lng);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full flex items-center gap-2 border-dashed border-2 p-6 h-auto hover:bg-slate-50">
                    <MapPin className="h-5 w-5 text-red-500" />
                    <div className="text-left">
                        <span className="font-semibold block">Pin Delivery Location</span>
                        <span className="text-xs text-muted-foreground block">
                            {currentLocation ? 'Location Pinned ✓' : 'Click to precise location on map'}
                        </span>
                    </div>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-4 bg-white z-10 border-b shrink-0">
                    <DialogTitle className="flex justify-between items-center">
                        Select Delivery Location
                        <Button size="sm" variant="outline" onClick={handleCurrentLocation} disabled={loadingLoc} className="gap-2 text-xs">
                            <Navigation className="w-3 h-3" /> {loadingLoc ? 'Locating...' : 'Use My Location'}
                        </Button>
                    </DialogTitle>
                </DialogHeader>
                
                <div className="flex-1 relative bg-slate-100">
                    {/* Map */}
                    {open && (
                         <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }}>
                            <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <LocationMarker position={position} setPosition={setPosition} />
                        </MapContainer>
                    )}
                </div>

                <DialogFooter className="p-4 border-t bg-white shrink-0">
                    <div className="w-full flex justify-between items-center">
                        <div className="text-xs text-muted-foreground">
                            Lat: {position.lat.toFixed(6)}, Lng: {position.lng.toFixed(6)}
                        </div>
                        <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700">Confirm Location</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
