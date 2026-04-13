// @ts-nocheck
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) { onPick(e.latlng.lat, e.latlng.lng); },
    });
    return null;
}

interface LeafletMapPickerProps {
    pin: [number, number] | null;
    onPick: (lat: number, lng: number) => void;
    height?: number;
}

export default function LeafletMapPicker({ pin, onPick, height = 220 }: LeafletMapPickerProps) {
    const center: [number, number] = pin || [16.0544, 108.2022];

    return (
        <div style={{ height, width: '100%', position: 'relative', zIndex: 0 }}>
            <MapContainer
                key={JSON.stringify(center)}
                center={center}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler onPick={onPick} />
                {pin && <Marker position={pin} />}
            </MapContainer>
        </div>
    );
}
