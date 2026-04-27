import api from "./api";

// Định nghĩa kiểu dữ liệu cho việc tạo mới
export interface CreateTechDTO {
  fullName: string;
  email: string;
  phoneNumber: string;
  description: string;
}

export const adminApi = {
  // ================= STATS =================
  getStats: async () => (await api.get("/admin/stats")).data,

  // ================= USERS =================
  getUsers: async () => (await api.get("/admin/users")).data,

  toggleUserActive: async (id: string, isActive: boolean) => {
    const url = isActive ? `/admin/users/${id}/unlock` : `/admin/users/${id}/lock`;
    return (await api.put(url)).data;
  },

  // ================= TECHNICIANS =================
  getTechniciansFull: async () => (await api.get("/admin/technicians/full")).data,

  getTechnicianReviews: async (id: string) => (await api.get(`/admin/technicians/${id}/reviews`)).data,

  // Hàm tạo mới
  createTechnician: async (data: CreateTechDTO) => (await api.post("/admin/technicians", data)).data,

  // ================= FEEDBACK =================
  getFeedback: async () => (await api.get("/admin/feedback")).data,

  deleteFeedback: async (id: string) => (await api.delete(`/admin/feedback/${id}`)).data,

  // ================= REQUESTS =================
  getRequests: async () => (await api.get("/admin/requests")).data,
};