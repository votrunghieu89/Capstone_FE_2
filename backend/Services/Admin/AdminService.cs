using Capstone_2_BE.Repositories.Admin;
using Capstone_2_BE.Settings;

namespace Capstone_2_BE.Services.Admin
{
    public class AdminService
    {
        private readonly IAdminRepo _repo;

        public AdminService(IAdminRepo repo)
        {
            _repo = repo;
        }

        public async Task<Result<object>> GetUsers()
        {
            var data = await _repo.GetUsers();
            return Result<object>.Success(data);
        }

        public async Task<Result<string>> LockUser(Guid id)
        {
            var result = await _repo.UpdateUserStatus(id, 0);
            return result
                ? Result<string>.Success("Locked", 200)
                : Result<string>.Failure("User not found", 404);
        }

        public async Task<Result<string>> UnlockUser(Guid id)
        {
            var result = await _repo.UpdateUserStatus(id, 1);
            return result
                ? Result<string>.Success("Unlocked", 200)
                : Result<string>.Failure("User not found", 404);
        }

        public async Task<Result<object>> GetUserStats()
        {
            var data = await _repo.GetUserStats();
            return Result<object>.Success(data);
        }

        public async Task<Result<object>> GetOrderStats()
        {
            var data = await _repo.GetOrderStats();
            return Result<object>.Success(data);
        }

        public async Task<Result<object>> GetFeedback()
        {
            var data = await _repo.GetFeedback();
            return Result<object>.Success(data);
        }

        public async Task<Result<string>> DeleteFeedback(Guid id)
        {
            var result = await _repo.DeleteFeedback(id);
            return result
                ? Result<string>.Success("Deleted", 200)
                : Result<string>.Failure("Not found", 404);
        }

        public async Task<Result<object>> GetTechnicians()
        {
            var data = await _repo.GetTechnicians();
            return Result<object>.Success(data);
        }
    }
}