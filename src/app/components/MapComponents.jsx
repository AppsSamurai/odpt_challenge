import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export function ChangeView({ center, zoom }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom, {
                duration: 1.5
            });
        }
    }, [center, zoom, map]);
    return null;
}
