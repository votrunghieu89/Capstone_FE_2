// Re-export from new locations for backward compatibility
// Types are now in @/types/admin
// API service is in @/services/adminApi
export { adminApi as api } from '@/services/adminApi';
export type { AdminStats, UserItem, TechnicianItem, RequestItem, CreateTechnicianData } from '@/types/admin';
