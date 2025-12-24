import React, { useMemo } from 'react';
import {
    CheckCircle2,
    Clock,
    MapPin,
    Calendar,
    ArrowRight,
    ShieldCheck,
    ChevronLeft,
    Train,
    Bus,
    AlertCircle
} from 'lucide-react';

export default function BookingConfirmationPage({
    bookingDetails,
    onBack
}) {
    const [isConfirmed, setIsConfirmed] = React.useState(false);
    const [editableDate, setEditableDate] = React.useState(bookingDetails?.date || '');
    const [editableTime, setEditableTime] = React.useState(bookingDetails?.departureTime || '');

    if (!bookingDetails) return null;

    const { type, from, to, provider, noticePeriod } = bookingDetails;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                        {isConfirmed ? 'Booking Confirmed' : 'Review Booking'}
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase border shadow-sm animate-in zoom-in duration-500 delay-300 ${isConfirmed ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                            {isConfirmed ? (
                                <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Sync Secured
                                </>
                            ) : (
                                'Pending Verification'
                            )}
                        </span>
                    </h2>
                    <p className="text-slate-500 font-bold mt-1">
                        {isConfirmed ? 'Your regional connection is locked into the live sync engine.' : 'Please verify your regional connection details before finalizing.'}
                    </p>
                </div>
                {!isConfirmed && (
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 font-black text-sm hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <ChevronLeft size={18} /> Modify Trip
                    </button>
                )}
            </header>

            {/* NEW: Prominent Notice Period Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex items-center gap-4 animate-in slide-in-from-top-2 duration-500 delay-150">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-amber-100 shrink-0">
                    <AlertCircle className="text-amber-500" size={24} />
                </div>
                <div>
                    <p className="text-amber-800 font-black text-[10px] uppercase tracking-widest leading-none mb-1">Notice Period Required</p>
                    <p className="text-amber-900 text-sm font-bold">
                        This service requires a <span className="underline decoration-2 underline-offset-2 decoration-amber-500/30">{noticePeriod || '30'} minute</span> lead time. {isConfirmed ? 'Your dispatch is being monitored.' : 'The system will verify availability upon confirmation.'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Panel: Summary Card */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-900 text-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <CheckCircle2 size={120} />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-8">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${type === 'explore' ? 'bg-amber-500' : 'bg-emerald-500'} shadow-lg`}>
                                    {type === 'explore' ? <Bus size={24} /> : <Train size={24} />}
                                </div>
                                <div>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{type === 'explore' ? 'Standalone Van Booking' : 'Integrated Transit Hub Sync'}</p>
                                    <h3 className="text-2xl font-black">Regional Service Pass</h3>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="flex flex-col items-center gap-2 pt-1">
                                            <div className="w-3 h-3 rounded-full border-2 border-emerald-500 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                            <div className="w-0.5 h-12 bg-slate-700 dashed border-l border-slate-500 opacity-20"></div>
                                            <div className="w-3 h-3 rounded-full border-2 border-amber-500"></div>
                                        </div>
                                        <div className="space-y-8">
                                            <div>
                                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-tighter mb-1">Pickup Point</p>
                                                <p className="font-black text-lg leading-tight">{from}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-tighter mb-1">Destination</p>
                                                <p className="font-black text-lg leading-tight">{to}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 bg-slate-800/40 p-6 rounded-3xl border border-white/5">
                                    <div className="flex justify-between items-center group">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Calendar size={14} />
                                            <span className="text-[10px] font-black uppercase">Schedule</span>
                                        </div>
                                        {isConfirmed ? (
                                            <span className="font-black text-white">{editableDate}</span>
                                        ) : (
                                            <input
                                                type="date"
                                                value={editableDate}
                                                onChange={(e) => setEditableDate(e.target.value)}
                                                className="bg-slate-800 text-white font-black text-sm px-3 py-1.5 rounded-xl border border-white/10 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                                            />
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center group">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Clock size={14} />
                                            <span className="text-[10px] font-black uppercase">Ready By</span>
                                        </div>
                                        {isConfirmed ? (
                                            <span className="font-black text-emerald-400 text-lg">{editableTime}</span>
                                        ) : (
                                            <input
                                                type="time"
                                                value={editableTime}
                                                onChange={(e) => setEditableTime(e.target.value)}
                                                className="bg-slate-800 text-emerald-400 font-black text-lg px-3 py-1.5 rounded-xl border border-white/10 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                                            />
                                        )}
                                    </div>
                                    <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                                        <span className="text-slate-400 text-[10px] font-black uppercase">Service Provider</span>
                                        <span className="font-black text-white text-xs text-right">{provider}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 border-t border-white/10 pt-8 flex justify-end">
                                {!isConfirmed ? (
                                    <button
                                        onClick={() => setIsConfirmed(true)}
                                        className="w-full md:w-auto px-12 py-5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-3xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20 active:scale-95 group"
                                    >
                                        Confirm & Place Booking <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                ) : (
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 px-8 py-4 rounded-3xl flex items-center gap-4 animate-in zoom-in duration-500">
                                        <CheckCircle2 className="text-emerald-500" size={32} />
                                        <div>
                                            <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Booking Secured</p>
                                            <p className="text-white text-sm font-bold">Your regional service is confirmed.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-[2rem] p-8 flex gap-6 items-start">
                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center shrink-0 border border-blue-100">
                            <Clock className="text-blue-500" size={24} />
                        </div>
                        <div>
                            <h4 className="font-black text-blue-900 mb-2">Arrival Instruction</h4>
                            <p className="text-blue-800/70 text-sm font-bold leading-relaxed">
                                {type === 'explore'
                                    ? `Please arrive at the starting point by ${editableTime}. Your rural service van will arrive according to the regional GTFS-Flex window. You will receive a ping when the driver is 5 minutes away.`
                                    : `Your rural shuttle is synchronized with your mainline train arrival. Upon arrival at the regional hub hub, navigate to the dedicated regional exit. Your shuttle will be waiting exactly 15 minutes after your train docks.`
                                }
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Context Details */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl">
                        <h4 className="font-black text-slate-900 mb-6 flex items-center gap-2">Ticket Metadata</h4>
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-2xl">
                                <p className="text-slate-400 text-[8px] font-black uppercase tracking-widest mb-1">Reservation ID</p>
                                <p className="font-black text-slate-900 leading-tight">RES-{Math.random().toString(36).substring(7).toUpperCase()}</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl">
                                <p className="text-slate-400 text-[8px] font-black uppercase tracking-widest mb-1">Sync Protocol</p>
                                <p className="font-black text-slate-900 leading-tight">GTFS-Flex Integration v2.4</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl">
                                <p className="text-slate-400 text-[8px] font-black uppercase tracking-widest mb-1">Hub Status</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                    <p className="font-black text-emerald-600 text-xs">Live Monitoring Active</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {!isConfirmed && (
                        <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200">
                            <p className="text-slate-400 font-bold text-xs leading-relaxed italic">
                                "Please ensure you are at the pickup location {noticePeriod || '30'} minutes before the scheduled time to sync with regional operations."
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
