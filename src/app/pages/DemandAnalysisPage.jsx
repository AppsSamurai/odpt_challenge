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
    setPlannerTimeFilter,
    t
}) {
    const [showEmptyEvents, setShowEmptyEvents] = React.useState(false);

    // New Insight: Connectivity Pattern Analysis
    const networkStats = React.useMemo(() => {
        if (!activeDataset || !demandStats.usage) return { dominantStop: null, hubDependency: 0, networkType: 'Analyzing...' };

        // 1. Find Dominant Hub
        let maxUsage = 0;
        let dominantId = null;
        Object.entries(demandStats.usage).forEach(([id, count]) => {
            if (count > maxUsage) {
                maxUsage = count;
                dominantId = id;
            }
        });
        const dominantStop = activeDataset.stops.find(s => s.id === dominantId);

        // 2. Calculate Hub Dependency (Flows touching hub / Total flows)
        let hubTrips = 0;
        let totalFlowTrips = 0;

        Object.entries(demandStats.flows || {}).forEach(([originId, dests]) => {
            Object.entries(dests).forEach(([destId, count]) => {
                totalFlowTrips += count;
                if (originId === dominantId || destId === dominantId) {
                    hubTrips += count;
                }
            });
        });

        const ratio = totalFlowTrips > 0 ? hubTrips / totalFlowTrips : 0;

        let type = t('Hybrid Zone');
        if (ratio > 0.6) type = t('Hub-Spoke System');
        else if (ratio < 0.3) type = t('Any-to-Any Service');

        // 3. Identify Ghost Stops (Zero Usage)
        const ghostStops = activeDataset.stops.filter(s => !demandStats.usage[s.id] && !demandStats.flows[s.id]);

        // 4. Calculate Mean Trip Distance (approx KM)
        let totalDistKm = 0;
        let distTrips = 0;

        // Simple Haversine-like approximation for local distances
        const deg2rad = (deg) => deg * (Math.PI / 180);
        const getDistKm = (lat1, lon1, lat2, lon2) => {
            const R = 6371; // Radius of the earth in km
            const dLat = deg2rad(lat2 - lat1);
            const dLon = deg2rad(lon2 - lon1);
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        };

        Object.entries(demandStats.flows || {}).forEach(([originId, dests]) => {
            const origin = activeDataset.stops.find(s => s.id === originId);
            if (!origin) return;

            Object.entries(dests).forEach(([destId, count]) => {
                const dest = activeDataset.stops.find(s => s.id === destId);
                if (dest) {
                    const dist = getDistKm(origin.lat, origin.lon, dest.lat, dest.lon);
                    totalDistKm += (dist * count);
                    distTrips += count;
                }
            });
        });

        const avgTripKm = distTrips > 0 ? (totalDistKm / distTrips) : 0;

        return {
            dominantStop,
            hubDependency: ratio,
            networkType: type,
            ghostStops: ghostStops.slice(0, 5), // Top 5 candidates
            ghostCount: ghostStops.length,
            avgTripKm,
            mobilityType: avgTripKm < 2.5 ? 'Micromobility' : 'Vehicle Transit',
            permanentBusReady: maxUsage > 15
        };
    }, [activeDataset, demandStats]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-12">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                    {t('City Planner')}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-black uppercase border border-amber-100 shadow-sm animate-in zoom-in duration-500">
                        {t('Demand Visualization Active')}
                    </span>
                </h2>
                <p className="text-slate-500 font-bold mt-1">{t('Deep analytics on regional usage patterns and infrastructure requirements.')}</p>
            </header>

            <div className="flex flex-col xl:flex-row gap-6 h-[700px]">
                <div className="xl:w-1/3 bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder={t('Locate specific point...')}
                                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                            />
                        </div>
                    </div>

                    {/* NEW: Global Analysis Filters */}
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 space-y-4">
                        <div>
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">{t('Temporal Filter')}</p>
                            <div className="flex flex-wrap gap-2">
                                {['all', 'weekday', 'weekend', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                    <button
                                        key={day}
                                        onClick={() => setPlannerTimeFilter(day)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${plannerTimeFilter === day ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-white text-slate-400 hover:text-emerald-500 border border-slate-100'}`}
                                    >
                                        {t(day.charAt(0).toUpperCase() + day.slice(1))}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Map Layers')}</p>
                            <button
                                onClick={() => setShowEmptyEvents(!showEmptyEvents)}
                                className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors ${showEmptyEvents ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                            >
                                {showEmptyEvents ? t('Hide Inactive Zones') : t('Show Inactive Zones')}
                            </button>
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
                                    <p className={`text-[10px] uppercase font-bold ${selectedPoint?.id === stop.id ? 'text-emerald-400' : 'text-slate-400'}`}>{t('Demand Density')}: {demandStats.usage[stop.id] || 0}</p>
                                </div>
                                <ChevronRight size={16} className={selectedPoint?.id === stop.id ? 'text-emerald-400' : 'text-slate-300'} />
                            </button>
                        ))}
                        {!activeDataset && (
                            <div className="py-20 text-center opacity-40">
                                <Activity className="mx-auto mb-4" />
                                <p className="text-xs font-bold uppercase tracking-widest">{t('Connect Dataset for Analysis')}</p>
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
                                            {(showEmptyEvents || usageCount > 0 || Object.keys(stopFlows).length > 0) && (
                                                <>
                                                    {flowLines}
                                                    <CircleMarker
                                                        center={[stop.lat, stop.lon]}
                                                        radius={usageCount > 0 ? radius : 3}
                                                        fillColor={usageCount > 0 ? color : '#cbd5e1'}
                                                        color="white"
                                                        weight={2}
                                                        opacity={usageCount > 0 ? 1 : 0.5}
                                                        fillOpacity={usageCount > 0 ? 0.6 : 0.3}
                                                        eventHandlers={{
                                                            click: () => setSelectedPoint(stop),
                                                        }}
                                                    >
                                                        <Popup>
                                                            <div className="p-1">
                                                                <p className="font-black text-slate-900 m-0">{stop.name}</p>
                                                                {usageCount > 0 ? (
                                                                    <>
                                                                        <p className="text-[10px] font-bold text-slate-500 m-0 uppercase mt-1">{t('Total Usage')}: <span className="text-emerald-600">{usageCount} events</span></p>
                                                                        <p className="text-[9px] font-bold text-slate-400 m-0 uppercase mt-1">{t('Destinations')}: {Object.keys(stopFlows).length}</p>
                                                                    </>
                                                                ) : (
                                                                    <p className="text-[10px] font-bold text-slate-400 m-0 uppercase mt-1 italic">{t('No recorded demand')}</p>
                                                                )}
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
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">{t('Demand Heatmap')}</p>
                                <p className="text-sm font-bold">{selectedPoint ? selectedPoint.name : t("Visualizing Density")}</p>
                            </div>
                            <div className="absolute top-8 right-8 z-[1000] bg-white/90 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-200 shadow-xl pointer-events-none">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('Demand Scale')}</p>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> <span className="text-[8px] font-bold text-slate-600">{t('Low')}</span></div>
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> <span className="text-[8px] font-bold text-slate-600">{t('Mid')}</span></div>
                                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div> <span className="text-[8px] font-bold text-slate-600">{t('High')}</span></div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200 h-full flex flex-col items-center justify-center">
                            <Activity className="mx-auto mb-6 text-slate-200" size={64} />
                            <p className="text-slate-400 font-black text-xl">{t('Connect Dataset to Activate Planner Analytics.')}</p>
                        </div>
                    )}
                </div>
            </div>

            {selectedPoint && pointStats && (
                <div className="mt-8 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden relative">
                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                        <div className="flex-1 w-full">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{t('Demand Analysis')}: {selectedPoint.name}</p>
                                <div className="flex flex-wrap gap-1">
                                    {['all', 'weekday', 'weekend', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                        <button
                                            key={day}
                                            onClick={() => setPlannerTimeFilter(day)}
                                            className={`px-2 py-1 rounded text-[8px] font-black uppercase transition-all ${plannerTimeFilter === day ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-50 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50'}`}
                                        >
                                            {t(day.charAt(0).toUpperCase() + day.slice(1))}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('Filtered Events')}</p>
                                    <p className="text-3xl font-black text-slate-900 mt-1">{demandStats.usage[selectedPoint.id] || 0}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('Peak Hourly Demand')}</p>
                                    <p className="text-3xl font-black text-slate-900 mt-1">{pointStats.maxUsage}</p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">at {pointStats.peakHour}:00</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('Service Window')}</p>
                                    <p className="text-3xl font-black text-slate-900 mt-1">{selectedPoint.window}</p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">{t('GTFS-Flex Sync')}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('Avg Trip Dist')}</p>
                                    <p className="text-3xl font-black text-slate-900 mt-1">{networkStats.avgTripKm.toFixed(1)} <span className="text-sm text-slate-500 font-bold">{t('km')}</span></p>
                                    <p className={`text-[10px] font-bold uppercase mt-1 ${networkStats.avgTripKm < 2.5 ? 'text-blue-600' : 'text-slate-500'}`}>
                                        {t(networkStats.mobilityType)}
                                    </p>
                                </div>
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm shadow-emerald-500/10 col-span-2 md:col-span-4 lg:col-span-1">
                                    <p className="text-xs font-black text-emerald-700 uppercase flex items-center gap-1 tracking-wide">
                                        <TrendingUp size={12} /> {t('Priority Level')}
                                    </p>
                                    <p className="text-xl font-black text-emerald-800 leading-tight mt-2">
                                        {demandStats.usage[selectedPoint.id] > 20 ? t('Actionable Priority') : t('Routine Monitoring')}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="lg:w-1/3 w-full flex flex-col gap-4">
                            {/* Network Topology Card (New Insight) */}
                            <div className="bg-slate-900 text-white p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden flex-1">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Activity size={64} fill="white" />
                                </div>
                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10">
                                    <Activity size={12} fill="currentColor" /> {t('Connectivity Pattern')}
                                </p>

                                <div className="space-y-4 relative z-10">
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{t('Dominant Hub')}</p>
                                        <p className="font-black text-lg leading-tight truncate">{networkStats.dominantStop?.name || 'N/A'}</p>
                                    </div>

                                    <div className="pt-4 border-t border-white/10">
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">{t('Strategic Recommendation')}</p>
                                        <p className="text-xs font-bold leading-relaxed text-slate-300">
                                            {networkStats.hubDependency > 0.6
                                                ? t("Relies heavily on central nodes. Prioritize scheduling sync at the dominant hub.")
                                                : t("Distributed usage indicates a mesh pattern. Maintain flexible routing.")}
                                        </p>
                                        {/* Permanent Bus Suggestion based on filter */}
                                        {networkStats.permanentBusReady && (
                                            <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                                <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                                    <Zap size={10} /> {t('Fixed Route Opportunity')}
                                                </p>
                                                <p className="text-[10px] font-bold text-emerald-100 leading-tight">
                                                    {t('High persistent volume')} {(plannerTimeFilter !== 'all') && `on ${plannerTimeFilter}s`} {t('detected at')} {networkStats.dominantStop?.name}.
                                                    {t('Consider transitioning to a permanent fixed-route bus service to reduce on-demand operational costs.')}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Optimization Candidates (Ghost Stops) */}
                                    {networkStats.ghostCount > 0 && plannerTimeFilter === 'all' && (
                                        <div className="pt-4 border-t border-white/10">
                                            <p className="text-[9px] font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                <TrendingUp size={10} className="rotate-180" /> {t('Underutilized Infrastructure')} ({networkStats.ghostCount})
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {networkStats.ghostStops.map(s => (
                                                    <span key={s.id} className="px-2 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-md text-[9px] font-bold truncate max-w-[120px]">
                                                        {s.name}
                                                    </span>
                                                ))}
                                            </div>
                                            <p className="text-[8px] text-slate-500 mt-1 italic">{t('Stops with zero recorded demand. Consider relocating.')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{t('Active Service Hours Distribution')} ({selectedPoint.window})</p>
                            <div className="flex gap-3">
                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400"></div> <span className="text-[9px] font-bold text-slate-600 uppercase">{t('Peak')}</span></div>
                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-200"></div> <span className="text-[9px] font-bold text-slate-500 uppercase">{t('Standard')}</span></div>
                            </div>
                        </div>
                        <div className="flex items-end gap-1.5 h-20 w-full mt-2">
                            {pointStats.serviceHours.map((val, idx) => {
                                const h = pointStats.startHour + idx;
                                return (
                                    <div
                                        key={h}
                                        className={`flex-1 rounded-t-lg transition-all duration-500 group relative ${h === pointStats.peakHour ? 'bg-amber-400 shadow-md' : 'bg-slate-100 hover:bg-slate-200'}`}
                                        style={{ height: `${Math.max((val / (pointStats.maxUsage || 1)) * 100, 8)}%` }}
                                    >
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                                            {h}:00 — {val} {t('events')}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase mt-2 border-t border-slate-100 pt-2">
                            <span>{pointStats.startHour}:00</span>
                            <span className="text-slate-400">{t('Midpoint')}</span>
                            <span>{pointStats.endHour}:00</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
