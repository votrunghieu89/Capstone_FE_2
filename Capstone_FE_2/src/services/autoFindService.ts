import api from './api';

export interface AutoFindRequest {
    customerId: string;
    serviceId: string;
    cityId: string;
    latitude: number;
    longitude: number;
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
    latitude: number;
    longitude: number;
}

const autoFindService = {
    /**
     * Start searching for technicians automatically
     */
    findTechnicians: async (customerId: string, data: AutoFindRequest) => {
        const res = await api.post(`/customer/autofind/find/${customerId}`, data);
        return res.data;
    },

    /**
     * Check if a technician has accepted the auto-find request
     */
    checkAcceptance: async (customerId: string) => {
        const res = await api.get(`/customer/autofind/accept/${customerId}`);
        return res.data;
    },

    /**
     * Finalize and place the order after auto-find success
     */
    placeAutoOrder: async (data: PlaceAutoOrderDTO) => {
        const res = await api.post(`/customer/autofind/place-auto-order`, data);
        return res.data;
    },

    /**
     * Clear the auto-find session/queue
     */
    clearSession: async (customerId: string) => {
        const res = await api.delete(`/customer/autofind/clear/${customerId}`);
        return res.data;
    }
};

export default autoFindService;
