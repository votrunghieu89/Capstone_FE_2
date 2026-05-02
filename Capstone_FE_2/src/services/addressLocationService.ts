import geocodingService, { type GeocodeResult } from './geocodingService';

export type AddressLocationInput = {
    address: string;
    cityName: string;
};

export type AddressLocationResult = GeocodeResult;

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

const dedupe = (values: string[]) => {
    const seen = new Set<string>();
    return values.filter((v) => {
        const key = v.toLowerCase();
        if (!v || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

const extractDistrictTokens = (address: string): string[] => {
    const normalized = normalizeWhitespace(address);
    const tokens = normalized
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

    const districtLike = tokens.filter((part) => {
        const lower = part.toLowerCase();
        return (
            /\b(quận|quan|q\.?|huyện|huyen|h\.?|thị xã|thi xa|tx\.?|thành phố|thanh pho|tp\.?)\b/i.test(part) ||
            lower.includes('hải châu') ||
            lower.includes('hai chau')
        );
    });

    return dedupe(districtLike);
};

const buildAddressCandidates = (address: string, cityName: string): Array<{ address: string; cityName: string }> => {
    const cleanAddress = normalizeWhitespace(address);
    const cleanCity = normalizeWhitespace(cityName);
    const districtTokens = extractDistrictTokens(cleanAddress);

    const addressNoCity = cleanCity
        ? normalizeWhitespace(
            cleanAddress
                .replace(new RegExp(`,?\\s*${cleanCity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'ig'), '')
                .trim()
        )
        : cleanAddress;

    const addressVariants = dedupe([
        cleanAddress,
        addressNoCity,
        cleanAddress.replace(/^số\s*/i, ''),
        cleanAddress.replace(/^so\s*/i, ''),
        cleanAddress.replace(/\b(phường|phuong|p\.)\s*\d+/gi, '').trim(),
        cleanAddress.replace(/\b(quận|quan|q\.)\s*\d+/gi, '').trim(),
    ]);

    const cityVariants = dedupe([
        cleanCity,
        ...districtTokens,
        cleanCity && districtTokens.length ? `${districtTokens[0]}, ${cleanCity}` : '',
        cleanCity || 'Đà Nẵng',
    ]);

    const candidates: Array<{ address: string; cityName: string }> = [];

    for (const addr of addressVariants) {
        for (const city of cityVariants) {
            candidates.push({ address: addr, cityName: city });
        }
    }

    if (!candidates.length && cleanAddress) {
        candidates.push({ address: cleanAddress, cityName: cleanCity || 'Đà Nẵng' });
    }

    return dedupe(candidates.map((c) => `${c.address}|||${c.cityName}`)).map((x) => {
        const [a, c] = x.split('|||');
        return { address: a, cityName: c };
    });
};

export async function getAddressLocation(
    input: AddressLocationInput
): Promise<AddressLocationResult | null> {
    const address = String(input.address || '').trim();
    const cityName = String(input.cityName || '').trim();

    if (!address && !cityName) {
        return null;
    }

    const candidates = buildAddressCandidates(address, cityName);

    for (const candidate of candidates) {
        const result = await geocodingService.resolveAddressToLocation(candidate.address, candidate.cityName);
        if (result?.lat && result?.lon) {
            return {
                ...result,
                query: result.query || `${candidate.address}, ${candidate.cityName}`,
            };
        }
    }

    return null;
}
