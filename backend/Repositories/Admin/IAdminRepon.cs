using Capstone_2_BE.Models;

namespace Capstone_2_BE.Repositories.Admin
{
    public interface IAdminRepo
    {
        Task<List<AccountsModel>> GetUsers();
        Task<bool> UpdateUserStatus(Guid id, int isActive);

        Task<List<object>> GetUserStats();
        Task<List<object>> GetOrderStats();

        Task<List<object>> GetFeedback();
        Task<bool> DeleteFeedback(Guid id);

        Task<List<object>> GetTechnicians();
    }
}