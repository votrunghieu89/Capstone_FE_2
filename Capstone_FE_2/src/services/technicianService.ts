import api from './api';
import type { 
  TechnicianProfileViewDTO, 
  TechnicianProfileUpdateDTO, 
  TechnicianRatingViewDTO, 
  RatingOverviewDTO, 
  StatisticItemDTO
} from '../types/technician';

/**
 * Technician Profile/Rating/Statistic Service
 * Maps to Capstone_BE_2 TechnicianProfileController, TechnicianRatingController, TechnicianStatisticController
 */
const technicianService = {
  // === PROFILE ===
  // GET /api/technician/profile/{technicianId}
  getProfile: async (technicianId: string): Promise<TechnicianProfileViewDTO> => {
    const res = await api.get(`/technician/profile/${technicianId}`);
    return res.data;
  },

  // PUT /api/technician/profile
  // Gửi FormData để hỗ trợ tải tệp (ảnh đại diện)
  updateProfile: async (data: any): Promise<{ message: string }> => {
    const formData = new FormData();
    
    // Ánh xạ chính xác theo TechnicianProfileUpdateDTO của Backend
    if (data.id) formData.append('Id', data.id);
    if (data.fullName) formData.append('FullName', data.fullName);
    if (data.phoneNumber) formData.append('PhoneNumber', data.phoneNumber);
    if (data.address) formData.append('Address', data.address);
    if (data.cityId) formData.append('CityId', data.cityId);
    if (data.serviceId) formData.append('ServiceId', data.serviceId);
    if (data.description) formData.append('Description', data.description);
    if (data.experiences) formData.append('Experiences', data.experiences);
    
    // Tọa độ (đã là string từ FE)
    if (data.latitude) formData.append('Latitude', data.latitude.toString());
    if (data.longitude) formData.append('Longitude', data.longitude.toString());

    // File ảnh (Backend yêu cầu tên field là AvatarURl)
    if (data.avatarFile instanceof File) {
      formData.append('AvatarURl', data.avatarFile);
    }

    const res = await api.put('/technician/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  // === RATING ===
  // GET /api/technician/rating/feedbacks/{technicianId}
  getRatings: async (technicianId: string): Promise<TechnicianRatingViewDTO[]> => {
    const res = await api.get(`/technician/rating/feedbacks/${technicianId}`);
    return res.data;
  },

  // GET /api/technician/rating/overview/{technicianId}
  getRatingOverview: async (technicianId: string): Promise<RatingOverviewDTO> => {
    const res = await api.get(`/technician/rating/overview/${technicianId}`);
    return res.data;
  },

  // === STATISTIC ===
  // GET /api/technician/statistic/{technicianId}/dashboard-summary
  getDashboardSummary: async (technicianId: string): Promise<any> => {
    const res = await api.get(`/technician/statistic/${technicianId}/dashboard-summary`);
    return res.data;
  },
};

export default technicianService;
