import React from 'react';
import {
    Map as MapIcon,
    Search,
    ChevronRight,
    Activity
} from 'lucide-react';
import { MapContainer, TileLayer, Popup, Marker } from 'react-leaflet';
import L from 'leaflet';
import { ChangeView } from '../components/MapComponents';

// Fix for default Leaflet marker icons in Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

export default function ExplorePage({
    activeDataset,
    selectedPoint,
    setSelectedPoint
}) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-12">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                    Regional Spatial Context
                </h2>
                <p className="text-slate-500 font-bold mt-1">Exploration of regional hubs and last-mile pickup points.</p>
            </header>

            <div className="flex flex-col xl:flex-row gap-6 h-[700px]">
                <div className="xl:w-1/3 bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Locate specific point..."
                                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        {activeDataset?.stops.map(stop => (
                            <button
                                key={stop.id}
                                onClick={() => setSelectedPoint(stop)}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${selectedPoint?.id === stop.id ? 'bg-slate-900 text-white shadow-xl' : 'hover:bg-slate-50 text-slate-600'}`}
                            >
                                <div className="text-left">
                                    <p className="text-sm font-black">{stop.name}</p>
                                    <p className={`text-[10px] uppercase font-bold ${selectedPoint?.id === stop.id ? 'text-emerald-400' : 'text-slate-400'}`}>Available: {stop.window}</p>
                                </div>
                                <ChevronRight size={16} className={selectedPoint?.id === stop.id ? 'text-emerald-400' : 'text-slate-300'} />
                            </button>
                        ))}
                        {!activeDataset && (
                            <div className="py-20 text-center opacity-40">
                                <Activity className="mx-auto mb-4" />
                                <p className="text-xs font-bold uppercase tracking-widest">Connect Dataset to View</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="xl:flex-1 bg-slate-100 rounded-[2.5rem] border border-slate-200 shadow-inner shadow-slate-200 overflow-hidden relative min-h-[400px]">
                    {activeDataset ? (
                        <div className="w-full h-full relative">
                            <MapContainer center={[activeDataset.hubLat, activeDataset.hubLon]} zoom={13} style={{ height: '100%', width: '100%' }}>
                                <TileLayer
                                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                                    attribution='&copy; OpenStreetMap &copy; CARTO'
                                />
                                <ChangeView center={selectedPoint ? [selectedPoint.lat, selectedPoint.lon] : null} zoom={15} />
                                {activeDataset.stops.map(stop => (
                                    <Marker
                                        key={stop.id}
                                        position={[stop.lat, stop.lon]}
                                        eventHandlers={{
                                            click: () => setSelectedPoint(stop),
                                        }}
                                    >
                                        <Popup>
                                            <div className="p-1">
                                                <p className="font-black text-slate-900 m-0">{stop.name}</p>
                                                <p className="text-[10px] font-bold text-emerald-600 m-0 uppercase mt-1">Available: {stop.window}</p>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                            </MapContainer>
                            <div className="absolute bottom-8 left-8 z-[1000] bg-slate-900/80 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10 text-white pointer-events-none">
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Spatial Context</p>
                                <p className="text-sm font-bold">{selectedPoint ? selectedPoint.name : "Select a stop to triangulate"}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200 h-full flex flex-col items-center justify-center">
                            <MapIcon className="mx-auto mb-6 text-slate-200" size={64} />
                            <p className="text-slate-400 font-black text-xl">Upload regional GTFS files to activate spatial exploration.</p>
                            <p className="text-slate-300 font-bold mt-2">Map and triangulation will appear once data is ingested.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
