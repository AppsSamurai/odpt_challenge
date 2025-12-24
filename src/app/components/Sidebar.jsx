import React from 'react';
import {
    Navigation,
    Search,
    Map as MapIcon,
    Activity,
    TrendingUp,
    Plus,
    FileText,
    CheckCircle2,
    BarChart3
} from 'lucide-react';

export default function Sidebar({
    view,
    setView,
    planner,
    liveRouteData,
    activeDataset,
    datasets,
    activeDatasetIndex,
    setActiveDatasetIndex,
    setPlanner,
    setSelectedPoint,
    plannerTimeFilter,
    setPlannerTimeFilter,
    demandStats,
    handleFileUpload
}) {
    return (
        <aside className="bg-slate-900 text-slate-300 w-72 fixed h-full hidden lg:flex flex-col p-6 z-20 overflow-y-auto custom-scrollbar">
            <div className="flex items-center gap-3 mb-10 text-white shrink-0">
                <div className="bg-emerald-500 p-2.5 rounded-2xl shadow-lg shadow-emerald-500/20">
                    <Navigation size={22} />
                </div>
                <h1 className="text-xl font-black tracking-tight">Rural Sync</h1>
            </div>

            <nav className="space-y-1 mb-8 shrink-0">
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
                <div className="pt-2 pb-1 px-4">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Analytics</p>
                </div>
                <button
                    onClick={() => setView('insights')}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${view === 'insights' ? 'bg-white/10 text-white' : 'hover:bg-white/5'}`}
                >
                    <BarChart3 size={18} className="text-amber-400" /> City Planner
                </button>
            </nav>

            <div className="mb-8 px-2 shrink-0">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 px-2">Live Rail Tracker</p>
                <div className="bg-slate-800/40 rounded-2xl border border-white/5 p-4">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-bold text-slate-400">{planner.from?.lines[0] || 'Mainline Rail'}</span>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[9px] font-black text-emerald-500 uppercase">Live</span>
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className={`text-2xl font-black ${liveRouteData.delay > 0 ? 'text-amber-400' : 'text-white'}`}>
                            {liveRouteData.delay > 0 ? `+${liveRouteData.delay}m` : 'On Time'}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Current Delay</span>
                    </div>
                </div>
            </div>

            <div className="mb-8 shrink-0">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 px-4">Regional Dataset</p>
                <label className="flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-slate-700 hover:border-emerald-500 cursor-pointer transition bg-slate-800/30 mb-4 mx-2">
                    <Plus size={18} />
                    <span className="text-xs font-bold">Import GTFS</span>
                    <input type="file" className="hidden" multiple onChange={handleFileUpload} />
                </label>

                <div className="space-y-2 px-2 max-h-64 overflow-y-auto custom-scrollbar">
                    {datasets.map((ds, idx) => (
                        <button
                            key={ds.id}
                            onClick={() => {
                                setActiveDatasetIndex(idx);
                                if (ds.stops && ds.stops.length > 0) {
                                    setPlanner(p => ({ ...p, toStop: ds.stops[0] }));
                                    setSelectedPoint(ds.stops[0]);
                                }
                            }}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${activeDatasetIndex === idx ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'hover:bg-slate-800/50'}`}
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

            {view === 'insights' && activeDataset && (
                <div className="mb-8 px-2 animate-in slide-in-from-bottom-4 duration-500 shrink-0">
                    <div className="mb-6 space-y-2">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Analysis Window</p>
                        <div className="grid grid-cols-2 gap-1 px-1">
                            {[
                                { id: 'all', label: 'Full Month' },
                                { id: 'weekday', label: 'Weekdays' },
                                { id: 'weekend', label: 'Weekends' },
                                { id: 'day', label: 'Peak Day' }
                            ].map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => setPlannerTimeFilter(f.id)}
                                    className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase transition-all ${plannerTimeFilter === f.id ? 'bg-amber-400 text-slate-900 border-transparent shadow-lg shadow-amber-400/20' : 'bg-slate-800/50 text-slate-400 border border-white/5 hover:bg-slate-800'}`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4 px-2 flex items-center gap-2">
                        <TrendingUp size={12} /> Infrastructure Insights
                    </p>
                    <div className="space-y-3">
                        {(() => {
                            const suggestions = [];
                            const flows = demandStats.flows || {};

                            Object.entries(flows).forEach(([pid, targets]) => {
                                Object.entries(targets).forEach(([did, count]) => {
                                    if (count >= 5) {
                                        const fromStop = activeDataset.stops.find(s => s.id === pid);
                                        const toStop = activeDataset.stops.find(s => s.id === did);
                                        if (fromStop && toStop) {
                                            suggestions.push({
                                                type: 'route',
                                                title: 'Permanent Bus Candidate',
                                                desc: `${fromStop.name} ➔ ${toStop.name}`,
                                                intensity: count,
                                                color: 'text-amber-400 bg-amber-400/10 border-amber-400/20'
                                            });
                                        }
                                    }
                                });
                            });

                            const hubUsage = demandStats.usage[activeDataset.stops.find(s => s.name === activeDataset.hubStation)?.id] || 0;
                            if (hubUsage > 10) {
                                suggestions.push({
                                    type: 'hub',
                                    title: 'Hub Capacity Warning',
                                    desc: `Expand waiting area at ${activeDataset.hubStation}`,
                                    intensity: hubUsage,
                                    color: 'text-rose-400 bg-rose-400/10 border-rose-400/20'
                                });
                            }

                            if (suggestions.length === 0) {
                                return <p className="text-[10px] text-slate-500 italic px-2">No patterns in selected window...</p>;
                            }

                            return suggestions.sort((a, b) => b.intensity - a.intensity).slice(0, 3).map((s, i) => (
                                <div key={i} className={`p-3 rounded-xl border ${s.color}`}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[9px] font-black uppercase tracking-tighter">{s.title}</span>
                                        <span className="text-[9px] font-black">{s.intensity} Events</span>
                                    </div>
                                    <p className="text-[10px] font-bold leading-tight">{s.desc}</p>
                                </div>
                            ));
                        })()}
                    </div>
                </div>
            )}

            <div className="mt-auto pt-6 shrink-0">
                <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                    <p className="text-[10px] font-black text-emerald-400 uppercase mb-2">System Status</p>
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        ODPT Live Active
                    </div>
                </div>
            </div>
        </aside>
    );
}
