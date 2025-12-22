function isHubStation(station) {
    const cr = station?.["odpt:connectingRailway"];
    const cs = station?.["odpt:connectingStation"];
    const ps = station?.["odpt:passengerSurvey"];
    return (Array.isArray(cr) && cr.length > 0) || (Array.isArray(cs) && cs.length > 0) || (Array.isArray(ps) && ps.length > 0);
}

function stopCountBeforeStation(timetable, stationSameAs) {
    const objs = timetable?.["odpt:trainTimetableObject"];
    if (!Array.isArray(objs) || !stationSameAs) return null;

    let count = 0;
    for (const o of objs) {
        const dep = o["odpt:departureStation"];
        const arr = o["odpt:arrivalStation"];
        if (dep === stationSameAs || arr === stationSameAs) break;
        if (dep) count += 1;
    }
    return count;
}

function weights(profile) {
    return {
        walking: profile.minWalking ? 1.2 : 1.0,
        space: profile.moreSpace ? 1.25 : 1.0,
        stroller: profile.stroller ? 1.15 : 1.0,
        luggage: profile.luggage ? 1.1 : 1.0,
        accessible: profile.accessible ? 1.2 : 1.0,
    };
}

export function scoreTrainOption({ train, timetable, fromStation, toStation, odpt, profile }) {
    const w = weights(profile);
    let score = 60;

    const delay = Number(train?.["odpt:delay"] ?? 0);
    if (delay > 0) score -= Math.min(10, 2 + Math.log2(delay + 1));

    const fromHub = isHubStation(fromStation);
    const toHub = isHubStation(toStation);
    if (fromHub) score -= 5 * w.space;
    if (toHub) score -= 2 * w.walking;

    const railDirSameAs = train?.["odpt:railDirection"];
    const railDir = railDirSameAs ? odpt.railDirBySameAs.get(railDirSameAs) : null;
    const railDirText =
        railDir?.["odpt:railDirectionTitle"]?.en ||
            railDir?.["odpt:railDirectionTitle"]?.ja
            ? `${railDir?.["odpt:railDirectionTitle"]?.en ?? ""} ${railDir?.["odpt:railDirectionTitle"]?.ja ?? ""}`.trim()
            : (railDirSameAs ?? "—");

    const dirLower = String(railDirSameAs ?? "").toLowerCase();
    if (dirLower.includes("outbound")) score += 6 * w.space;
    if (dirLower.includes("inbound")) score -= 4 * w.space;

    const trainType = String(train?.["odpt:trainType"] ?? "").toLowerCase();
    if (trainType.includes("limitedexpress")) score -= 3 * w.luggage;
    if (trainType.includes("express")) score -= 2 * w.luggage;
    if (trainType.includes("local")) score += 2 * w.space;

    const fromSameAs = fromStation?.["owl:sameAs"];
    const prevStops = stopCountBeforeStation(timetable, fromSameAs);
    if (typeof prevStops === "number") {
        score += Math.max(-8, 6 - prevStops * 0.6) * w.space;
    }

    score = Math.max(0, Math.min(100, Math.round(score)));

    let boardingSuggestion = "Middle cars (balanced walking)";
    if (profile.minWalking || profile.accessible || profile.stroller) boardingSuggestion = "Middle cars (less platform walking)";
    if (profile.moreSpace && !toHub) boardingSuggestion = "Rear cars (often slightly calmer)";

    const reasons = [];
    if (delay > 0) reasons.push(`Delay ${delay}s → potential crowd buildup`);
    if (dirLower.includes("outbound")) reasons.push("Outbound direction → often more space");
    if (dirLower.includes("inbound")) reasons.push("Inbound direction → often busier");
    if (fromHub) reasons.push("Boarding at a hub station → more crowd");
    if (typeof prevStops === "number") reasons.push(`${prevStops} prior stops before your station (timetable-based)`);
    if (trainType.includes("express")) reasons.push("Express-type service can be denser / luggage-heavy");

    return {
        score,
        railDirText,
        boardingSuggestion,
        reasons,
    };
}
