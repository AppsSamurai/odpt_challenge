import { fetchOdpt, uniqBySameAs } from "./odptClient.js";

const TOKYO_OPERATORS = [
    "odpt.Operator:TokyoMetro",
    "odpt.Operator:Toei",
    "odpt.Operator:JR-East",
    "odpt.Operator:Tokyu",
    "odpt.Operator:Keio",
    "odpt.Operator:Odakyu",
    "odpt.Operator:Seibu",
    "odpt.Operator:Keikyu",
    "odpt.Operator:TWR",
    "odpt.Operator:Yurikamome",
    "odpt.Operator:YokohamaMunicipal",
];

// TrainTimetable is huge. Keep to Metro/Toei for a practical live demo.
const TIMETABLE_OPERATORS = [
    "odpt.Operator:TokyoMetro",
    "odpt.Operator:Toei",
];

export async function loadOdptRealtime() {
    // 1) global-ish small datasets
    const [operator, railDirection] = await Promise.all([
        fetchOdpt("odpt:Operator"),
        fetchOdpt("odpt:RailDirection"),
    ]);

    // 2) stations/railways filtered by operator to reduce payload
    const stationChunks = await Promise.all(
        TOKYO_OPERATORS.map((op) => fetchOdpt("odpt:Station", { "odpt:operator": op }))
    );
    const station = uniqBySameAs(stationChunks.flat());

    const railwayChunks = await Promise.all(
        TOKYO_OPERATORS.map((op) => fetchOdpt("odpt:Railway", { "odpt:operator": op }))
    );
    const railway = uniqBySameAs(railwayChunks.flat());

    // 3) realtime trains (live)
    const trainChunks = await Promise.all(
        TOKYO_OPERATORS.map((op) => fetchOdpt("odpt:Train", { "odpt:operator": op }))
    );
    const train = uniqBySameAs(trainChunks.flat());

    // 4) train status text (line status)
    const infoChunks = await Promise.all(
        TOKYO_OPERATORS.map((op) => fetchOdpt("odpt:TrainInformation", { "odpt:operator": op }))
    );
    const trainInformation = uniqBySameAs(infoChunks.flat());

    // 5) timetables (large, but useful for scoring)
    const ttChunks = await Promise.all(
        TIMETABLE_OPERATORS.map((op) => fetchOdpt("odpt:TrainTimetable", { "odpt:operator": op }))
    );
    const trainTimetable = uniqBySameAs(ttChunks.flat());

    const odpt = {
        operator,
        railDirection,
        station,
        railway,
        train,
        trainInformation,
        trainTimetable,
    };

    // lookup maps
    odpt.stationBySameAs = new Map(odpt.station.map((s) => [s["owl:sameAs"], s]));
    odpt.railwayBySameAs = new Map(odpt.railway.map((r) => [r["owl:sameAs"], r]));
    odpt.operatorBySameAs = new Map(odpt.operator.map((o) => [o["owl:sameAs"], o]));
    odpt.railDirBySameAs = new Map(odpt.railDirection.map((d) => [d["owl:sameAs"], d]));

    // timetables lookup by train sameAs reference (tt["odpt:train"])
    odpt.timetableByTrainSameAs = new Map();
    for (const tt of odpt.trainTimetable) {
        const trainSameAs = tt["odpt:train"];
        if (trainSameAs) odpt.timetableByTrainSameAs.set(trainSameAs, tt);
    }

    return odpt;
}
