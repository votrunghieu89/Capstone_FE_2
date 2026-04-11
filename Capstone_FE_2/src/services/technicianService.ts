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
    
    // Append all fields to FormData
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // Chuẩn hóa key sang PascalCase để khớp với .NET DTO
        // Lưu ý: Backend yêu cầu tên cực kỳ chính xác 'AvatarURl' cho file ảnh
        let normalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
        
        if (key === 'avatarFile') {
          normalizedKey = 'AvatarURl';
          if (value instanceof File) {
            formData.append(normalizedKey, value);
          }
        } else if (key === 'longitude') {
          normalizedKey = 'Longtitude';
          formData.append(normalizedKey, value.toString());
        } else if (key === 'phoneNumber') {
          normalizedKey = 'PhoneNumber';
          formData.append(normalizedKey, value.toString());
        } else {
          formData.append(normalizedKey, value.toString());
        }
      }
    });

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
