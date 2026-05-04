import api from './api';

export interface AutoFindRequest {
    customerId: string;
    serviceId: string;
    cityId: string;
    latitude: string;
    longitude: string;
    description: string;
}

export interface PlaceAutoOrderDTO {
    customerId: string;
    technicianId: string;
    serviceId: string;
    cityId: string;
    title: string;
    description: string;
    address: string;
    latitude: string;
    longitude: string;
    estimatedTime?: number;
    status?: string;
    imageFiles?: File[];
    videoFile?: File;
}

export interface GeocodeResult {
    latitude: string;
    longitude: string;
    displayName: string;
    source?: string;
    method?: string;
    confidence?: number;
    query?: string;
}

const formatDecimalForBackend = (value: number) => {
    if (!Number.isFinite(value)) return '0';
    // Backend đang parse decimal theo culture dùng dấu phẩy
    return value.toString().replace('.', ',');
};

const autoFindService = {
    /**
     * Start searching for technicians automatically
     */
    findTechnicians: async (customerId: string, data: AutoFindRequest) => {
        const payload = {
            latitude: data.latitude,
            longitude: data.longitude,
            cityId: data.cityId,
            serviceId: data.serviceId,
        };
        const res = await api.post(`/customer/autofind/find/${customerId}`, payload);
        return res.data;
    },

    /**
     * Check if a technician has accepted the auto-find request
     */
    checkAcceptance: async (customerId: string) => {
        try {
            const res = await api.get(`/customer/autofind/accept/${customerId}`);
            return res.data;
        } catch (error: any) {
            // Backend returns 400 when queue is empty; treat as no-candidate signal.
            if (error?.response?.status === 400) return null;
            throw error;
        }
    },

    /**
     * Finalize and place the order after auto-find success
     */
    placeAutoOrder: async (data: PlaceAutoOrderDTO) => {
        const formData = new FormData();
        formData.append('CustomerId', data.customerId);
        formData.append('TechnicianId', data.technicianId);
        formData.append('ServiceId', data.serviceId);
        formData.append('CityId', data.cityId);
        formData.append('Title', data.title);
        formData.append('Description', data.description);
        formData.append('Address', data.address);
        formData.append('Latitude', data.latitude.toString());
        formData.append('Longitude', data.longitude.toString());
        if (Number.isFinite(data.estimatedTime)) {
            formData.append('EstimatedTime', String(data.estimatedTime));
        }
        if (data.status) formData.append('Status', data.status);

        if (data.videoFile) formData.append('VideoFile', data.videoFile);
        if (data.imageFiles?.length) {
            data.imageFiles.forEach((img) => formData.append('ImageFiles', img));
        }

        const res = await api.post(`/customer/autofind/place-auto-order`, formData, {
            timeout: 60000,
        });
        return res.data;
    },

    /**
     * Clear the auto-find session/queue
     */
    clearSession: async (customerId: string) => {
        const res = await api.delete(`/customer/autofind/clear/${customerId}`);
        return res.data;
    },

    resolveLocation: async (payload: { address: string; city: string }): Promise<GeocodeResult> => {
        const res = await api.post('/customer/autofind/resolve-location', payload);
        return res.data;
    }
};

export default autoFindService;
