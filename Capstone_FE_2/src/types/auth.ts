// Types for Auth module — matching Capstone_BE_2 LoginResultDTO exactly

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterCustomerData {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
}

export interface RegisterTechnicianData {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  address: string;
  cityId: string;
  latitude: string;
  longitude: string;
}

// Matches BE: Capstone_2_BE.DTOs.Authentication.LoginResultDTO
export interface LoginResultDTO {
  id: string;
  email: string;
  role: string;        // "Customer" | "Technician" | "Admin"
  accessToken: string;
  refressToken: string;
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
}

// FE auth user state (stored in Zustand)
export interface AuthUser {
  id: string;
  email: string;
  role: string;
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
}
