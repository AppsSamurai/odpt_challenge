import React, { useState } from 'react';
import { Navigation, Train, Bus, ChevronDown, ChevronRight, Info, AlertCircle, Upload, ChevronLeft } from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';
import LegItem from '../components/LegItem';
import { INITIAL_HUBS } from '../utils';

export default function PlannerPage({
    activeDataset,
    planner,
    itinerary,
    liveRouteData,
    setPlanner,
    showIntermediary,
    setShowIntermediary,
    onBook
}) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-12">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                    Tokyo ➔ Region Planner
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase border border-emerald-100 shadow-sm animate-in fade-in duration-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Live Rail Tracking
                    </span>
                </h2>
                <p className="text-slate-500 font-bold mt-1">
                    Synchronizing High-Speed Rail with Rural On-Demand (Real-time Live Sync enabled).
                </p>
            </header>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-black flex items-center gap-2">
                        <Navigation className="text-emerald-500" /> Multi-Modal Trip Planner
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <SearchableSelect
                        label="Mainland Hub (Origin)"
                        value={planner.from}
                        options={INITIAL_HUBS}
                        onChange={(val) => setPlanner(prev => ({ ...prev, from: val }))}
                        placeholder="Select Origin Hub"
                    />

                    <SearchableSelect
                        label={`Rural Last-Mile ${activeDataset ? `(${activeDataset.additionalInfo?.service_name || activeDataset.name})` : ''}`}
                        value={planner.toStop}
                        options={activeDataset?.stops || []}
                        onChange={(val) => setPlanner(prev => ({ ...prev, toStop: val }))}
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
                                    <div className="flex gap-2 mb-2">
                                        <span className="bg-emerald-500 text-[10px] font-black uppercase px-2 py-1 rounded tracking-tighter shadow-lg shadow-emerald-500/20">Sync Active</span>
                                        {liveRouteData.delay > 0 && (
                                            <span className={`bg-amber-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded tracking-tighter shadow-lg shadow-amber-500/20 ${liveRouteData.resyncing ? 'animate-bounce' : 'animate-pulse'}`}>
                                                {liveRouteData.resyncing ? 'Connection Resyncing...' : 'Delay Guard Active'}
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="text-3xl font-black">Integrated Journey</h4>
                                </div>
                                <div className="text-right">
                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Est. Total Fare</p>
                                    <p className="text-2xl font-black text-emerald-400">
                                        {itinerary.some(l => l.cost) ? `¥${itinerary.reduce((sum, leg) => sum + (leg.cost || 0), 0)}` : 'Live Data Pending'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {(() => {
                                    const firstLeg = itinerary[0];
                                    const intermediaryLegs = itinerary.slice(1, -1).filter(l => !l.isMajor);
                                    const finalLeg = itinerary[itinerary.length - 1];

                                    return (
                                        <>
                                            {/* Primary Departure (Anchor) */}
                                            <LegItem leg={firstLeg} idx={0} total={itinerary.length} />

                                            {/* Middle Intermediaries (Collapsible) */}
                                            {intermediaryLegs.length > 0 && (
                                                <div className="relative">
                                                    <div className="flex gap-4 ml-4">
                                                        <div className="w-0.5 h-full bg-slate-800/20 py-2"></div>
                                                        <button
                                                            onClick={() => setShowIntermediary(!showIntermediary)}
                                                            className="flex-1 flex items-center justify-between p-3 bg-slate-800/10 hover:bg-slate-800/30 rounded-xl border border-slate-700/20 transition-all mb-4 mt-1"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex -space-x-1.5">
                                                                    {intermediaryLegs.filter(l => l.type !== 'transfer').map((l, i) => (
                                                                        <div key={i} className={`w-5 h-5 rounded-md flex items-center justify-center border border-slate-900 shadow-lg ${l.type === 'train' ? 'bg-emerald-500/80 text-white' : 'bg-amber-500/80 text-white'}`}>
                                                                            {l.type === 'train' ? <Train size={10} /> : <Bus size={10} />}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <span className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Transit Details ({intermediaryLegs.length} steps)</span>
                                                            </div>
                                                            <ChevronDown size={14} className={`text-slate-600 transition-transform duration-300 ${showIntermediary ? 'rotate-180' : ''}`} />
                                                        </button>
                                                    </div>

                                                    {showIntermediary && (
                                                        <div className="space-y-4 mb-6 pl-10 border-l border-slate-800/20 animate-in slide-in-from-top-2 duration-300">
                                                            {intermediaryLegs.map((leg, idx) => (
                                                                <LegItem key={idx} leg={leg} isSub={true} />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Primary Destination (Anchor) */}
                                            {finalLeg && finalLeg.isMajor && (
                                                <LegItem leg={finalLeg} idx={itinerary.length - 1} total={itinerary.length} />
                                            )}
                                        </>
                                    );
                                })()}
                            </div>

                            <button
                                onClick={() => {
                                    const vanLeg = itinerary[itinerary.length - 1];
                                    onBook({
                                        type: 'planner',
                                        from: vanLeg.from,
                                        to: vanLeg.to,
                                        date: planner.departDate,
                                        departureTime: vanLeg.dep,
                                        arrivalTime: vanLeg.arr,
                                        noticePeriod: activeDataset?.rules?.[planner.toStop.ruleId]?.notice || '30',
                                        cost: itinerary.reduce((sum, leg) => sum + (leg.cost || 0), 0),
                                        provider: activeDataset?.rules?.['r1']?.desc || 'Rural Sync Provider',
                                        serviceName: activeDataset?.additionalInfo?.service_name
                                    });
                                }}
                                className="w-full mt-8 bg-emerald-500 hover:bg-emerald-400 text-white py-5 rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 active:scale-[0.98]"
                            >
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
                                    <span className="font-black text-slate-900 text-sm">{activeDataset?.rules?.['r1']?.desc || 'Rural Sync Provider'}</span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                                    <span className="text-slate-500 font-bold text-sm">Notice Requirement</span>
                                    <div className="text-right">
                                        <span className="font-black text-emerald-600 text-sm block">{activeDataset?.rules?.[planner.toStop.ruleId]?.notice || '30'} Minutes</span>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase">Before Arrival at Hub</span>
                                    </div>
                                </div>

                                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 mt-4">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-amber-800 font-black text-[10px] uppercase">Real-time Connection Guard</span>
                                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                                    </div>
                                    <p className="text-[10px] text-amber-700 font-bold leading-tight">
                                        Active monitoring of Mainland service via ODPT Live. If delays are detected, last-mile dispatch is automatically shifted to preserve your connection.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 flex gap-4">
                            <AlertCircle className="text-blue-500 shrink-0" />
                            <p className="text-blue-900 text-xs font-bold leading-relaxed">
                                Multi-Modal Guard: To ensure connection at {activeDataset?.hubStation || 'the regional hub'}, the system will trigger a verification ping while you are on the {planner.from?.lines?.[0] || 'mainline service'}.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white p-16 rounded-[3rem] border-2 border-dashed border-slate-200 text-center">
                    <Upload className="mx-auto mb-6 text-slate-300" size={48} />
                    <h4 className="text-xl font-black text-slate-800 mb-2">Ready for Ingest</h4>
                    <p className="text-slate-400 font-bold max-w-sm mx-auto">Upload regional GTFS files to activate synchronization engine.</p>
                </div>
            )}
        </div>
    );
}
