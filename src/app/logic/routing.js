
// Heuristic costs (minutes)
const COST_STATION_ADJ = 2; // neighbor on same line
const COST_TRANSFER = 5;    // transfer between lines

/**
 * Builds a graph from ODPT data.
 * Nodes: station "owl:sameAs" strings.
 * Edges: { target: string, cost: number, type: "travel"|"transfer", railway?: string }
 */
export function buildGraph(odpt) {
    const adj = new Map(); // stationSameAs -> []

    function addEdge(u, v, cost, type, railway) {
        if (!adj.has(u)) adj.set(u, []);
        adj.get(u).push({ target: v, cost, type, railway });
    }

    // 1. Link stations on the same railway (using station codes if available, or just index order)
    // ODPT station list for a railway is usually ordered if fetched by railway, but here we have a flat list.
    // We need to group by railway and sort by station code to find neighbors.

    // Group stations by railway
    const stationsByRail = new Map();
    for (const s of odpt.station) {
        const rail = s["odpt:railway"];
        if (!rail) continue;
        if (!stationsByRail.has(rail)) stationsByRail.set(rail, []);
        stationsByRail.get(rail).push(s);
    }

    // Sort and link
    for (const [rail, stations] of stationsByRail.entries()) {
        // Sort by station code index (e.g. M01, M02) or strictly by title if no code
        // Most ODPT Tokyo Metro stations have odpt:stationCode.
        // We'll rely on the default sort order from the main list if codes are missing or inconsistent,
        // but sorting by code is safer.
        stations.sort((a, b) => {
            const ca = a["odpt:stationCode"];
            const cb = b["odpt:stationCode"];
            if (ca && cb) {
                // extract number "M08" -> 8
                const na = parseInt(ca.replace(/[A-Z]+/, ""), 10);
                const nb = parseInt(cb.replace(/[A-Z]+/, ""), 10);
                return na - nb;
            }
            return 0;
        });

        for (let i = 0; i < stations.length - 1; i++) {
            const u = stations[i]["owl:sameAs"];
            const v = stations[i + 1]["owl:sameAs"];
            addEdge(u, v, COST_STATION_ADJ, "travel", rail);
            addEdge(v, u, COST_STATION_ADJ, "travel", rail);
        }
    }

    // 2. Link transfers via odpt:connectingStation
    for (const s of odpt.station) {
        const u = s["owl:sameAs"];
        const connects = s["odpt:connectingStation"];
        if (Array.isArray(connects)) {
            for (const v of connects) {
                // Ensure target exists in our dataset (we filtered operators)
                if (odpt.stationBySameAs.has(v)) {
                    addEdge(u, v, COST_TRANSFER, "transfer");
                    // The reverse link might be in the other station's connectingStation,
                    // but let's add it explicitly if not present to be safe? 
                    // ODPT usually has bidirectional links in connectingStation, 
                    // but we strictly follow the graph.
                }
            }
        }
    }

    return adj;
}

/**
 * Dijkstra's algorithm to find shortest path.
 * Returns: { stations: string[], legs: { from: string, to: string, railway: string }[] }
 */
export function findRoute(graph, startId, endId, odpt) {
    if (!graph.has(startId) || !graph.has(endId)) return null;

    const dist = new Map();
    const prev = new Map(); // node -> { node, edge }
    const pq = new Map(); // node -> priority (simple implementation)

    dist.set(startId, 0);
    pq.set(startId, 0);

    const visited = new Set();

    while (pq.size > 0) {
        // Find min
        let u = null;
        let minDist = Infinity;
        for (const [node, d] of pq.entries()) {
            if (d < minDist) {
                minDist = d;
                u = node;
            }
        }

        if (u === endId) break;
        pq.delete(u);
        visited.add(u);

        if (minDist === Infinity) break;

        const neighbors = graph.get(u) || [];
        for (const edge of neighbors) {
            const v = edge.target;
            if (visited.has(v)) continue;

            const alt = minDist + edge.cost;
            if (alt < (dist.get(v) ?? Infinity)) {
                dist.set(v, alt);
                prev.set(v, { node: u, ...edge });
                pq.set(v, alt);
            }
        }
    }

    if (!prev.has(endId)) return null;

    // Reconstruct
    const path = [];
    let curr = endId;
    while (curr !== startId) {
        const p = prev.get(curr);
        path.push({ from: p.node, to: curr, type: p.type, railway: p.railway });
        curr = p.node;
    }
    path.reverse();

    return path;
}

/**
 * Group path into legs (travel segments on same railway)
 */
export function segmentizeRoute(path) {
    const legs = [];
    let currentLeg = null;

    for (const step of path) {
        if (step.type === "transfer") {
            // End current leg if exists
            if (currentLeg) {
                legs.push(currentLeg);
                currentLeg = null;
            }
            continue; // Transfers are gaps between legs
        }

        if (!currentLeg) {
            currentLeg = {
                railway: step.railway,
                stations: [step.from, step.to],
            };
        } else if (currentLeg.railway === step.railway) {
            currentLeg.stations.push(step.to);
        } else {
            // Railway changed without explicit transfer step (shouldn't happen with our graph logic but safe fallback)
            legs.push(currentLeg);
            currentLeg = {
                railway: step.railway,
                stations: [step.from, step.to],
            };
        }
    }
    if (currentLeg) legs.push(currentLeg);

    return legs;
}
