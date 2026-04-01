using Capstone_2_BE.DTOs.City;
using Capstone_2_BE.Models;
using Capstone_2_BE.Repositories.Administrator;
namespace Capstone_2_BE.Services
{
    public class CityService
    {
        private readonly ICityRepo _cityRepo;
        private readonly ILogger<CityService> _logger;

        public CityService(ICityRepo cityRepo, ILogger<CityService> logger)
        {
            _cityRepo = cityRepo;
            _logger = logger;
        }

        public async Task<Result<string>> CreateCity(CreateCityDTO createCityDTO)
        {
            try
            {
                var ok = await _cityRepo.CreateCity(createCityDTO.CityName);
                if (ok) return Result<string>.Success("Tạo thành phố thành công", 201);
                return Result<string>.Failure("Tạo thành phố thất bại", 400);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating city {CityName}", createCityDTO.CityName);
                return Result<string>.Failure("Lỗi khi tạo thành phố", 500);
            }
        }

        public async Task<Result<string>> UpdateCity(Guid cityId, CreateCityDTO updateDTO)
        {
            try
            {
                var ok = await _cityRepo.UpdateCity(cityId, updateDTO.CityName);
                if (ok) return Result<string>.Success("Cập nhật thành phố thành công", 200);
                return Result<string>.Failure("Cập nhật thành phố thất bại", 400);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating city {CityId}", cityId);
                return Result<string>.Failure("Lỗi khi cập nhật thành phố", 500);
            }
        }

        public async Task<Result<string>> DeleteCity(Guid cityId)
        {
            try
            {
                var ok = await _cityRepo.DeleteCity(cityId);
                if (ok) return Result<string>.Success("Xóa thành phố thành công", 200);
                return Result<string>.Failure("Xóa thành phố thất bại", 400);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting city {CityId}", cityId);
                return Result<string>.Failure("Lỗi khi xóa thành phố", 500);
            }
        }

        public async Task<Result<List<ViewAllCities>>> ViewAllCities()
        {
            try
            {
                var list = await _cityRepo.ViewAllCities();
                return Result<List<ViewAllCities>>.Success(list, 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting cities");
                return Result<List<ViewAllCities>>.Failure("Lỗi khi lấy danh sách thành phố", 500);
            }
        }
    }
}
