import React from 'react';
import {
    Map as MapIcon,
    Search,
    TrendingUp,
    Zap,
    ChevronRight,
    Activity
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, Marker } from 'react-leaflet';
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

export default function DemandAnalysisPage({
    activeDataset,
    selectedPoint,
    setSelectedPoint,
    demandStats,
    pointStats,
    plannerTimeFilter,
    setPlannerTimeFilter
}) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-12">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                    City Planner Insights
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-black uppercase border border-amber-100 shadow-sm animate-in zoom-in duration-500">
                        Demand Visualization Active
                    </span>
                </h2>
                <p className="text-slate-500 font-bold mt-1">Deep analytics on regional usage patterns and infrastructure requirements.</p>
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
                                    <p className={`text-[10px] uppercase font-bold ${selectedPoint?.id === stop.id ? 'text-emerald-400' : 'text-slate-400'}`}>Demand Density: {demandStats.usage[stop.id] || 0}</p>
                                </div>
                                <ChevronRight size={16} className={selectedPoint?.id === stop.id ? 'text-emerald-400' : 'text-slate-300'} />
                            </button>
                        ))}
                        {!activeDataset && (
                            <div className="py-20 text-center opacity-40">
                                <Activity className="mx-auto mb-4" />
                                <p className="text-xs font-bold uppercase tracking-widest">Connect Dataset for Analysis</p>
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
                                {activeDataset.stops.map(stop => {
                                    const usageCount = demandStats.usage[stop.id] || 0;
                                    const maxUsage = Math.max(...Object.values(demandStats.usage)) || 1;
                                    const radius = 5 + (usageCount / maxUsage) * 25;
                                    const color = usageCount > (maxUsage * 0.7) ? '#f43f5e' : (usageCount > (maxUsage * 0.3) ? '#f59e0b' : '#10b981');

                                    const stopFlows = demandStats.flows?.[stop.id] || {};
                                    const flowLines = Object.entries(stopFlows).map(([did, count]) => {
                                        const target = activeDataset.stops.find(s => s.id === did);
                                        if (!target || count < 2) return null;
                                        return (
                                            <Polyline
                                                key={`${stop.id}-${did}`}
                                                positions={[[stop.lat, stop.lon], [target.lat, target.lon]]}
                                                color={color}
                                                weight={1 + (count / 5)}
                                                opacity={0.3}
                                                dashArray="5, 10"
                                            />
                                        );
                                    });

                                    return (
                                        <React.Fragment key={stop.id}>
                                            {(usageCount > 0 || Object.keys(stopFlows).length > 0) && (
                                                <>
                                                    {flowLines}
                                                    <CircleMarker
                                                        center={[stop.lat, stop.lon]}
                                                        radius={radius}
                                                        fillColor={color}
                                                        color="white"
                                                        weight={2}
                                                        opacity={1}
                                                        fillOpacity={0.6}
                                                        eventHandlers={{
                                                            click: () => setSelectedPoint(stop),
                                                        }}
                                                    >
                                                        <Popup>
                                                            <div className="p-1">
                                                                <p className="font-black text-slate-900 m-0">{stop.name}</p>
                                                                <p className="text-[10px] font-bold text-slate-500 m-0 uppercase mt-1">Total Usage: <span className="text-emerald-600">{usageCount} events</span></p>
                                                                <p className="text-[9px] font-bold text-slate-400 m-0 uppercase mt-1">Destinations: {Object.keys(stopFlows).length}</p>
                                                            </div>
                                                        </Popup>
                                                    </CircleMarker>
                                                </>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </MapContainer>
                            <div className="absolute bottom-8 left-8 z-[1000] bg-slate-900/80 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10 text-white pointer-events-none">
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Demand Heatmap</p>
                                <p className="text-sm font-bold">{selectedPoint ? selectedPoint.name : "Visualizing Density"}</p>
                            </div>
                            <div className="absolute top-8 right-8 z-[1000] bg-white/90 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-200 shadow-xl pointer-events-none">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Demand Scale</p>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> <span className="text-[8px] font-bold text-slate-600">Low</span></div>
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> <span className="text-[8px] font-bold text-slate-600">Mid</span></div>
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div> <span className="text-[8px] font-bold text-slate-600">High</span></div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200 h-full flex flex-col items-center justify-center">
                            <Activity className="mx-auto mb-6 text-slate-200" size={64} />
                            <p className="text-slate-400 font-black text-xl">Connect Dataset to Activate Planner Analytics.</p>
                        </div>
                    )}
                </div>
            </div>

            {selectedPoint && pointStats && (
                <div className="mt-8 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden relative">
                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                        <div className="flex-1 w-full">
                            <div className="flex justify-between items-center mb-4">
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Demand Analysis: {selectedPoint.name}</p>
                                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                                    {[
                                        { id: 'all', label: 'Month' },
                                        { id: 'weekday', label: 'Wkday' },
                                        { id: 'weekend', label: 'Wkend' },
                                        { id: 'day', label: 'Peak' }
                                    ].map(f => (
                                        <button
                                            key={f.id}
                                            onClick={() => setPlannerTimeFilter(f.id)}
                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${plannerTimeFilter === f.id ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Filtered Events</p>
                                    <p className="text-2xl font-black text-slate-900">{demandStats.usage[selectedPoint.id] || 0}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Peak Hourly Demand</p>
                                    <p className="text-2xl font-black text-slate-900">{pointStats.maxUsage}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">at {pointStats.peakHour}:00</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Service Window</p>
                                    <p className="text-2xl font-black text-slate-900">{selectedPoint.window}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">GTFS-Flex Sync</p>
                                </div>
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm shadow-emerald-500/10">
                                    <p className="text-[10px] font-black text-emerald-600 uppercase flex items-center gap-1">
                                        <TrendingUp size={10} /> Usage Logic
                                    </p>
                                    <p className="text-lg font-black text-emerald-700 leading-tight mt-1">
                                        {demandStats.usage[selectedPoint.id] > 20 ? 'Actionable' : 'Monitoring'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="lg:w-1/3 w-full bg-slate-900 text-white p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Zap size={64} fill="white" />
                            </div>
                            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-2 relative z-10">
                                <Zap size={12} fill="currentColor" /> Strategic Recommendation
                            </p>
                            <p className="text-sm font-bold leading-relaxed relative z-10">{pointStats.recommendation}</p>
                            <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-tighter relative z-10">
                                <span>{plannerTimeFilter} view</span>
                                <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                                <span>Threshold: 20</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Active Service Hours Distribution ({selectedPoint.window})</p>
                            <div className="flex gap-2">
                                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div> <span className="text-[8px] font-bold text-slate-500 uppercase">Peak</span></div>
                                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div> <span className="text-[8px] font-bold text-slate-500 uppercase">Standard</span></div>
                            </div>
                        </div>
                        <div className="flex items-end gap-1.5 h-16 w-full">
                            {pointStats.serviceHours.map((val, idx) => {
                                const h = pointStats.startHour + idx;
                                return (
                                    <div
                                        key={h}
                                        className={`flex-1 rounded-t-md transition-all duration-500 group relative ${h === pointStats.peakHour ? 'bg-amber-400' : 'bg-slate-100 hover:bg-slate-200'}`}
                                        style={{ height: `${Math.max((val / (pointStats.maxUsage || 1)) * 100, 4)}%` }}
                                    >
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                                            {h}:00: {val} events
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase mt-2 border-t border-slate-50 pt-2">
                            <span>{pointStats.startHour}:00</span>
                            <span>Midpoint</span>
                            <span>{pointStats.endHour}:00</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
