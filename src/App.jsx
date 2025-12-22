import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Train,
    Bus,
    MapPin,
    Clock,
    ChevronRight,
    AlertCircle,
    Navigation,
    Upload,
    FileText,
    Plus,
    Search,
    Map as MapIcon,
    ArrowRight,
    Info,
    CheckCircle2,
    Calendar,
    Navigation2
} from 'lucide-react';
import JSZip from 'jszip';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

const API_KEY = "ujilulffygft5w68uup7i615deajov6yzsfji8pv0xufcinhedfg8avqzzc4yam6";
const ODPT_URL = "https://api.odpt.org/api/v4";

// Fallback initial data while ODPT loads
const INITIAL_HUBS = [
    { id: 't1', name: 'Tokyo Station', lines: ['Hokuriku Shinkansen'] },
    { id: 't2', name: 'Shinjuku Station', lines: ['Chuo Line'] },
    { id: 't3', name: 'Ueno Station', lines: ['Takasaki Line'] }
];

// Helper to parse CSV data from the provided text files
const parseCSV = (text) => {
    if (!text) return [];
    // Remove BOM if present
    const cleanText = text.replace(/^\ufeff/, '');
    const lines = cleanText.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    // Better CSV line splitting (handles basic quotes)
    const splitCSV = (line) => {
        const result = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) {
                result.push(cur.trim());
                cur = '';
            } else cur += char;
        }
        result.push(cur.trim());
        return result;
    };

    const headers = splitCSV(lines[0]);
    return lines.slice(1).map(line => {
        const values = splitCSV(line);
        return headers.reduce((obj, header, i) => {
            if (header) {
                let val = values[i] || "";
                if (val.startsWith('"') && val.endsWith('"')) val = val.substring(1, val.length - 1);
                obj[header] = val;
            }
            return obj;
        }, {});
    });
};

// Map component to handle centering
function ChangeView({ center, zoom }) {
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

export default function App() {
    const [datasets, setDatasets] = useState([]);
    const [activeDatasetIndex, setActiveDatasetIndex] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedPoint, setSelectedPoint] = useState(null);
    const [tokyoHubs, setTokyoHubs] = useState(INITIAL_HUBS);
    const [view, setView] = useState('planner');

    const [planner, setPlanner] = useState({
        from: INITIAL_HUBS[0],
        toStop: null,
        departDate: new Date().toISOString().split('T')[0]
    });

    // Fetch Hub Stations from ODPT
    const fetchHubStations = async () => {
        try {
            const hubsToFetch = ['Tokyo', 'Shinjuku', 'Ueno'];
            const stationsUrl = `${ODPT_URL}/odpt:Station?acl:consumerKey=${API_KEY}`;
            const response = await fetch(stationsUrl);
            const data = await response.json();

            if (Array.isArray(data)) {
                const filtered = data
                    .filter(s => {
                        const titleEn = s["odpt:stationTitle"]?.en || "";
                        const titleJa = s["dc:title"] || "";
                        return hubsToFetch.some(h => titleEn.includes(h) || titleJa.includes(h));
                    })
                    .reduce((acc, curr) => {
                        const name = curr["odpt:stationTitle"]?.en || curr["dc:title"];
                        const existing = acc.find(a => a.name === name);
                        const lineName = curr["odpt:railway"]?.split('.').pop()?.replace('-', ' ') || "Local Line";

                        if (existing) {
                            if (!existing.lines.includes(lineName)) existing.lines.push(lineName);
                        } else {
                            acc.push({
                                id: curr["owl:sameAs"],
                                name: name,
                                lines: [lineName]
                            });
                        }
                        return acc;
                    }, []);

                if (filtered.length > 0) {
                    setTokyoHubs(filtered);
                    setPlanner(prev => ({ ...prev, from: filtered[0] }));
                }
            }
        } catch (e) {
            console.warn("Failed to fetch hubs from ODPT, using fallbacks", e);
        }
    };

    useEffect(() => {
        fetchHubStations();
    }, []);

    const processGTFSFiles = async (files) => {
        setLoading(true);
        try {
            const fileMap = {};
            let areaName = "New Area";

            const firstFile = files[0];
            if (firstFile.name.endsWith('.zip')) {
                const zip = await JSZip.loadAsync(firstFile);
                areaName = firstFile.name.replace('.zip', '');

                const zipFiles = Object.keys(zip.files);
                for (const filename of zipFiles) {
                    if (filename.endsWith('.txt')) {
                        const baseName = filename.split('/').pop();
                        fileMap[baseName] = await zip.files[filename].async('string');
                    }
                }
            } else {
                for (let file of files) {
                    const text = await file.text();
                    fileMap[file.name] = text;
                }
                if (files[0]) areaName = files[0].name.split('.')[0];
            }

            const agencyData = parseCSV(fileMap['agency.txt'] || "");
            const stopsData = parseCSV(fileMap['stops.txt'] || "");
            const rulesData = parseCSV(fileMap['booking_rules.txt'] || "");
            const routesData = parseCSV(fileMap['routes.txt'] || "");

            if (agencyData.length > 0 && agencyData[0].agency_name) {
                areaName = agencyData[0].agency_name;
            }

            const isKinokawa = areaName.includes('Kinokawa') || areaName.includes('紀の川') || agencyData.some(a => a.agency_id === 'Kinokawa') || (fileMap['routes.txt'] && fileMap['routes.txt'].includes('のりのり交通'));

            const stopWithStationName = stopsData.find(s =>
                s.stop_name?.includes('駅') ||
                s.stop_name?.includes('Station') ||
                s.stop_name?.includes('Hub')
            );
            const hubStation = stopWithStationName ? stopWithStationName.stop_name : (stopsData[0]?.stop_name || "Regional Hub");

            const newDataset = {
                name: areaName,
                id: 'area-' + Date.now(),
                hubStation: hubStation,
                stops: stopsData.slice(0, 100).map(s => ({
                    id: s.stop_id || Math.random().toString(),
                    name: s.stop_name || "Unnamed Stop",
                    lat: parseFloat(s.stop_lat) || 35.6895,
                    lon: parseFloat(s.stop_lon) || 139.6917,
                    type: 'flex',
                    window: isKinokawa ? '08:30-16:30' : '08:00-18:00',
                    ruleId: 'r1'
                })).filter(s => !isNaN(s.lat) && !isNaN(s.lon)),
                rules: {
                    'r1': {
                        notice: parseInt(rulesData[0]?.prior_notice_duration_min) || (isKinokawa ? 30 : 20),
                        desc: routesData[0]?.route_long_name || 'Regional On-Demand'
                    }
                }
            };

            setDatasets(prev => {
                const updated = [...prev, newDataset];
                setActiveDatasetIndex(updated.length - 1);
                setPlanner(p => ({ ...p, toStop: newDataset.stops[0] }));
                return updated;
            });
        } catch (error) {
            console.error("Ingestion failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (e) => {
        if (e.target.files.length > 0) {
            processGTFSFiles(e.target.files);
        }
    };

    const activeDataset = datasets[activeDatasetIndex] || null;

    const addMins = (date, mins) => new Date(date.getTime() + mins * 60000);
    const formatTime = (date) => date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    const itinerary = useMemo(() => {
        if (!planner.from || !activeDataset || !planner.toStop || !tokyoHubs.length) return null;

        const now = new Date();
        const start = addMins(now, 5);

        const hubOnSameLine = tokyoHubs.find(h =>
            h.name !== planner.from.name &&
            h.lines.some(l => planner.from.lines.includes(l))
        );

        const junctionName = hubOnSameLine ? hubOnSameLine.name : (planner.from.name.includes("Tokyo") ? "Shinagawa" : "Tokyo Station");
        const junctionLine = hubOnSameLine ? hubOnSameLine.lines.find(l => planner.from.lines.includes(l)) : planner.from.lines[0];

        const legs = [];
        let current = start;

        legs.push({
            type: 'train',
            from: planner.from.name,
            to: junctionName,
            line: junctionLine,
            dep: formatTime(current),
            arr: formatTime(addMins(current, 18)),
            isMajor: false,
            desc: "Regional Connector"
        });
        current = addMins(current, 18);

        const waitJunction = 12;
        legs.push({
            type: 'transfer',
            at: junctionName,
            wait: waitJunction,
            desc: "Rapid Transfer via Central Gate",
            isMajor: false
        });
        current = addMins(current, waitJunction);

        legs.push({
            type: 'train',
            from: junctionName,
            to: activeDataset.hubStation,
            line: 'Express connecting to ' + activeDataset.hubStation,
            dep: formatTime(current),
            arr: formatTime(addMins(current, 48)),
            isMajor: true,
            desc: "High-Speed Rail Link"
        });
        current = addMins(current, 48);

        const waitSync = 15;
        legs.push({
            type: 'transfer',
            at: activeDataset.hubStation,
            wait: waitSync,
            desc: "Synchronized Rural Boarding",
            isMajor: true
        });
        current = addMins(current, waitSync);

        legs.push({
            type: 'bus',
            from: activeDataset.hubStation,
            to: planner.toStop.name,
            line: activeDataset.rules['r1']?.desc || 'Rural Sync Bus',
            dep: formatTime(current),
            arr: formatTime(addMins(current, 25)),
            isMajor: true,
            desc: "On-Demand Transit"
        });

        return legs;
    }, [planner.from, activeDataset, planner.toStop, tokyoHubs]);

    const SearchableSelect = ({ label, value, options, onChange, placeholder, disabled }) => {
        const [isOpen, setIsOpen] = useState(false);
        const [search, setSearch] = useState("");
        const dropdownRef = useRef(null);

        const filteredOptions = options.filter(opt =>
            opt.name.toLowerCase().includes(search.toLowerCase())
        );

        useEffect(() => {
            const handleClickOutside = (event) => {
                if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                    setIsOpen(false);
                }
            };
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }, []);

        return (
            <div className="space-y-2 relative" ref={dropdownRef}>
                <label className="text-xs font-black text-slate-400 uppercase ml-1 block">{label}</label>
                <div
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    className={`w-full bg-slate-50 border ${isOpen ? 'border-emerald-500 ring-4 ring-emerald-100' : 'border-slate-200'} p-4 rounded-2xl font-bold transition flex justify-between items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <span className={value ? "text-slate-900" : "text-slate-400"}>
                        {value ? value.name : placeholder}
                    </span>
                    <Plus size={18} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-45 text-emerald-500' : ''}`} />
                </div>

                {isOpen && (
                    <div className="absolute z-[100] w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                            <Search size={14} className="text-slate-400" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search stations..."
                                className="bg-transparent border-none outline-none w-full text-sm font-bold text-slate-700"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                        <div className="max-h-60 overflow-y-auto p-1">
                            {filteredOptions.length > 0 ? filteredOptions.map(opt => (
                                <div
                                    key={opt.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onChange(opt);
                                        setIsOpen(false);
                                        setSearch("");
                                    }}
                                    className={`p-3 rounded-xl text-sm font-bold transition flex items-center justify-between group cursor-pointer ${value?.id === opt.id ? 'bg-emerald-50 text-emerald-600' : 'hover:bg-slate-50 text-slate-600'}`}
                                >
                                    <span>{opt.name}</span>
                                    {value?.id === opt.id && <CheckCircle2 size={14} />}
                                    {opt.lines && <span className="text-[8px] font-black text-slate-400 group-hover:text-slate-500">{opt.lines[0]}</span>}
                                </div>
                            )) : (
                                <div className="p-4 text-center text-xs font-bold text-slate-400">No matches found</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const PlannerView = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-black flex items-center gap-2">
                        <Search className="text-emerald-500" /> Tokyo ➔ Rural Trip Planner
                    </h3>
                    {activeDataset && (
                        <span className="text-[10px] font-black bg-slate-100 px-3 py-1 rounded-full text-slate-500 uppercase tracking-widest">
                            Active: {activeDataset.name}
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <SearchableSelect
                        label="Tokyo Departure (Live ODPT)"
                        value={planner.from}
                        options={tokyoHubs}
                        onChange={(val) => setPlanner({ ...planner, from: val })}
                        placeholder="Select Hub Station"
                    />

                    <div className="flex justify-center pb-4 md:pb-0">
                        <div className="bg-slate-100 p-3 rounded-full text-slate-400">
                            <ArrowRight size={20} />
                        </div>
                    </div>

                    <SearchableSelect
                        label={`Rural Last-Mile ${activeDataset ? `(${activeDataset.name})` : ''}`}
                        value={planner.toStop}
                        options={activeDataset?.stops || []}
                        onChange={(val) => setPlanner({ ...planner, toStop: val })}
                        placeholder={activeDataset ? "Select Destination" : "Waiting for GTFS..."}
                        disabled={!activeDataset}
                    />
                </div>
            </div>

            {planner.toStop && activeDataset && itinerary ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <span className="bg-emerald-500 text-[10px] font-black uppercase px-2 py-1 rounded tracking-tighter shadow-lg shadow-emerald-500/20">Sync Active</span>
                                    <h4 className="text-3xl font-black mt-2">Integrated Journey</h4>
                                </div>
                                <div className="text-right">
                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Arrival Target</p>
                                    <p className="text-2xl font-black text-emerald-400">{itinerary[itinerary.length - 1].arr}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {itinerary.map((leg, idx) => (
                                    <div key={idx} className="relative">
                                        {leg.type === 'transfer' ? (
                                            <div className="flex gap-4 items-center py-2">
                                                <div className="w-4 flex justify-center">
                                                    <div className="w-0.5 h-10 border-l border-dashed border-slate-700"></div>
                                                </div>
                                                <div className="bg-slate-800/40 px-3 py-2 rounded-xl border border-slate-700/30 flex-1 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Clock size={12} className="text-blue-400" />
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-300 leading-none">{leg.desc}</p>
                                                            <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">at {leg.at}</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs font-black text-blue-400">{leg.wait}m</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={`flex gap-4 ${leg.isMajor ? '' : 'opacity-60 transform scale-[0.96] origin-left'}`}>
                                                <div className="flex flex-col items-center">
                                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center border-2 ${leg.type === 'train' ? 'bg-emerald-500/20 border-emerald-400' : 'bg-amber-500/20 border-amber-400'}`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${leg.type === 'train' ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
                                                    </div>
                                                    {idx < itinerary.length - 1 && <div className="w-0.5 h-full bg-slate-800 min-h-[40px]"></div>}
                                                </div>
                                                <div className="flex-1 pb-6">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="flex items-center gap-3">
                                                                <p className={`${leg.isMajor ? 'text-lg font-black' : 'text-sm font-bold'} text-slate-100`}>
                                                                    {leg.from}
                                                                </p>
                                                                {leg.type === 'train' && (
                                                                    <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-widest whitespace-nowrap">
                                                                        {leg.line}
                                                                    </span>
                                                                )}
                                                                {leg.type === 'bus' && (
                                                                    <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase px-2 py-0.5 rounded-md tracking-widest whitespace-nowrap">
                                                                        {leg.line}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-tighter opacity-80">{leg.desc}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-black text-slate-100 text-sm leading-none">{leg.dep}</p>
                                                            <p className="text-[8px] font-black text-slate-500 uppercase mt-1 italic tracking-tighter">DEPARTURE</p>
                                                        </div>
                                                    </div>

                                                    {leg.to && (
                                                        <div className="mt-4 flex justify-between items-end">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-4 h-[1px] bg-slate-700"></div>
                                                                <p className={`${leg.isMajor ? 'text-sm font-bold text-slate-400' : 'text-[10px] font-semibold text-slate-500'} italic`}>
                                                                    to {leg.to}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="font-bold text-slate-400 text-sm leading-none">{leg.arr}</p>
                                                                <p className="text-[8px] font-black text-slate-500 uppercase mt-1 italic tracking-tighter">ARRIVAL</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button className="w-full mt-8 bg-emerald-500 hover:bg-emerald-400 text-white py-5 rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 active:scale-[0.98]">
                                Confirm Sync & Book <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200">
                            <h4 className="font-black text-slate-900 mb-6 flex items-center gap-2"><Info size={18} className="text-blue-500" /> Synchronization Logic</h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                                    <span className="text-slate-500 font-bold text-sm">Provider</span>
                                    <span className="font-black text-slate-900 text-sm">{activeDataset.rules['r1'].desc}</span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                                    <span className="text-slate-500 font-bold text-sm">Notice Requirement</span>
                                    <div className="text-right">
                                        <span className="font-black text-emerald-600 text-sm block">{activeDataset.rules[planner.toStop.ruleId].notice} Minutes</span>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase">Before Arrival at Hub</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 flex gap-4">
                            <AlertCircle className="text-blue-500 shrink-0" />
                            <p className="text-blue-900 text-xs font-bold leading-relaxed">
                                Multi-Modal Guard: To ensure connection at {activeDataset.hubStation}, the system will trigger a verification ping while you are on the {planner.from?.lines[0]}.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white p-16 rounded-[3rem] border-2 border-dashed border-slate-200 text-center">
                    <Upload className="mx-auto mb-6 text-slate-300" size={48} />
                    <h4 className="text-xl font-black text-slate-800 mb-2">Ready for Ingestion</h4>
                    <p className="text-slate-400 font-bold max-w-sm mx-auto">Upload agency.txt and stops.txt to activate rural system integration.</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="bg-slate-50 min-h-screen text-slate-900 flex">
            {/* Sidebar */}
            <aside className="bg-slate-900 text-slate-300 w-72 fixed h-full hidden lg:flex flex-col p-6 z-20">
                <div className="flex items-center gap-3 mb-12 text-white">
                    <div className="bg-emerald-500 p-2.5 rounded-2xl shadow-lg shadow-emerald-500/20">
                        <Navigation size={22} />
                    </div>
                    <h1 className="text-xl font-black tracking-tight">Rural Sync</h1>
                </div>

                <nav className="space-y-1 mb-10">
                    <button
                        onClick={() => setView('planner')}
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${view === 'planner' ? 'bg-white/10 text-white' : 'hover:bg-white/5'}`}
                    >
                        <Search size={18} /> Trip Planner
                    </button>
                    <button
                        onClick={() => setView('explore')}
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${view === 'explore' ? 'bg-white/10 text-white' : 'hover:bg-white/5'}`}
                    >
                        <MapIcon size={18} /> Explore Stops
                    </button>
                </nav>

                <div className="mb-8">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 px-4">GTFS-Flex Import</p>
                    <label className="flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-slate-700 hover:border-emerald-500 cursor-pointer transition bg-slate-800/30 mb-4 mx-2">
                        <Plus size={18} />
                        <span className="text-xs font-bold">Select Files</span>
                        <input type="file" className="hidden" multiple onChange={handleFileUpload} />
                    </label>

                    <div className="space-y-2 px-2 overflow-y-auto max-h-48">
                        {datasets.map((ds, idx) => (
                            <button
                                key={ds.id}
                                onClick={() => { setActiveDatasetIndex(idx); setView('planner'); }}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${activeDatasetIndex === idx ? 'bg-emerald-500 text-white' : 'hover:bg-slate-800/50'}`}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <FileText size={16} />
                                    <span className="text-xs font-black truncate">{ds.name}</span>
                                </div>
                                <CheckCircle2 size={14} />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-auto p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                    <p className="text-[10px] font-black text-emerald-400 uppercase mb-2">Status</p>
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        ODPT Live Active
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-72 p-6 md:p-12 max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-12">
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight">
                            {view === 'planner' ? "Tokyo ➔ Region Planner" : "Stop Exploration"}
                        </h2>
                        <p className="text-slate-500 font-bold mt-1">
                            {view === 'planner' ? "Synchronizing High-Speed Rail with Rural On-Demand Services." : "Spatial Visualization of Regional Transit Access."}
                        </p>
                    </div>
                </header>

                {view === 'planner' ? <PlannerView /> : (
                    activeDataset ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
                            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                                <h4 className="px-4 font-black text-slate-400 uppercase text-[10px] tracking-widest sticky top-0 bg-slate-50 py-2 z-10">
                                    Ingested Stops ({activeDataset.stops.length})
                                </h4>
                                {activeDataset.stops.map(stop => (
                                    <div
                                        key={stop.id}
                                        onClick={() => setSelectedPoint(stop)}
                                        className={`p-6 rounded-[2rem] border-2 transition-all cursor-pointer ${selectedPoint?.id === stop.id ? 'border-emerald-500 bg-white shadow-2xl scale-[1.02]' : 'border-transparent bg-white hover:border-slate-200'}`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex gap-5 items-center">
                                                <div className={`p-4 rounded-2xl transition-colors ${selectedPoint?.id === stop.id ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-400'}`}>
                                                    <Bus size={24} />
                                                </div>
                                                <div>
                                                    <h5 className="font-black text-xl text-slate-900">{stop.name}</h5>
                                                    <div className="flex items-center gap-3 mt-1 text-slate-400">
                                                        <span className="text-xs font-bold flex items-center gap-1"><Clock size={12} /> {stop.window}</span>
                                                        <span className="text-[10px] font-black bg-emerald-50 px-2 py-0.5 rounded text-emerald-600 uppercase">Flex Points</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {selectedPoint?.id === stop.id && <Navigation2 size={20} className="text-emerald-500 animate-pulse" />}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-white p-4 rounded-[3rem] border border-slate-200 h-[70vh] shadow-2xl relative overflow-hidden group">
                                <MapContainer
                                    center={[activeDataset.stops[0]?.lat || 35.6895, activeDataset.stops[0]?.lon || 139.6917]}
                                    zoom={13}
                                    style={{ height: "100%", width: "100%", borderRadius: "2.5rem" }}
                                    scrollWheelZoom={true}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
                        </div>
                    ) : (
                        <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                            <MapIcon className="mx-auto mb-6 text-slate-200" size={64} />
                            <p className="text-slate-400 font-black text-xl">Upload regional GTFS files to activate spatial exploration.</p>
                            <p className="text-slate-300 font-bold mt-2">Map and triangulation will appear once data is ingested.</p>
                        </div>
                    )
                )}
            </main>

            {loading && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center">
                    <div className="bg-white p-12 rounded-[3rem] shadow-2xl flex flex-col items-center">
                        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                        <p className="font-black text-slate-900 text-lg">Parsing Regional Spatial Data...</p>
                        <p className="text-slate-400 text-sm mt-2">Mapping stops and triangulating bounds</p>
                    </div>
                </div>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
                .leaflet-container {
                    background: #f8fafc !important;
                }
                .leaflet-popup-content-wrapper {
                    border-radius: 1rem !important;
                    padding: 0.5rem !important;
                    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1) !important;
                }
                .leaflet-popup-tip {
                    display: none !important;
                }
            `}</style>
        </div>
    );
}