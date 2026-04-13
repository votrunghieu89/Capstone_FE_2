// Types for Technician module — matching Capstone_BE_2 DTOs exactly

// Matches BE: Capstone_2_BE.DTOs.Technician.Profile.TechnicianProfileViewDTO
export interface TechnicianProfileViewDTO {
  id: string;
  email: string;
  fullName: string;
  avatarURL: string;
  phoneNumber: string;
  address: string;
  city?: string;
  averageRating: number;
  totalRating: number;
  totalOrders: number;
  createAt: string;
  description: string;
  experiences: string;
  cityId: string;
  latitude: number;
  longitude: number;
  serviceId: string;
  serviceName?: string;
}

// Matches BE: Capstone_2_BE.DTOs.Technician.Profile.TechnicianProfileUpdateDTO
export interface TechnicianProfileUpdateDTO {
  id: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  description: string;
  experiences: string;
  cityId: string;
  longitude: number;
  serviceId: string;
  avatarFile?: File;
}

// Matches BE: Capstone_2_BE.DTOs.Customer.FindTechnician.ViewAllTechnicianDTO
export interface ViewAllTechnicianDTO {
  technicianId: string;
  serviceId: string;
  technicianName: string;
  serviceName: string;
  avatarUrl?: string;
  orderCount: number;
  ratingCount: number;
  averageRating: number;
}

// Matches BE: Capstone_2_BE.DTOs.Technician.Rating.TechnicianRatingViewDTO
export interface TechnicianRatingViewDTO {
  ratingId: string;
  customerName: string;
  score: number;
  feedback: string;
  createdAt: string;
}

// Matches BE: Capstone_2_BE.DTOs.Technician.Statistic.StatisticItemDTO
export interface StatisticItemDTO {
  label: string;
  value: number;
}

// Matches BE: Capstone_2_BE.DTOs.Technician.Statistic.RatingOverviewDTO
export interface RatingOverviewDTO {
  averageRating: number;
  totalRatings: number;
  distribution: Record<number, number>;
}
