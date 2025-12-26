import React from 'react';
import { Phone, Clock, Calendar, CreditCard, Info, ExternalLink, AlertCircle } from 'lucide-react';

export default function RegionalServiceInfo({ additionalInfo }) {
    if (!additionalInfo) return null;

    return (
        <div className="space-y-4">
            {/* Service Name */}
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 rounded-2xl text-white shadow-lg">
                <p className="text-[8px] font-black uppercase tracking-widest opacity-80 mb-1">Service Name</p>
                <h3 className="text-sm font-black leading-tight">{additionalInfo.service_name}</h3>
            </div>

            {/* Operating Hours & Days */}
            <div className="bg-slate-800/40 rounded-2xl border border-white/5 p-4 space-y-3">
                <div className="flex items-start gap-3">
                    <Clock size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Hours</p>
                        <p className="text-xs font-bold text-white leading-tight">{additionalInfo.operating_hours}</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <Calendar size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Days</p>
                        <p className="text-xs font-bold text-white leading-tight">{additionalInfo.operating_days}</p>
                    </div>
                </div>
            </div>

            {/* Reservation */}
            {additionalInfo.telephone_number_for_reservation && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                        <Phone size={14} className="text-blue-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Reservation</p>
                            <p className="text-xs font-black text-white">{additionalInfo.telephone_number_for_reservation}</p>
                            {additionalInfo.reservation_window && (
                                <p className="text-[10px] text-blue-300 mt-1 leading-tight">{additionalInfo.reservation_window}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Usage Fee */}
            {additionalInfo.usage_fee && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                        <CreditCard size={14} className="text-amber-400 mt-0.5 shrink-0" />
                        <div className="flex-1">
                            <p className="text-[8px] font-black text-amber-400 uppercase tracking-widest mb-2">Fares</p>
                            {additionalInfo.usage_fee.standard_fare && (
                                <div className="space-y-1">
                                    {Object.entries(additionalInfo.usage_fee.standard_fare).map(([key, value]) => (
                                        <div key={key} className="flex justify-between items-center">
                                            <span className="text-[10px] text-slate-400 capitalize">{key.replace(/_/g, ' ')}</span>
                                            <span className="text-xs font-black text-white">¥ {value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Important Notes */}
            {additionalInfo.important_notes && additionalInfo.important_notes.length > 0 && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle size={14} className="text-rose-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest mb-2">Important</p>
                            <ul className="space-y-1">
                                {additionalInfo.important_notes.slice(0, 3).map((note, idx) => (
                                    <li key={idx} className="text-[10px] text-slate-300 leading-tight">• {note}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* More Info Link */}
            {additionalInfo.additional_info_page && (
                <a
                    href={additionalInfo.additional_info_page}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-xs font-bold text-slate-400 hover:text-emerald-400"
                >
                    <Info size={12} />
                    View Full Details
                    <ExternalLink size={10} />
                </a>
            )}
        </div>
    );
}
