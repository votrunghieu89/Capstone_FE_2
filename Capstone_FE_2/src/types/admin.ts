// Types for Admin module
// Extracted from lib/api.ts for cleaner separation

export interface AdminStats {
  totalUsers: number
  totalTechnicians: number
  totalRequests: number
  pendingRequests: number
  completedRequests: number
  cancelledRequests: number
  activeTechnicians: number
}

export interface UserItem {
  id: string
  email: string
  fullName: string
  phone: string | null
  role: string
  isActive: boolean
  createdAt: string
}

export interface TechnicianItem {
  id: string
  userId: string
  fullName: string
  email: string
  phone: string | null
  address: string | null
  isAvailable: boolean
  averageRating: number
  totalReviews: number
  totalJobsCompleted: number
  experienceYears: number
  hourlyRate: number | null
  isActive: boolean
  createdAt: string
}

export interface RequestItem {
  id: string
  customerName: string
  customerPhone: string
  title: string
  description: string
  status: string
  urgency: string
  address: string
  createdAt: string
  categoryName: string | null
  aiEstimatedCost: number | null
}

export interface CreateTechnicianData {
  fullName: string
  email: string
  password: string
  phone?: string
  address?: string
  experienceYears: number
  hourlyRate?: number
  bio?: string
}
