import React from "react";

export default function ToggleGroup({ items, value, onChange }) {
    return (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {items.map((it) => {
                const active = !!value[it.key];
                return (
                    <button
                        key={it.key}
                        type="button"
                        onClick={() => onChange({ ...value, [it.key]: !active })}
                        className={
                            "flex items-center gap-2 rounded-2xl border px-3 py-3 text-left " +
                            (active ? "border-black/30 bg-black/5" : "border-black/10 bg-white hover:bg-black/3")
                        }
                    >
                        <it.Icon className="h-5 w-5" />
                        <div>
                            <div className="font-medium">{it.title}</div>
                            <div className="text-sm text-black/60">{it.subtitle}</div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
