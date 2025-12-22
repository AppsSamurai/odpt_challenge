
const HELLO_URL = "https://api-public.odpt.org/api/v4/gbfs/hellocycling/station_information.json";
const DOCOMO_URL = "https://api-public.odpt.org/api/v4/gbfs/docomo-cycle-tokyo/station_information.json";

export async function fetchBikeStations() {
    try {
        const [helloRes, docomoRes] = await Promise.all([
            fetch(HELLO_URL).then(r => r.json()).catch(e => ({ data: { stations: [] } })),
            fetch(DOCOMO_URL).then(r => r.json()).catch(e => ({ data: { stations: [] } }))
        ]);

        const helloStations = (helloRes.data?.stations || []).map(s => ({
            id: "hello:" + s.station_id,
            name: s.name,
            lat: s.lat,
            lon: s.lon,
            capacity: s.vehicle_capacity || 0,
            provider: "Hello Cycling",
            // Hello often provides rental_uris: { ios, android, web }
            deepLink: s.rental_uris?.web || s.rental_uris?.ios || "https://www.hellocycling.jp/",
        }));

        const docomoStations = (docomoRes.data?.stations || []).map(s => ({
            id: "docomo:" + s.station_id,
            name: s.name,
            lat: s.lat,
            lon: s.lon,
            capacity: s.capacity || 0,
            provider: "Docomo Cycle",
            deepLink: "https://docomo-cycle.jp/",
        }));

        return [...helloStations, ...docomoStations];
    } catch (err) {
        console.error("Bike fetch failed", err);
        return [];
    }
}

// Simple Haversine distance in meters
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

export function getNearbyBikes(centerLat, centerLon, allStations, limit = 5) {
    if (!centerLat || !centerLon || !allStations) return [];

    const withDist = allStations.map(s => ({
        ...s,
        dist: getDistance(centerLat, centerLon, s.lat, s.lon)
    }));

    // Filter slightly far items (e.g. > 2km is hardly last mile walking)
    // But user said "last mile (or more)", so maybe 2km is fine. Let's keep a reasonable radius.
    const nearby = withDist.filter(s => s.dist < 2000);

    nearby.sort((a, b) => a.dist - b.dist);
    return nearby.slice(0, limit);
}
