export function stationLabel(station) {
    if (!station) return "";
    const t = station["odpt:stationTitle"];
    if (t?.en && t?.ja) return `${t.en} / ${t.ja}`;
    return station["dc:title"] ?? station["owl:sameAs"] ?? "";
}

export function railwayLabel(railway) {
    if (!railway) return "";
    const t = railway["odpt:railwayTitle"];
    if (t?.en && t?.ja) return `${t.en} / ${t.ja}`;
    return railway["dc:title"] ?? railway["owl:sameAs"] ?? "";
}
