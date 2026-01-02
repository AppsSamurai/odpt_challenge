import React, { useState, useMemo } from 'react';
import {
    Map as MapIcon,
    Search,
    ChevronRight,
    Activity,
    MapPin,
    ArrowRightLeft,
    Navigation2,
    Zap,
    Trash2,
    ArrowRight,
    Info,
    X,
    Car,
    Bus
} from 'lucide-react';
import { MapContainer, TileLayer, Popup, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { ChangeView } from '../components/MapComponents';
import SearchableSelect from '../components/SearchableSelect';
import { formatTime, addMins } from '../utils';

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

// High-end Custom Icons for Map Anchors
const createIcon = (color) => new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const icons = {
    pickup: createIcon('green'),
    dropoff: createIcon('orange'),
    selected: createIcon('black'),
    default: createIcon('blue')
};

export default function ExplorePage({
    activeDataset,
    selectedPoint,
    setSelectedPoint,
    onBook,
    t
}) {
    const [pickup, setPickup] = useState(null);
    const [dropoff, setDropoff] = useState(null);
    const [isRequesting, setIsRequesting] = useState(false);
    const [search, setSearch] = useState("");
    const [showInfoModal, setShowInfoModal] = useState(false);

    // Helper to format JSON keys
    const formatKey = (str) => str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    // Handle initial dataset loading and changes
    React.useEffect(() => {
        if (activeDataset) {
            setPickup(null);
            setDropoff(null);
            setSearch("");
            // Default select first stop if nothing selected
            if (!selectedPoint && activeDataset.stops?.length > 0) {
                setSelectedPoint(activeDataset.stops[0]);
            }
        }
    }, [activeDataset?.id]);

    const filteredStops = useMemo(() => {
        if (!activeDataset?.stops) return [];
        if (!search) return activeDataset.stops;
        return activeDataset.stops.filter(s =>
            s.name.toLowerCase().includes(search.toLowerCase())
        );
    }, [activeDataset, search]);

    const handlePointSelect = (stop) => {
        if (!pickup) {
            setPickup(stop);
            setSelectedPoint(stop);
        } else if (!dropoff && stop.id !== pickup.id) {
            setDropoff(stop);
            setSelectedPoint(stop);
        } else {
            if (stop.id === pickup.id) {
                setPickup(null);
            } else if (dropoff && stop.id === dropoff.id) {
                setDropoff(null);
            } else {
                setDropoff(stop);
                setSelectedPoint(stop);
            }
        }
    };

    const handleRequest = () => {
        if (!pickup || !dropoff) return;

        // Get fare from additional info or use default
        const fare = activeDataset?.additionalInfo?.usage_fee?.standard_fare?.adult_standard ||
            activeDataset?.additionalInfo?.usage_fee?.standard_fare?.adult ||
            activeDataset?.additionalInfo?.usage_fee?.standard_fare?.general_adult ||
            500;

        onBook({
            type: 'explore',
            from: pickup.name,
            to: dropoff.name,
            fromCoords: `${pickup.lat},${pickup.lon}`,
            toCoords: `${dropoff.lat},${dropoff.lon}`,
            date: new Date().toISOString().split('T')[0],
            departureTime: formatTime(new Date()),
            arrivalTime: formatTime(addMins(new Date(), 25)),
            noticePeriod: '30',
            cost: fare,
            provider: activeDataset?.rules?.['r1']?.desc || 'Rural Sync Provider',
            serviceName: activeDataset?.additionalInfo?.service_name,
            operatingHours: activeDataset?.additionalInfo?.operating_hours
        });
    };

    const handleSwap = () => {
        const temp = pickup;
        setPickup(dropoff);
        setDropoff(temp);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1600px] mx-auto">
            <header className="mb-8">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                    {t('Explore Regional Hubs')}
                </h2>
                <p className="text-slate-500 font-bold mt-1">
                    {activeDataset ? `${t('Accessing')} ${activeDataset.stops?.length || 0} ${t('pickup points in')} ${activeDataset.additionalInfo?.service_name || activeDataset.name}` : t('Select a regional dataset to begin exploration.')}
                </p>
            </header>

            {/* NEW: Horizontal Request Bar */}
            <div className="relative z-50">
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl p-8 space-y-6 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex flex-col md:flex-row items-end gap-4 w-full">
                        <div className="flex-1 w-full translate-y-2">

                            <SearchableSelect
                                label={t('Startup Point')}
                                value={pickup}
                                options={activeDataset?.stops || []}
                                onChange={(val) => { setPickup(val); setSelectedPoint(val); }}
                                placeholder={t('Select origin...')}
                                disabled={!activeDataset}
                            />
                        </div>

                        <button
                            onClick={handleSwap}
                            disabled={!pickup && !dropoff}
                            className="mb-1 p-3 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-emerald-500 rounded-xl transition-all border border-slate-100 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed group"
                            title="Swap Start and End"
                        >
                            <ArrowRightLeft size={20} className="group-active:rotate-180 transition-transform duration-300" />
                        </button>

                        <div className="flex-1 w-full translate-y-2">
                            <SearchableSelect
                                label={t('Destination Point')}
                                value={dropoff}
                                options={activeDataset?.stops || []}
                                onChange={(val) => { setDropoff(val); setSelectedPoint(val); }}
                                placeholder={t('Select destination...')}
                                disabled={!activeDataset}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            onClick={handleRequest}
                            disabled={!pickup || !dropoff || isRequesting}
                            className={`flex-1 py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 transition-all shadow-lg ${(!pickup || !dropoff) ? 'bg-slate-200 cursor-not-allowed shadow-none' : isRequesting ? 'bg-slate-400' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20 active:scale-95'}`}
                        >
                            {isRequesting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    {t('Syncing...')}
                                </>
                            ) : (
                                <>
                                    <Zap size={18} fill="currentColor" /> {t('Confirm Now')}
                                </>
                            )}
                        </button>

                        {(pickup || dropoff) && (
                            <button
                                onClick={() => { setPickup(null); setDropoff(null); }}
                                className="flex items-center gap-2 px-6 py-4 bg-slate-50 text-slate-400 font-black uppercase text-[10px] hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all border border-slate-100"
                            >
                                <Trash2 size={16} /> {t('Reset')}
                            </button>
                        )}

                        {activeDataset?.additionalInfo && (
                            <button
                                onClick={() => setShowInfoModal(true)}
                                className="flex items-center gap-2 px-6 py-4 bg-blue-50 text-blue-500 font-black uppercase text-[10px] hover:text-blue-600 hover:bg-blue-100 rounded-2xl transition-all border border-blue-100"
                            >
                                <Info size={16} /> {t('Ticket Rules')}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Layout Container with Fixed Height for scrolling */}
            <div className="flex flex-col xl:flex-row gap-6 h-[750px] relative z-0">
                {/* Left Panel: Search & Registry (Now occupies full sidebar width) */}
                <div className="xl:w-1/4 bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden flex flex-col h-full">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/20 flex-shrink-0">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder={t('Locate specific point...')}
                                className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        <div className="flex items-center justify-between px-4 mb-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Regional Point Registry')}</p>
                            <span className="text-[8px] font-black bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full uppercase">{filteredStops.length} {t('nodes')}</span>
                        </div>
                        {filteredStops.length > 0 ? (
                            filteredStops.map(stop => (
                                <button
                                    key={`${activeDataset?.id || 'ds'}-${stop.id}`}
                                    onClick={() => handlePointSelect(stop)}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${pickup?.id === stop.id ? 'bg-emerald-50 text-emerald-600 ring-2 ring-emerald-500/20' :
                                        dropoff?.id === stop.id ? 'bg-amber-50 text-amber-600 ring-2 ring-amber-500/20' :
                                            selectedPoint?.id === stop.id ? 'bg-slate-900 text-white shadow-xl' : 'hover:bg-slate-50 text-slate-600'
                                        }`}
                                >
                                    <div className="text-left">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-black line-clamp-3 max-w-[180px] leading-tight">{stop.name}</p>
                                            {pickup?.id === stop.id && <span className="text-[8px] bg-emerald-500 text-white px-1.5 py-0.5 rounded font-black uppercase">{t('Start')}</span>}
                                            {dropoff?.id === stop.id && <span className="text-[8px] bg-amber-500 text-white px-1.5 py-0.5 rounded font-black uppercase">{t('End')}</span>}
                                        </div>
                                        <p className={`text-[10px] uppercase font-bold ${(pickup?.id === stop.id || dropoff?.id === stop.id) ? 'opacity-70' : 'text-slate-400'}`}>{t('Node ID')}: {stop.id.split(':').pop()}</p>
                                    </div>
                                    <ChevronRight size={16} className={(pickup?.id === stop.id || dropoff?.id === stop.id) ? 'opacity-50' : selectedPoint?.id === stop.id ? 'text-emerald-400' : 'text-slate-300'} />
                                </button>
                            ))
                        ) : (
                            <div className="py-20 text-center opacity-40">
                                <Activity className="mx-auto mb-4" />
                                <p className="text-xs font-bold uppercase tracking-widest">{t('No matching stops')}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Map */}
                <div className="xl:flex-1 bg-slate-100 rounded-[2.5rem] border border-slate-200 shadow-inner shadow-slate-200 overflow-hidden relative h-full">
                    {activeDataset ? (
                        <div className="w-full h-full relative" key={activeDataset.id}>
                            <MapContainer center={[activeDataset.hubLat, activeDataset.hubLon]} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
                                <TileLayer
                                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                                    attribution='&copy; OpenStreetMap &copy; CARTO'
                                />
                                <ChangeView
                                    center={selectedPoint ? [selectedPoint.lat, selectedPoint.lon] : [activeDataset.hubLat, activeDataset.hubLon]}
                                    zoom={selectedPoint ? 15 : 13}
                                />

                                {activeDataset.stops?.map(stop => {
                                    const isPickup = pickup?.id === stop.id;
                                    const isDropoff = dropoff?.id === stop.id;
                                    const isSelected = selectedPoint?.id === stop.id;

                                    const icon = isPickup ? icons.pickup :
                                        isDropoff ? icons.dropoff :
                                            isSelected ? icons.selected :
                                                icons.default;

                                    return (
                                        <Marker
                                            key={`${activeDataset.id}-${stop.id}-pin`}
                                            position={[stop.lat, stop.lon]}
                                            icon={icon}
                                            eventHandlers={{
                                                click: () => handlePointSelect(stop),
                                            }}
                                        >
                                            <Popup>
                                                <div className="p-1 min-w-[140px]">
                                                    <p className="font-black text-slate-900 m-0 text-sm mb-3">{stop.name}</p>
                                                    <div className="flex flex-col gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setPickup(stop); }}
                                                            className="flex items-center justify-center gap-2 text-[10px] font-black uppercase bg-emerald-500 text-white px-3 py-2.5 rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                                                        >
                                                            <MapPin size={10} /> {t('Set Startup')}
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setDropoff(stop); }}
                                                            className="flex items-center justify-center gap-2 text-[10px] font-black uppercase bg-amber-500 text-white px-3 py-2.5 rounded-xl hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20"
                                                        >
                                                            <Navigation2 size={10} /> {t('Set Destination')}
                                                        </button>
                                                    </div>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    );
                                })}

                                {pickup && dropoff && (
                                    <Polyline
                                        positions={[[pickup.lat, pickup.lon], [dropoff.lat, dropoff.lon]]}
                                        color="#10b981"
                                        weight={4}
                                        dashArray="10, 10"
                                        opacity={0.6}
                                    />
                                )}
                            </MapContainer>
                        </div>
                    ) : (
                        <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200 h-full flex flex-col items-center justify-center">
                            <MapIcon className="mx-auto mb-6 text-slate-200" size={64} />
                            <p className="text-slate-400 font-black text-xl">{t('Select a regional dataset to activate spatial exploration.')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Info Modal */}
            {showInfoModal && activeDataset?.additionalInfo && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300 relative max-h-[85vh] overflow-hidden flex flex-col">
                        <button
                            onClick={() => setShowInfoModal(false)}
                            className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors z-10"
                        >
                            <X size={20} className="text-slate-500" />
                        </button>

                        <div className="mb-6 shrink-0">
                            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                                <Car className="text-emerald-500" /> {t('Service Details')}
                            </h3>
                            <p className="text-slate-500 text-sm font-bold mt-1">{activeDataset.additionalInfo.service_name}</p>
                        </div>

                        <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-1">
                            {/* Usage Fee Section */}
                            {activeDataset.additionalInfo.usage_fee && (
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                    <h4 className="text-xs font-black uppercase text-emerald-500 tracking-widest mb-3 border-b border-slate-200/50 pb-2">
                                        {t('Flex Transport Fares')}
                                    </h4>
                                    <div className="space-y-4">
                                        {Object.entries(activeDataset.additionalInfo.usage_fee).map(([category, value]) => (
                                            <div key={category} className="space-y-1">
                                                <p className="text-[10px] font-black uppercase text-slate-400">{t(formatKey(category))}</p>
                                                {typeof value === 'object' && value !== null ? (
                                                    Object.entries(value).map(([subKey, subValue]) => (
                                                        <div key={subKey} className="flex justify-between items-start pl-2">
                                                            <span className="text-sm font-bold text-slate-600">
                                                                {typeof subKey === 'string' && subKey !== 'note' && isNaN(subKey) ? t(formatKey(subKey)) : ''}
                                                                {subKey === 'note' && <span className="text-amber-600 italic font-normal text-xs">{subValue}</span>}
                                                            </span>
                                                            {!Array.isArray(subValue) && typeof subValue !== 'object' && subKey !== 'note' && (
                                                                <span className="font-black text-slate-900">
                                                                    {typeof subValue === 'number' ? `¥ ${subValue}` : subValue}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-sm text-slate-600">{value}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Important Notes */}
                            {activeDataset.additionalInfo.important_notes && (
                                <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100">
                                    <h4 className="text-xs font-black uppercase text-amber-600 tracking-widest mb-3 border-b border-amber-200/50 pb-2">
                                        {t('Important Notes')}
                                    </h4>
                                    <ul className="space-y-2">
                                        {activeDataset.additionalInfo.important_notes.map((note, idx) => (
                                            <li key={idx} className="text-xs font-bold text-amber-900 flex gap-2">
                                                <span className="text-amber-500">•</span> {note}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Reservation Methods */}
                            {activeDataset.additionalInfo.reservation_methods && (
                                <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                                    <h4 className="text-xs font-black uppercase text-blue-500 tracking-widest mb-3 border-b border-blue-200/50 pb-2">
                                        {t('How to Book')}
                                    </h4>
                                    <div className="space-y-3">
                                        {activeDataset.additionalInfo.reservation_methods.map((method, idx) => (
                                            <div key={idx} className="text-sm text-slate-700">
                                                <span className="font-black text-blue-900">{method.method}:</span> {method.note || method.availability}
                                            </div>
                                        ))}
                                        {activeDataset.additionalInfo.reservation_window && (
                                            <div className="pt-2 text-xs font-bold text-slate-500 italic border-t border-blue-200/50 mt-2">
                                                {t('Window')}: {activeDataset.additionalInfo.reservation_window}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
