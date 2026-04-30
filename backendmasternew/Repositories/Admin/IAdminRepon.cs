using Capstone_2_BE.DTOs.Admin;
using Capstone_2_BE.Models;

namespace Capstone_2_BE.Repositories.Admin
{
    public interface IAdminRepo
    {
        Task<List<object>> GetUsers();
        Task<List<object>> GetRequests();
        Task<bool> UpdateUserStatus(Guid id, int isActive);

        // FIX: trả object chuẩn dashboard
        Task<object> GetDashboardStats();

        

        Task<List<object>> GetFeedback();
        Task<bool> DeleteFeedback(Guid id);
        Task<List<object>> GetTechniciansFull();
        Task<List<object>> GetTechnicianReviews(Guid technicianId);
        Task<object> CreateTechnician(CreateTechnicianDto dto);
    }
}