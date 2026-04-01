import api from './api';

export interface CityDTO {
    id: string;
    cityName: string;
}

export interface ServiceDTO {
    id: string;
    serviceName: string;
}

const commonService = {
    /**
     * Get all cities for filtering and address selection
     */
    getCities: async () => {
        const res = await api.get('/admin/cities');
        return res.data;
    },

    /**
     * Get all service categories for filtering and booking
     */
    getServices: async () => {
        const res = await api.get('/service');
        return res.data;
    }
};

export default commonService;
