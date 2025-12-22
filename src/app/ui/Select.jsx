import React from "react";

export default function Select({ label, value, onChange, options }) {
    return (
        <label className="block">
            <div className="mb-1 text-sm font-medium">{label}</div>
            <select
                className="w-full rounded-xl border border-black/15 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                <option value="">Select…</option>
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
        </label>
    );
}
