import React, { useState } from 'react';
import {
    Navigation,
    Train,
    Bus,
    ChevronDown,
    ChevronRight,
    Info,
    AlertCircle,
    Upload,
    ChevronLeft,
    X,
    ShieldCheck,
    Phone,
    MapPin,
    Clock,

    Car,
    ExternalLink
} from 'lucide-react';
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
    const [showInfoModal, setShowInfoModal] = useState(false);

    // Helper to format JSON keys
    const formatKey = (str) => str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
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
                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Flex Transport Fare</p>
                                    <p className="text-2xl font-black text-emerald-400">
                                        {itinerary.some(l => l.cost) ? `¥ ${itinerary.reduce((sum, leg) => sum + (leg.cost || 0), 0)}` : 'Live Data Pending'}
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
                                        serviceName: activeDataset?.additionalInfo?.service_name,
                                        usageFee: activeDataset?.additionalInfo?.usage_fee,
                                        operatingHours: activeDataset?.additionalInfo?.operating_hours
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
                            <h4 className="font-black text-slate-900 mb-6 flex items-center gap-2"><Car size={20} className="text-emerald-500" /> Flex Transport Information</h4>

                            {activeDataset?.additionalInfo ? (
                                <div className="space-y-4">
                                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                                                    <Clock size={10} /> Operating Hours
                                                </p>
                                                <p className="font-bold text-slate-900 text-sm leading-tight">
                                                    {activeDataset.additionalInfo.operating_hours || '08:00 - 18:00'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                                                    <Phone size={10} /> Reservations
                                                </p>
                                                <div className="space-y-1.5">
                                                    {activeDataset.additionalInfo.reservation_methods ? (
                                                        activeDataset.additionalInfo.reservation_methods.map((method, idx) => (
                                                            <div key={idx} className="text-xs font-bold text-slate-800 leading-tight">
                                                                <span className="block text-[10px] text-slate-500 uppercase font-black">{method.method}</span>
                                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 mt-0.5">
                                                                    {method.allowed_to?.toLowerCase().includes('resident') && (
                                                                        <span className="self-start sm:self-auto text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] border border-amber-100 whitespace-nowrap">Residents Only</span>
                                                                    )}
                                                                    {(method.method === 'Telephone' || method.method.includes('Phone')) ? (
                                                                        <span>{activeDataset.additionalInfo.telephone_number_for_reservation || method.availability}</span>
                                                                    ) : (
                                                                        <span>{method.availability?.includes('24') ? '24/7 Available' : 'Available'}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="font-bold text-slate-800 text-sm leading-tight">
                                                            {activeDataset.additionalInfo.telephone_number_for_reservation || 'Check Website'}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {activeDataset.additionalInfo.reservation_window && (
                                            <div className="mt-4 pt-3 pb-3 px-4 bg-amber-50 rounded-xl border border-amber-200/60 shadow-sm">
                                                <p className="text-amber-800/60 text-[10px] font-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                    <Clock size={10} /> Reservation Window
                                                </p>
                                                <p className="font-black text-amber-900 text-sm leading-snug">
                                                    {activeDataset.additionalInfo.reservation_window}
                                                </p>
                                            </div>
                                        )}
                                        <div className="mt-4 pt-4 border-t border-slate-200/50">
                                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                                                <MapPin size={10} /> Service Area
                                            </p>
                                            <p className="font-bold text-slate-800 text-sm leading-tight">
                                                {activeDataset.additionalInfo.service_name || activeDataset.name}
                                            </p>
                                        </div>
                                        {activeDataset.additionalInfo.additional_info_page && (
                                            <div className="mt-4 pt-4 border-t border-slate-200/50">
                                                <a
                                                    href={activeDataset.additionalInfo.additional_info_page}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-between group"
                                                >
                                                    <div>
                                                        <p className="text-slate-400 text-[8px] font-black uppercase tracking-widest mb-1 flex items-center gap-1">
                                                            <ExternalLink size={8} /> Official Website
                                                        </p>
                                                        <p className="font-bold text-blue-600 text-sm leading-tight underline decoration-blue-200 underline-offset-2 group-hover:text-blue-700 transition-colors">
                                                            Visit Service Page
                                                        </p>
                                                    </div>
                                                    <ChevronRight size={14} className="text-blue-300 group-hover:text-blue-500 transition-colors" />
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => setShowInfoModal(true)}
                                        className="w-full py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Info size={14} /> View Fares & Service Rules
                                    </button>
                                </div>
                            ) : (
                                <div className="p-6 bg-slate-50 rounded-xl text-center">
                                    <p className="text-slate-400 text-xs font-bold">Standard Regional Service</p>
                                </div>
                            )}

                            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 mt-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <ShieldCheck size={64} className="text-amber-500" />
                                </div>
                                <div className="flex justify-between items-center mb-1 relative z-10">
                                    <span className="text-amber-800 font-black text-[10px] uppercase flex items-center gap-1.5">
                                        <ShieldCheck size={12} /> Smart Connection Guard
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[8px] font-bold text-amber-600 uppercase animate-pulse">Active</span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-amber-900/80 font-bold leading-relaxed relative z-10">
                                    We track your train's real-time location. If a delay occurs, your flex transport pickup is automatically held or rescheduled to ensure a smooth connection.
                                </p>
                            </div>
                        </div>

                        <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 flex gap-4">
                            <AlertCircle className="text-emerald-500 shrink-0" />
                            <p className="text-emerald-900 text-xs font-bold leading-relaxed">
                                Multi-Modal Sync: To ensure connection at {activeDataset?.hubStation || 'the regional hub'}, the system verifies availability {activeDataset?.rules?.[planner.toStop.ruleId]?.notice || '30'} mins before arrival.
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

            {/* Info Modal */}
            {showInfoModal && activeDataset?.additionalInfo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300 relative max-h-[85vh] overflow-hidden flex flex-col">
                        <button
                            onClick={() => setShowInfoModal(false)}
                            className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors z-10"
                        >
                            <X size={20} className="text-slate-500" />
                        </button>

                        <div className="mb-6 shrink-0">
                            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                                <Car className="text-emerald-500" /> Service Details
                            </h3>
                            <p className="text-slate-500 text-sm font-bold mt-1">{activeDataset.additionalInfo.service_name}</p>
                        </div>

                        <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-1">
                            {/* Usage Fee Section */}
                            {activeDataset.additionalInfo.usage_fee && (
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                    <h4 className="text-xs font-black uppercase text-emerald-500 tracking-widest mb-3 border-b border-slate-200/50 pb-2">
                                        Flex Transport Fares
                                    </h4>
                                    <div className="space-y-4">
                                        {Object.entries(activeDataset.additionalInfo.usage_fee).map(([category, value]) => (
                                            <div key={category} className="space-y-1">
                                                <p className="text-[10px] font-black uppercase text-slate-400">{formatKey(category)}</p>
                                                {typeof value === 'object' && value !== null ? (
                                                    Object.entries(value).map(([subKey, subValue]) => (
                                                        <div key={subKey} className="flex justify-between items-start pl-2">
                                                            <span className="text-sm font-bold text-slate-600">
                                                                {typeof subKey === 'string' && subKey !== 'note' && isNaN(subKey) ? formatKey(subKey) : ''}
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
                                        Important Notes
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
                                        How to Book
                                    </h4>
                                    <div className="space-y-3">
                                        {activeDataset.additionalInfo.reservation_methods.map((method, idx) => (
                                            <div key={idx} className="text-sm text-slate-700">
                                                <span className="font-black text-blue-900">{method.method}:</span> {method.note || method.availability}
                                            </div>
                                        ))}
                                        {activeDataset.additionalInfo.reservation_window && (
                                            <div className="pt-2 text-xs font-bold text-slate-500 italic border-t border-blue-200/50 mt-2">
                                                Window: {activeDataset.additionalInfo.reservation_window}
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
