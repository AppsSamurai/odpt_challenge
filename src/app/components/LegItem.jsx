import React from 'react';
import { Clock, Train, Bus, Car } from 'lucide-react';

export default function LegItem({ leg, idx, total, isSub = false, t = (s) => s }) {
    if (leg.type === 'transfer') {
        return (
            <div className="flex gap-4 items-center py-2">
                <div className="w-8 flex justify-center">
                    <div className="w-0.5 h-10 border-l border-dashed border-slate-700"></div>
                </div>
                <div className="bg-slate-800/40 px-3 py-2 rounded-xl border border-slate-700/30 flex-1 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Clock size={12} className="text-blue-400" />
                        <div>
                            <p className="text-[10px] font-bold text-slate-300 leading-none">{t(leg.desc)}</p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">{t('at')} {leg.at}</p>
                        </div>
                    </div>
                    <span className="text-xs font-black text-blue-400">{leg.wait}m</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex gap-4 ${leg.isMajor ? '' : 'opacity-60 transform scale-[0.96] origin-left'}`}>
            <div className="flex flex-col items-center">
                <div className={`${isSub ? 'w-6 h-6' : 'w-8 h-8'} rounded-xl flex items-center justify-center border-2 shadow-lg ${leg.type === 'train' ? 'bg-emerald-500/10 border-emerald-400 text-emerald-400' :
                    leg.type === 'van' ? 'bg-blue-500/10 border-blue-400 text-blue-400' :
                        'bg-amber-500/10 border-amber-400 text-amber-400'
                    }`}>
                    {leg.type === 'train' && <Train size={isSub ? 12 : 16} />}
                    {leg.type === 'bus' && <Bus size={isSub ? 12 : 16} />}
                    {leg.type === 'van' && <Car size={isSub ? 12 : 16} />}
                </div>
                {total && idx < total - 1 && <div className="w-0.5 h-full bg-slate-800 min-h-[40px]"></div>}
            </div>
            <div className="flex-1 pb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3">
                            <p className={`${leg.isMajor ? 'text-lg font-black' : 'text-sm font-bold'} text-slate-100`}>
                                {leg.from}
                            </p>
                            {leg.type === 'train' && (
                                <span className={`bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 ${isSub ? 'text-[8px]' : 'text-[10px]'} font-black uppercase px-2 py-0.5 rounded-md tracking-widest whitespace-nowrap`}>
                                    {t(leg.line)}
                                </span>
                            )}
                            {leg.type === 'bus' && (
                                <span className={`bg-amber-500/10 border border-amber-500/30 text-amber-400 ${isSub ? 'text-[8px]' : 'text-[10px]'} font-black uppercase px-2 py-0.5 rounded-md tracking-widest whitespace-nowrap`}>
                                    {t(leg.line)}
                                </span>
                            )}
                        </div>
                        <p className={`${isSub ? 'text-[8px]' : 'text-[10px]'} text-slate-500 font-bold uppercase mt-1 tracking-tighter opacity-80`}>{t(leg.desc)}</p>
                    </div>
                    <div className="text-right whitespace-nowrap">
                        <p className={`font-black text-slate-100 ${isSub ? 'text-xs' : 'text-sm'} leading-none`}>
                            {leg.dep}
                            {leg.delay > 0 && <span className="ml-1 text-[10px] text-amber-500">+{leg.delay}m</span>}
                        </p>
                        <p className="text-[8px] font-black text-slate-500 uppercase mt-1 italic tracking-tighter">{t('DEPARTURE')}</p>
                        {leg.cost && (
                            <p className="text-[9px] font-black text-emerald-400 mt-2 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">¥ {leg.cost}</p>
                        )}
                    </div>
                </div>

                {leg.to && (
                    <div className="mt-4 flex justify-between items-end">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-[1px] bg-slate-700"></div>
                            <p className={`${leg.isMajor && !isSub ? 'text-sm font-bold text-slate-400' : 'text-[10px] font-semibold text-slate-500'} italic`}>
                                {t('to')} {leg.to}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className={`font-bold text-slate-400 ${isSub ? 'text-xs' : 'text-sm'} leading-none`}>{leg.arr}</p>
                            <p className="text-[8px] font-black text-slate-500 uppercase mt-1 italic tracking-tighter">{t('ARRIVAL')}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
