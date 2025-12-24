import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, CheckCircle2 } from 'lucide-react';

export default function SearchableSelect({ label, value, options, onChange, placeholder, disabled }) {
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
}
