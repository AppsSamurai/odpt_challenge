import React from "react";

export default function Badge({ children }) {
    return (
        <span className="inline-flex items-center rounded-full border border-black/10 bg-black/5 px-2 py-1 text-xs">
            {children}
        </span>
    );
}
