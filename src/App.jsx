import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import JSZip from 'jszip';

// Utils & Constants
import { API_KEY, ODPT_URL, INITIAL_HUBS, HUB_MAPPING, parseCSV, addMins, formatTime, localizeData } from './app/utils';
import { getTranslation } from './app/translations';

// Components
import Sidebar from './app/components/Sidebar';

// Pages
import PlannerPage from './app/pages/PlannerPage';
import ExplorePage from './app/pages/ExplorePage';
import DemandAnalysisPage from './app/pages/DemandAnalysisPage';
import BookingConfirmationPage from './app/pages/BookingConfirmationPage';

// Leaflet styles
import 'leaflet/dist/leaflet.css';

function AppContent() {
    const location = useLocation();
    const navigate = useNavigate();
    const view = location.pathname.split('/')[1] || 'planner';
    const setView = (v) => navigate(`/${v}`);
    const [language, setLanguage] = useState('jp');
    const t = (key, params) => getTranslation(language, key, params);

    // --- State Management ---
    const [loading, setLoading] = useState(false);
    const [datasets, setDatasets] = useState([]);
    const [activeDatasetIndex, setActiveDatasetIndex] = useState(0);
    const [planner, setPlanner] = useState({
        from: INITIAL_HUBS[0],
        toStop: null,
        departDate: new Date().toISOString().split('T')[0]
    });
    const [liveRouteData, setLiveRouteData] = useState({
        fares: [],
        schedules: [],
        hubOdptId: null,
        delay: 0,
        resyncing: false
    });
    const [plannerTimeFilter, setPlannerTimeFilter] = useState('all');
    const [selectedPoint, setSelectedPoint] = useState(null);
    const [showIntermediary, setShowIntermediary] = useState(false);
    const [bookingDetails, setBookingDetails] = useState(null);

    const displayDatasets = useMemo(() => {
        return datasets.map(ds => ({
            ...ds,
            additionalInfo: localizeData(ds.additionalInfo, language)
        }));
    }, [datasets, language]);

    const activeDataset = displayDatasets[activeDatasetIndex] || null;

    // --- Data Processing ---
    const processGTFSFiles = async (files, setActive = true, demandFile = null) => {
        setLoading(true);
        try {
            const zip = new JSZip();
            let stopsData = "", rulesData = "", areaName = "Regional GTFS";

            for (const file of files) {
                if (file.name.endsWith('.zip')) {
                    const content = await zip.loadAsync(file);
                    if (content.file('stops.txt')) stopsData = await content.file('stops.txt').async('string');
                    if (content.file('rules.txt')) rulesData = await content.file('rules.txt').async('string');
                    areaName = file.name.replace('.zip', '').split('-')[0];
                } else if (file.name === 'stops.txt') stopsData = await file.text();
                else if (file.name === 'rules.txt') rulesData = await file.text();
            }

            let demandData = [];
            if (demandFile) {
                let demandText = "";
                if (demandFile.name.endsWith('.zip')) {
                    const demandZip = new JSZip();
                    const content = await demandZip.loadAsync(demandFile);
                    const internalFile = Object.keys(content.files).find(f => f.endsWith('.txt') || f.endsWith('.csv'));
                    if (internalFile) {
                        demandText = await content.file(internalFile).async('string');
                    }
                } else {
                    demandText = await demandFile.text();
                }

                if (demandText) {
                    demandData = parseCSV(demandText);
                }
            }

            if (!stopsData) throw new Error("Missing stops.txt");

            const stopsRaw = parseCSV(stopsData);
            const rulesRaw = parseCSV(rulesData);

            const rules = {
                'r1': { desc: 'Standard Rural Sync', notice: '30' }
            };
            rulesRaw.forEach(r => {
                if (r.rule_id) {
                    rules[r.rule_id] = {
                        desc: r.rule_name || 'Generic Service',
                        notice: r.notice_period || "30"
                    };
                }
            });

            const stops = stopsRaw.map(s => ({
                id: s.stop_id,
                name: s.stop_name,
                lat: parseFloat(s.stop_lat),
                lon: parseFloat(s.stop_lon),
                window: s.service_window || "08:00-18:00",
                ruleId: s.rule_id || 'r1'
            }));

            const hubLat = stops.reduce((sum, s) => sum + s.lat, 0) / stops.length;
            const hubLon = stops.reduce((sum, s) => sum + s.lon, 0) / stops.length;
            const hubStation = areaName.charAt(0).toUpperCase() + areaName.slice(1) + " Station";

            // Load additional info JSON if available
            let additionalInfo = null;
            const validDatasets = ['hakuba', 'hakuba2', 'tomioka', 'annaka', 'sakai', 'tamamura', 'showa', 'kawagoe', 'hirakawa', 'kinokawa'];

            if (validDatasets.includes(areaName)) {
                try {
                    const infoModule = await import(`./app/datasource/gtfs-additional-info/${areaName}-gtfs.json`);
                    if (infoModule.default && Object.keys(infoModule.default).length > 0) {
                        additionalInfo = infoModule.default;
                        console.log(`✅ Loaded additional info for ${areaName}`);
                    }
                } catch (e) {
                    console.log(`⚠️ Additional info not available for ${areaName}`);
                }
            }

            const newDataset = {
                name: areaName,
                id: 'area-' + Date.now() + Math.random(),
                hubStation: hubStation,
                hubLat, hubLon,
                stops: stops,
                rules: rules,
                demandData: demandData,
                additionalInfo: additionalInfo
            };

            setDatasets(prev => {
                const updated = [...prev, newDataset];
                if (setActive) {
                    setActiveDatasetIndex(updated.length - 1);
                    if (stops.length > 0) {
                        setPlanner(p => ({ ...p, toStop: stops[0] }));
                        setSelectedPoint(stops[0]);
                    }
                }
                return updated;
            });
            console.log(`Loaded dataset: ${areaName} with ${demandData.length} demand events`);
        } catch (error) {
            console.error("Ingestion failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        const gtfsFiles = files.filter(f => f.name.includes('gtfs') || f.name.endsWith('.zip'));
        const demandFile = files.find(f => f.name.includes('demand'));
        if (gtfsFiles.length > 0) processGTFSFiles(gtfsFiles, true, demandFile);
    };

    // --- Stats Calculations ---
    const demandStats = useMemo(() => {
        if (!activeDataset || !activeDataset.demandData) return { usage: {}, flows: {} };
        const filteredUsage = {};
        const filteredFlows = {};

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        activeDataset.demandData.forEach(d => {
            const dateStr = d.pickup_date;
            if (!dateStr) return;
            const year = parseInt(dateStr.substring(0, 4));
            const month = parseInt(dateStr.substring(4, 6)) - 1;
            const day = parseInt(dateStr.substring(6, 8));
            const date = new Date(year, month, day);
            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            let match = false;
            if (plannerTimeFilter === 'all') match = true;
            else if (plannerTimeFilter === 'weekday' && !isWeekend) match = true;
            else if (plannerTimeFilter === 'weekend' && isWeekend) match = true;
            else if (dayNames.includes(plannerTimeFilter)) {
                if (dayNames[dayOfWeek] === plannerTimeFilter) match = true;
            }
            else if (plannerTimeFilter === 'day') {
                const sampleDate = activeDataset.demandData[0]?.pickup_date;
                if (dateStr === sampleDate) match = true;
            }

            if (match) {
                const pid = d.pickup_stop_id;
                const did = d.drop_off_stop_id;
                if (pid) filteredUsage[pid] = (filteredUsage[pid] || 0) + 1;
                if (did) filteredUsage[did] = (filteredUsage[did] || 0) + 1;
                if (pid && did) {
                    if (!filteredFlows[pid]) filteredFlows[pid] = {};
                    filteredFlows[pid][did] = (filteredFlows[pid][did] || 0) + 1;
                }
            }
        });
        return { usage: filteredUsage, flows: filteredFlows };
    }, [activeDataset?.demandData, plannerTimeFilter]);

    const pointStats = useMemo(() => {
        if (!activeDataset || !activeDataset.demandData || !selectedPoint) return null;
        const hours = Array(24).fill(0);
        let totalAtPoint = 0;
        const [startStr, endStr] = (selectedPoint.window || "08:00-18:00").split('-');
        const startHour = parseInt(startStr.split(':')[0]);
        const endHour = parseInt(endStr.split(':')[0]);

        activeDataset.demandData.forEach(d => {
            const dateStr = d.pickup_date;
            if (!dateStr) return;
            const date = new Date(parseInt(dateStr.substring(0, 4)), parseInt(dateStr.substring(4, 6)) - 1, parseInt(dateStr.substring(6, 8)));
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

            let match = false;
            if (plannerTimeFilter === 'all') match = true;
            else if (plannerTimeFilter === 'weekday' && !isWeekend) match = true;
            else if (plannerTimeFilter === 'weekend' && isWeekend) match = true;
            else if (plannerTimeFilter === 'day' && dateStr === activeDataset.demandData[0]?.pickup_date) match = true;

            if (match && (d.pickup_stop_id === selectedPoint.id || d.drop_off_stop_id === selectedPoint.id)) {
                totalAtPoint++;
                const time = d.pickup_time;
                if (time) {
                    const hour = parseInt(time.split(':')[0]);
                    hours[hour]++;
                }
            }
        });

        const serviceHours = hours.slice(startHour, endHour + 1);
        const maxUsage = Math.max(...serviceHours);
        const peakHour = hours.indexOf(maxUsage, startHour);

        let recommendation = "Current on-demand service level is adequate for this timeframe.";
        if (maxUsage >= 20) {
            recommendation = `High demand detected. A fixed-route bus service is recommended for the ${peakHour}:00 peak window (Peak: ${maxUsage} events).`;
        } else if (totalAtPoint >= 100) {
            recommendation = `Strong cumulative demand (${totalAtPoint} events). Consider a permanent loop service for this location.`;
        }
        return { hours, serviceHours, startHour, endHour, peakHour, maxUsage, totalAtPoint, recommendation };
    }, [activeDataset?.demandData, selectedPoint, plannerTimeFilter]);

    // --- Effects ---
    // Redirect to planner if active dataset changes while on confirmation page
    useEffect(() => {
        if (location.pathname === '/confirmation') {
            navigate('/planner');
        }
    }, [activeDatasetIndex]);

    useEffect(() => {
        const loadInitialData = async () => {
            console.log("Starting initial data load...");
            const datasetsToLoad = [
                { gtfs: 'tamamura-gtfs.zip', demand: 'tamamura-demand.zip' },
                { gtfs: 'annaka-gtfs.zip', demand: 'annaka-demand.zip' },
                { gtfs: 'hakuba-gtfs.zip', demand: 'hakuba-demand.zip' },
                { gtfs: 'hakuba2-gtfs.zip', demand: 'hakuba2-demand.zip' },
                { gtfs: 'hirakawa-gtfs.zip', demand: 'hirakawa-demand.zip' },
                { gtfs: 'kawagoe-gtfs.zip', demand: 'kawagoe-demand.zip' },
                { gtfs: 'kinokawa-gtfs.zip', demand: 'kinokawa-demand.zip' },
                { gtfs: 'sakai-gtfs.zip', demand: 'sakai-demand.zip' },
                { gtfs: 'showa-gtfs.zip', demand: 'showa-demand.zip' },
                { gtfs: 'tomioka-gtfs.zip', demand: 'tomioka-demand.zip' }
            ];

            for (let i = 0; i < datasetsToLoad.length; i++) {
                const item = datasetsToLoad[i];
                try {
                    console.log(`Fetching: ${item.gtfs}`);
                    const gtfsUrl = new URL(`./app/datasource/gtfs-flex/${item.gtfs}`, import.meta.url).href;
                    const demandUrl = new URL(`./app/datasource/gtfs-flex-usage/${item.demand}`, import.meta.url).href;

                    const [gtfsRes, demandRes] = await Promise.all([
                        fetch(gtfsUrl),
                        fetch(demandUrl)
                    ]);

                    if (!gtfsRes.ok || !demandRes.ok) throw new Error("Fetch failed");

                    const [gtfsBlob, demandBlob] = await Promise.all([
                        gtfsRes.blob(),
                        demandRes.blob()
                    ]);

                    const gtfsFile = new File([gtfsBlob], item.gtfs);
                    const demandFile = new File([demandBlob], item.demand);

                    await processGTFSFiles([gtfsFile], i === 0, demandFile);
                    console.log(`Loaded: ${item.gtfs}`);
                } catch (e) {
                    console.error(`Failed to load ${item.gtfs}`, e);
                }
            }
        };

        if (datasets.length === 0) {
            loadInitialData();
        }
    }, []);

    useEffect(() => {
        let pollInterval;
        const fetchLiveTrainData = async () => {
            if (!planner.from?.id || !activeDataset) return;

            // Map regional area to a real ODPT station for the hub
            const mappedHubName = HUB_MAPPING[activeDataset.name] || activeDataset.hubStation.replace(' Station', '');
            console.log(`Syncing live data for hub: ${mappedHubName} (Region: ${activeDataset.name})`);

            try {
                const hubRes = await fetch(`${ODPT_URL}/odpt:Station?acl:consumerKey=${API_KEY}&dc:title=${encodeURIComponent(mappedHubName)}`);
                const hubData = await hubRes.json();

                // Find the best match station ID
                const odptHubId = hubData.find(s => s["owl:sameAs"])?.["owl:sameAs"];

                if (!odptHubId) {
                    console.warn(`No ODPT Station ID found for hub: ${mappedHubName}`);
                    return;
                }

                console.log(`Found Hub ID: ${odptHubId}. Fetching fares and schedules...`);

                const [fareRes, ttRes] = await Promise.all([
                    fetch(`${ODPT_URL}/odpt:RailwayFare?acl:consumerKey=${API_KEY}&odpt:fromStation=${planner.from.id}&odpt:toStation=${odptHubId}`),
                    fetch(`${ODPT_URL}/odpt:StationTimetable?acl:consumerKey=${API_KEY}&odpt:station=${planner.from.id}`)
                ]);

                const fares = await fareRes.json();
                const timetables = await ttRes.json();

                const segments = planner.from.id.split(':');
                const railwayPrefix = (segments.length > 1) ? segments[1].split('.')[0] : 'JR-East';
                const trainsRes = await fetch(`${ODPT_URL}/odpt:Train?acl:consumerKey=${API_KEY}&odpt:railway=odpt.Railway:${railwayPrefix}`);
                const trains = await trainsRes.json();

                let detectedDelay = 0;
                if (Array.isArray(trains)) {
                    const delayedTrain = trains.find(t => (t["odpt:delay"] || 0) > 0);
                    if (delayedTrain) detectedDelay = Math.floor(delayedTrain["odpt:delay"] / 60);
                }

                // Demo delay for Tokyo departures to show sync logic
                if (planner.from.name.includes('Tokyo') && detectedDelay === 0) detectedDelay = 3;

                setLiveRouteData(prev => ({
                    fares, schedules: timetables, hubOdptId: odptHubId, delay: detectedDelay,
                    resyncing: detectedDelay > 0 && detectedDelay !== prev.delay
                }));

                if (detectedDelay > 0) setTimeout(() => setLiveRouteData(prev => ({ ...prev, resyncing: false })), 5000);
            } catch (err) {
                console.error("Live sync failed", err);
            }
        };

        // Reset live data when area or origin changes to avoid showing stale data
        setLiveRouteData({ fares: [], schedules: [], hubOdptId: null, delay: 0, resyncing: false });

        fetchLiveTrainData();
        pollInterval = setInterval(fetchLiveTrainData, 30000);
        return () => clearInterval(pollInterval);
    }, [planner.from, activeDataset]);

    const itinerary = useMemo(() => {
        if (!activeDataset || !planner.toStop) return null;

        const now = new Date();
        const delayMins = liveRouteData.delay || 0;

        // 1. Pickup the "Correct" start time from the live timetable if available
        let departureTime = addMins(now, 10); // Default 10 mins from now
        if (liveRouteData.schedules && liveRouteData.schedules.length > 0) {
            const table = liveRouteData.schedules[0]["odpt:stationTimetableObject"];
            if (table) {
                const currentHour = now.getHours();
                const currentMin = now.getMinutes();
                const nextTrain = table.find(t => {
                    const [h, m] = t["odpt:departureTime"].split(':').map(Number);
                    return h > currentHour || (h === currentHour && m > currentMin + 5);
                });
                if (nextTrain) {
                    const [nh, nm] = nextTrain["odpt:departureTime"].split(':').map(Number);
                    departureTime = new Date(now);
                    departureTime.setHours(nh, nm, 0, 0);
                }
            }
        }

        const legs = [];
        let current = departureTime;

        // 2. Identify if a transit/transfer is needed based on the city
        // High-level heuristic: Shinkansen terminals often need a local transfer to reach the rural "destination train station"
        const needsTransfer = (planner.from.name.includes('Tokyo') && !activeDataset.hubStation.includes('Tokyo')) ||
            (planner.from.name.includes('Shinjuku') && !['Hakuba', 'Kawagoe'].includes(activeDataset.name));

        const transitStation = needsTransfer ? (activeDataset.name === 'tamamura' || activeDataset.name === 'annaka' ? 'Takasaki' : 'Nagano') : null;

        if (needsTransfer && transitStation) {
            // Leg 1: Major Express/Shinkansen to Transit Hub
            legs.push({
                type: 'train', from: planner.from.name, to: transitStation,
                line: planner.from.lines?.[0] || 'Shinkansen', dep: formatTime(current),
                arr: formatTime(addMins(current, 55 + delayMins)), isMajor: true,
                desc: delayMins > 0 ? `Express Delayed (+${delayMins}m)` : "Mainline Express", delay: delayMins
            });
            current = addMins(current, 55 + delayMins);

            // Leg 2: Transit Detail (Local Train to Destination Station)
            legs.push({
                type: 'train', from: transitStation, to: activeDataset.hubStation,
                line: 'Local Line', dep: formatTime(addMins(current, 10)),
                arr: formatTime(addMins(current, 35)), isMajor: false,
                desc: "Regional Connection", delay: 0
            });
            current = addMins(current, 35);
        } else {
            // Direct Trip (Normal)
            legs.push({
                type: 'train', from: planner.from.name, to: activeDataset.hubStation,
                line: planner.from.lines?.[0] || 'Mainline', dep: formatTime(current),
                arr: formatTime(addMins(current, 110 + delayMins)), isMajor: true,
                desc: delayMins > 0 ? `Mainline Delayed (+${delayMins}m)` : "Mainline Service", delay: delayMins
            });
            current = addMins(current, 110 + delayMins);
        }

        // Leg 3: Final Transfer (Sync Point)
        legs.push({
            type: 'transfer', at: activeDataset.hubStation, wait: 15,
            desc: delayMins > 0 ? "Connection Guard: Resyncing" : "Regional Sync Arrival",
            isMajor: false, dep: formatTime(current), arr: formatTime(addMins(current, 15)),
            delay: delayMins
        });
        current = addMins(current, 15);

        // Leg 4: Last Mile On-Demand
        // Calculate dynamic fare if available (Train + Base Van Fare)
        const trainFare = liveRouteData.fares?.[0]?.["odpt:fare"] || 1200;

        // Get van fare from additional info or use default
        const vanFare = activeDataset?.additionalInfo?.usage_fee?.standard_fare?.adult_standard ||
            activeDataset?.additionalInfo?.usage_fee?.standard_fare?.adult ||
            activeDataset?.additionalInfo?.usage_fee?.standard_fare?.general_adult ||
            500;

        // Use ONLY van fare (ignore train cost per user request)
        const displayFare = vanFare;

        legs.push({
            type: 'van', from: activeDataset.hubStation, to: planner.toStop.name,
            line: activeDataset.rules?.['r1']?.desc || 'Rural Sync Bus',
            dep: formatTime(current), arr: formatTime(addMins(current, 25)),
            isMajor: true, desc: "On-Demand Last Mile", cost: displayFare, delay: delayMins
        });

        return legs;
    }, [activeDataset, planner.toStop, liveRouteData, planner.from]);

    return (
        <div className="min-h-screen bg-slate-50 font-['Outfit'] antialiased">
            <Sidebar
                view={view} setView={setView}
                planner={planner} liveRouteData={liveRouteData} activeDataset={activeDataset}
                datasets={displayDatasets} activeDatasetIndex={activeDatasetIndex} setActiveDatasetIndex={setActiveDatasetIndex}
                setPlanner={setPlanner} setSelectedPoint={setSelectedPoint}
                plannerTimeFilter={plannerTimeFilter} setPlannerTimeFilter={setPlannerTimeFilter}
                demandStats={demandStats} handleFileUpload={handleFileUpload}
                language={language} t={t}
            />

            <main className="lg:ml-72 p-8 lg:p-12 min-h-screen relative">
                {/* Language Switcher */}
                <div className="absolute top-6 right-8 z-50">
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="bg-white/90 backdrop-blur-sm border border-slate-200 text-xs font-bold rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                        <option value="jp">🇯🇵 日本語</option>
                        <option value="en">🇺🇸 English</option>
                    </select>
                </div>

                <Routes>
                    <Route path="/planner" element={
                        <PlannerPage
                            activeDataset={activeDataset} planner={planner} itinerary={itinerary}
                            liveRouteData={liveRouteData} setPlanner={setPlanner}
                            showIntermediary={showIntermediary} setShowIntermediary={setShowIntermediary}
                            onBook={(details) => {
                                setBookingDetails(details);
                                navigate('/confirmation');
                            }}
                            language={language} t={t}
                        />
                    } />
                    <Route path="/explore" element={
                        <ExplorePage
                            activeDataset={activeDataset}
                            selectedPoint={selectedPoint} setSelectedPoint={setSelectedPoint}
                            onBook={(details) => {
                                setBookingDetails(details);
                                navigate('/confirmation');
                            }}
                            language={language} t={t}
                        />
                    } />
                    <Route path="/insights" element={
                        <DemandAnalysisPage
                            activeDataset={activeDataset}
                            selectedPoint={selectedPoint} setSelectedPoint={setSelectedPoint}
                            demandStats={demandStats} pointStats={pointStats}
                            plannerTimeFilter={plannerTimeFilter} setPlannerTimeFilter={setPlannerTimeFilter}
                            language={language} t={t}
                        />
                    } />
                    <Route path="/confirmation" element={
                        <BookingConfirmationPage
                            bookingDetails={bookingDetails}
                            onBack={() => navigate(-1)}
                            language={language} t={t}
                        />
                    } />
                    <Route path="*" element={<Navigate to="/planner" replace />} />
                </Routes>
            </main>

            {loading && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center text-white">
                    <div className="bg-white p-12 rounded-[3rem] text-slate-900 flex flex-col items-center">
                        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                        <p className="font-black text-lg">Processing Regional Data...</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}