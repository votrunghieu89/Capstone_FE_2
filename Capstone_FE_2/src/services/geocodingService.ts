export interface GeocodeResult {
    lat: string;
    lon: string;
    display_name: string;
    source?: string;
    method?: string;
    confidence?: number;
    query?: string;
    houseNumber?: string | null;
    road?: string | null;
}

function parseVietnameseAddress(address: string) {
    const trimmed = address.trim();
    const match = trimmed.match(/^(?:s[oố]\s*)?(\d+[A-Za-z]?(?:[/\-]\d+[A-Za-z]?)*)\s+(.+)$/i);
    if (match) {
        return {
            houseNumber: match[1],
            houseNumberInt: parseInt(match[1], 10),
            streetName: match[2].trim(),
            fullStreet: `${match[1]} ${match[2].trim()}`,
        };
    }
    return { houseNumber: null, houseNumberInt: NaN, streetName: trimmed, fullStreet: trimmed };
}

function escapeOverpassRegex(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function polylineLength(coords: { lat: number, lon: number }[]) {
    let total = 0;
    for (let i = 1; i < coords.length; i++) {
        total += haversineDistance(coords[i - 1].lat, coords[i - 1].lon, coords[i].lat, coords[i].lon);
    }
    return total;
}

function pointAlongPolyline(coords: { lat: number, lon: number }[], targetDistance: number) {
    let accumulated = 0;
    for (let i = 1; i < coords.length; i++) {
        const segLen = haversineDistance(coords[i - 1].lat, coords[i - 1].lon, coords[i].lat, coords[i].lon);
        if (accumulated + segLen >= targetDistance) {
            const remaining = targetDistance - accumulated;
            const ratio = segLen > 0 ? remaining / segLen : 0;
            return {
                lat: coords[i - 1].lat + ratio * (coords[i].lat - coords[i - 1].lat),
                lon: coords[i - 1].lon + ratio * (coords[i].lon - coords[i - 1].lon),
            };
        }
        accumulated += segLen;
    }
    return coords[coords.length - 1];
}

async function geocodeNominatimStructured(street: string, city: string) {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('street', street);
    if (city) url.searchParams.set('city', city);
    url.searchParams.set('country', 'Vietnam');
    url.searchParams.set('countrycodes', 'vn');
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('limit', '5');
    try {
        const res = await fetch(url.toString(), {
            headers: { Accept: 'application/json', 'Accept-Language': 'vi' },
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.map((r: any) => ({
            lat: parseFloat(r.lat), lon: parseFloat(r.lon),
            display_name: r.display_name,
            hasHouseNumber: !!r.address?.house_number,
            houseNumber: r.address?.house_number || null,
            road: r.address?.road || null,
            source: 'nominatim-structured',
        }));
    } catch { return []; }
}

async function geocodeNominatimFree(query: string) {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('countrycodes', 'vn');
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('limit', '5');
    try {
        const res = await fetch(url.toString(), {
            headers: { Accept: 'application/json', 'Accept-Language': 'vi' },
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.map((r: any) => ({
            lat: parseFloat(r.lat), lon: parseFloat(r.lon),
            display_name: r.display_name,
            hasHouseNumber: !!r.address?.house_number,
            houseNumber: r.address?.house_number || null,
            road: r.address?.road || null,
            source: 'nominatim-free',
        }));
    } catch { return []; }
}

async function geocodePhoton(query: string) {
    try {
        const url = new URL('https://photon.komoot.io/api/');
        url.searchParams.set('q', query);
        url.searchParams.set('limit', '5');
        url.searchParams.set('lang', 'vi');
        url.searchParams.set('lat', '16.0');
        url.searchParams.set('lon', '106.0');
        const res = await fetch(url.toString());
        if (!res.ok) return [];
        const data = await res.json();
        return (data.features || []).map((f: any) => {
            const p = f.properties;
            const parts = [p.housenumber, p.street || p.name, p.district, p.city || p.county, p.state, p.country].filter(Boolean);
            return {
                lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0],
                display_name: parts.join(', '),
                hasHouseNumber: !!p.housenumber,
                houseNumber: p.housenumber || null,
                road: p.street || p.name || null,
                source: 'photon',
            };
        });
    } catch { return []; }
}

async function overpassDeepSearch(streetName: string, targetHouseNumber: string, nearLat: number, nearLon: number) {
    const target = parseInt(targetHouseNumber, 10);
    if (isNaN(target)) return null;

    const escaped = escapeOverpassRegex(streetName);

    const query = `
[out:json][timeout:25];
(
  way["name"~"^(Đường |Duong )?${escaped}$",i](around:5000,${nearLat},${nearLon});
)->.targetStreet;
.targetStreet out geom;
node(w.targetStreet)->.sNodes;
(
  node(around.sNodes:80)["addr:housenumber"];
  way(around.sNodes:80)["addr:housenumber"];
);
out center body;
`;

    try {
        const res = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: `data=${encodeURIComponent(query)}`,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        if (!res.ok) return null;
        const data = await res.json();

        const streetCoords: { lat: number, lon: number }[] = [];
        const houses: { number: number, original: string, lat: number, lon: number }[] = [];

        for (const el of data.elements) {
            if (el.type === 'way' && el.geometry && !el.tags?.['addr:housenumber']) {
                for (const p of el.geometry) {
                    streetCoords.push({ lat: p.lat, lon: p.lon });
                }
            }
            if (el.tags?.['addr:housenumber']) {
                const num = parseInt(el.tags['addr:housenumber'], 10);
                if (isNaN(num)) continue;
                let lat, lon;
                if (el.type === 'node') { lat = el.lat; lon = el.lon; }
                else if (el.center) { lat = el.center.lat; lon = el.center.lon; }
                if (lat && lon) {
                    houses.push({ number: num, original: el.tags['addr:housenumber'], lat, lon });
                }
            }
        }

        houses.sort((a, b) => a.number - b.number);

        const exact = houses.find(h => h.number === target);
        if (exact) {
            return {
                lat: exact.lat, lon: exact.lon,
                method: 'Overpass API (chính xác)', confidence: 1.0,
                detail: `✅ Tìm thấy chính xác số ${exact.original} trong dữ liệu OSM`,
            };
        }

        if (houses.length >= 2) {
            const sameParity = houses.filter(h => h.number % 2 === target % 2);
            const pool = sameParity.length >= 2 ? sameParity : houses;

            let lower = null, upper = null;
            for (const h of pool) {
                if (h.number <= target) lower = h;
                if (h.number >= target && !upper) upper = h;
            }

            if (lower && upper && lower !== upper) {
                const ratio = (target - lower.number) / (upper.number - lower.number);
                return {
                    lat: lower.lat + ratio * (upper.lat - lower.lat),
                    lon: lower.lon + ratio * (upper.lon - lower.lon),
                    method: 'Nội suy từ số nhà lân cận', confidence: 0.8,
                    detail: `📐 Nội suy giữa số ${lower.original} và số ${upper.original}`,
                };
            }

            const nearest = pool.reduce((best, h) =>
                Math.abs(h.number - target) < Math.abs(best.number - target) ? h : best, pool[0]);
            return {
                lat: nearest.lat, lon: nearest.lon,
                method: 'Ngoại suy (số nhà gần nhất)', confidence: 0.6,
                detail: `📍 Gần nhất: số ${nearest.original} (cách ${Math.abs(nearest.number - target)} số)`,
            };
        }

        if (streetCoords.length >= 2) {
            const totalLen = polylineLength(streetCoords);
            const estimatedMax = Math.max(Math.ceil(totalLen / 5), target * 1.5);
            const ratio = Math.min(target / estimatedMax, 0.95);
            const targetDist = ratio * totalLen;
            const point = pointAlongPolyline(streetCoords, targetDist);

            return {
                lat: point.lat, lon: point.lon,
                method: 'Ước tính theo hình dạng đường', confidence: 0.4,
                detail: `📏 Ước tính dựa trên hình dạng đường (dài ${Math.round(totalLen)}m, vị trí ${Math.round(ratio * 100)}%)`,
            };
        }

        return { method: 'no_data' };

    } catch (err) {
        console.error('Overpass error:', err);
        return null;
    }
}

function deduplicateResults(results: any[]) {
    const seen = new Set();
    return results.filter(r => {
        const key = `${r.lat.toFixed(5)},${r.lon.toFixed(5)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

const geocodingService = {
    resolveAddressToLocation: async (addressText: string, cityNameText: string): Promise<GeocodeResult | null> => {
        const address = String(addressText || '').trim();
        const city = String(cityNameText || '').trim();

        if (!address && !city) {
            return null;
        }

        const parsed = parseVietnameseAddress(address);
        const freeQuery = [address, city, 'Vietnam'].filter(Boolean).join(', ');

        try {
            // Phase 1: Nominatim + Photon
            const [structured, photon, free] = await Promise.all([
                geocodeNominatimStructured(parsed.fullStreet, city),
                geocodePhoton(freeQuery),
                geocodeNominatimFree(freeQuery),
            ]);

            const combined = deduplicateResults([...structured, ...photon, ...free]);

            // Exact match in Phase 1
            const exactMatch = parsed.houseNumber
                ? combined.find(r => r.hasHouseNumber && String(r.houseNumber) === String(parsed.houseNumber))
                : null;

            if (exactMatch) {
                return {
                    lat: String(exactMatch.lat),
                    lon: String(exactMatch.lon),
                    display_name: exactMatch.display_name,
                    source: exactMatch.source,
                    method: 'Nominatim/Photon (chính xác)',
                    confidence: 1.0,
                    query: freeQuery,
                    houseNumber: exactMatch.houseNumber,
                    road: exactMatch.road,
                };
            }

            const streetResult = combined[0];
            if (!streetResult) {
                return null;
            }

            // Phase 2: Overpass Deep Search
            if (parsed.houseNumber) {
                const deep = await overpassDeepSearch(
                    parsed.streetName, parsed.houseNumber,
                    streetResult.lat, streetResult.lon
                );

                if (deep && deep.method !== 'no_data') {
                    return {
                        lat: String(deep.lat),
                        lon: String(deep.lon),
                        display_name: `${parsed.houseNumber} ${parsed.streetName}${city ? ', ' + city : ''}`,
                        source: 'overpass',
                        method: deep.method,
                        confidence: deep.confidence,
                        query: freeQuery,
                        houseNumber: parsed.houseNumber,
                        road: parsed.streetName,
                    };
                } else {
                    // Fallback to Phase 1 Street result
                    return {
                        lat: String(streetResult.lat),
                        lon: String(streetResult.lon),
                        display_name: streetResult.display_name,
                        source: streetResult.source,
                        method: 'Chỉ tìm được tuyến đường',
                        confidence: 0.5,
                        query: freeQuery,
                        houseNumber: null,
                        road: streetResult.road || parsed.streetName,
                    };
                }
            } else {
                // Address didn't have house number
                return {
                    lat: String(streetResult.lat),
                    lon: String(streetResult.lon),
                    display_name: streetResult.display_name,
                    source: streetResult.source,
                    method: 'Tìm theo tên đường (không có số nhà)',
                    confidence: 0.8,
                    query: freeQuery,
                    houseNumber: null,
                    road: streetResult.road || parsed.streetName,
                };
            }
        } catch (error) {
            console.error('Geocoding Error:', error);
            return null;
        }
    }
};

export default geocodingService;
