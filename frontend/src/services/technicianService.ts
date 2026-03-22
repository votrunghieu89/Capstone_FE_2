import api from './api';

export interface TechnicianProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  avatarUrl?: string;
  bio?: string;
  experienceYears: number;
  hourlyRate?: number;
  isAvailable: boolean;
  averageRating: number;
  totalReviews: number;
  totalJobsCompleted: number;
  serviceRadiusKm: number;
  specialties: string[];
  level: string;
  since: string;
}

export interface TechnicianProfileUpdate {
  fullName: string;
  email: string;
  phone?: string;
  bio?: string;
  specialties: string[];
}

const technicianService = {
  getProfile: async (): Promise<TechnicianProfile> => {
    const response = await api.get('/technician/profile');
    return response.data;
  },

  updateProfile: async (data: TechnicianProfileUpdate): Promise<{ message: string }> => {
    const response = await api.put('/technician/profile', data);
    return response.data;
  }
};

export default technicianService;
