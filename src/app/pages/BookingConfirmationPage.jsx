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
    X,
    AlertCircle,
    Map,
    ExternalLink
} from 'lucide-react';
import { addMins, formatTime } from '../utils';

export default function BookingConfirmationPage({
    bookingDetails,
    onBack
}) {
    const [isConfirmed, setIsConfirmed] = React.useState(false);
    const [editableDate, setEditableDate] = React.useState(bookingDetails?.date || new Date().toISOString().split('T')[0]);

    // Initialize time with "Next Available" logic
    const [editableTime, setEditableTime] = React.useState(() => {
        const depTime = bookingDetails?.departureTime || '';

        try {
            // 1. Calculate Min Safe Time (Now + Notice)
            const noticeMinutes = parseInt(bookingDetails?.noticePeriod || '30', 10);
            const now = new Date();
            // Initial Set: 40 mins from now (Notice + Buffer)
            const minSafe = new Date(now.getTime() + 40 * 60000);

            // 2. Check Operating Hours Start
            if (bookingDetails?.operatingHours) {
                const [startStr] = bookingDetails.operatingHours.split('-').map(s => s.trim());
                const [h, m] = startStr.split(':').map(Number);
                const opStart = new Date(now);
                opStart.setHours(h, m, 0, 0);

                // If minSafe is earlier than operating start (e.g. 7am vs 8am open), sync to open time
                if (minSafe < opStart) {
                    return formatTime(opStart);
                }
            }

            const safeTimeStr = formatTime(minSafe);

            // 3. Compare with provided time
            // Use the initialized date (or today) for comparison
            const targetDateStr = bookingDetails?.date || now.toISOString().split('T')[0];
            const providedDateTime = new Date(`${targetDateStr}T${depTime}`);

            // If provided time is missing or EARLIER than safe time, use safe time
            if (!depTime || isNaN(providedDateTime.getTime()) || providedDateTime < minSafe) {
                return safeTimeStr;
            }

            return depTime;
        } catch (e) {
            console.error("Time calc failed", e);
            return depTime;
        }
    });
    const [showModal, setShowModal] = React.useState(false);

    if (!bookingDetails) return null;

    const { type, from, to, provider, noticePeriod, cost, usageFee, operatingHours, fromCoords, toCoords } = bookingDetails;

    // Parse Operating Hours safely
    const [opStart, opEnd] = (operatingHours || "00:00 - 23:59").split('-').map(s => s.trim());

    // Validation Logic for Strict Notice Policy
    // Validation Logic for Strict Notice Policy
    const noticeMinutes = parseInt(noticePeriod || '30', 10);
    const minSafeTime = new Date(new Date().getTime() + noticeMinutes * 60000);
    const selectedDateTime = new Date(`${editableDate}T${editableTime}`);
    const isStrictTimeValid = selectedDateTime >= minSafeTime;

    // Validation for Operating Hours
    let isWithinOperatingHours = true;
    if (operatingHours) {
        const [h, m] = editableTime.split(':').map(Number);
        const [startH, startM] = opStart.split(':').map(Number);
        const [endH, endM] = opEnd.split(':').map(Number);
        const selectedMins = h * 60 + m;
        const startMins = startH * 60 + startM;
        const endMins = endH * 60 + endM;

        isWithinOperatingHours = selectedMins >= startMins && selectedMins <= endMins;
    }

    const isTimeValid = isStrictTimeValid && isWithinOperatingHours;
    const formattedMinTime = `${minSafeTime.getFullYear()}-${String(minSafeTime.getMonth() + 1).padStart(2, '0')}-${String(minSafeTime.getDate()).padStart(2, '0')} ${formatTime(minSafeTime)}`;



    // Helper to format JSON keys for display
    const formatKey = (str) => str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
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
            <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-3xl rounded-l-md p-6 flex items-center gap-4 animate-in slide-in-from-top-2 duration-500 delay-150 shadow-lg shadow-amber-500/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <AlertCircle size={100} />
                </div>
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md border-2 border-amber-100 shrink-0 relative z-10 animate-[bounce_2s_infinite]">
                    <AlertCircle className="text-amber-500" size={28} />
                </div>
                <div className="relative z-10">
                    <p className="text-amber-600 font-black text-xs uppercase tracking-widest leading-none mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        Action Required
                    </p>
                    <p className="text-amber-900 text-sm font-bold leading-relaxed">
                        Strict Notice Policy: You must book at least <span className="bg-amber-500 text-white px-1.5 py-0.5 rounded text-xs font-black mx-1 inline-block transform -skew-x-6">30 MINS</span> before departure.
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
                                            <a
                                                href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(fromCoords || from)}&destination=${encodeURIComponent(toCoords || to)}&travelmode=transit`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 pt-2 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider group border-t border-slate-700/50 w-full"
                                            >
                                                <Map size={14} /> Compare with Public Transit <ExternalLink size={10} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 bg-slate-800/40 p-6 rounded-3xl border border-white/5">
                                    <div className="flex justify-between items-center group gap-4">
                                        <div className="flex items-center gap-2 text-slate-400 shrink-0">
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
                                                className="bg-slate-800 text-white font-black text-sm px-4 py-2 rounded-xl border border-white/10 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all text-right w-[150px]"
                                            />
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center group gap-4">
                                        <div className="flex items-center gap-2 text-slate-400 shrink-0">
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
                                                className="bg-slate-800 text-emerald-400 font-black text-lg px-4 py-2 rounded-xl border border-white/10 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all text-right w-[140px]"
                                            />
                                        )}
                                    </div>
                                    <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                                        <span className="text-slate-400 text-[10px] font-black uppercase">Service Provider</span>
                                        <span className="font-black text-white text-xs text-right">{bookingDetails.serviceName || provider}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 border-t border-white/10 pt-8 flex justify-end">
                                {!isConfirmed ? (
                                    <div className="flex flex-col items-end gap-3 w-full">
                                        <button
                                            onClick={() => setIsConfirmed(true)}
                                            disabled={!isTimeValid}
                                            className={`w-full md:w-auto px-12 py-5 rounded-3xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 group ${isTimeValid ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/20' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}
                                        >
                                            {isTimeValid ? (
                                                <>
                                                    Confirm & Place Booking <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                                                </>
                                            ) : (
                                                <>
                                                    <AlertCircle size={22} /> Notice Policy Violation
                                                </>
                                            )}
                                        </button>
                                        {!isTimeValid && (
                                            <div className="space-y-2">
                                                {!isStrictTimeValid && (
                                                    <button
                                                        onClick={() => {
                                                            // Set to Now + 40 mins
                                                            const safeBufferTime = new Date(new Date().getTime() + 40 * 60000);
                                                            setEditableTime(formatTime(safeBufferTime));
                                                        }}
                                                        className="text-[10px] font-bold text-rose-500 bg-rose-50 px-3 py-2 rounded-xl border border-rose-100 flex items-center gap-2 animate-in slide-in-from-right-2 hover:bg-rose-100 transition-colors cursor-pointer"
                                                    >
                                                        <Clock size={12} /> Auto-correct
                                                    </button>
                                                )}
                                                {!isWithinOperatingHours && (
                                                    <p className="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-2 rounded-xl border border-amber-100 flex items-center gap-2 animate-in slide-in-from-right-3">
                                                        <AlertCircle size={12} /> Service Closed (Operating Hours: {operatingHours})
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
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
                                <p className="text-slate-400 text-[8px] font-black uppercase tracking-widest mb-1">Flex Transport Fare</p>
                                <p className="font-black text-2xl text-emerald-500 leading-tight">¥ {cost}</p>
                                {usageFee && (
                                    <button
                                        onClick={() => setShowModal(true)}
                                        className="text-[10px] font-bold text-blue-500 hover:text-blue-600 mt-2 flex items-center gap-1 transition-colors"
                                    >
                                        View Ticket Options <ChevronLeft size={10} className="rotate-180" />
                                    </button>
                                )}
                            </div>
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
                                "Please ensure you are at the pickup location 30 minutes before the scheduled time to sync with regional operations."
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Ticket Details Modal */}
            {showModal && usageFee && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300 relative">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                        >
                            <X size={20} className="text-slate-500" />
                        </button>

                        <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
                            <Bus className="text-emerald-500" /> Ticket Options
                        </h3>

                        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            {Object.entries(usageFee).map(([category, value]) => (
                                <div key={category} className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-3 border-b border-slate-200/50 pb-2">
                                        {formatKey(category)}
                                    </h4>
                                    <div className="space-y-2">
                                        {typeof value === 'object' && value !== null ? (
                                            Object.entries(value).map(([subKey, subValue]) => (
                                                <div key={subKey} className="flex justify-between items-start">
                                                    <span className="text-sm font-bold text-slate-600">
                                                        {typeof subKey === 'string' && subKey !== 'note' && isNaN(subKey) ? formatKey(subKey) : ''}
                                                        {subKey === 'note' && <span className="text-amber-600 italic font-normal">{subValue}</span>}
                                                        {Array.isArray(subValue) && (
                                                            <ul className="list-disc list-inside mt-1 space-y-1">
                                                                {subValue.map((item, i) => (
                                                                    <li key={i} className="text-xs text-slate-500">{item}</li>
                                                                ))}
                                                            </ul>
                                                        )}
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
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Standard Regional Rates Apply</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
