using Capstone_2_BE.DTOs.Technician.Statistic;
using Capstone_2_BE.Repositories.Technician;
using Capstone_2_BE.Settings;
using Microsoft.Extensions.Logging;

namespace Capstone_2_BE.Services.Technician
{
    public class TechnicianStatisticService
    {
        private readonly ITechnicianStatisticRepo _repo;
        private readonly ILogger<TechnicianStatisticService> _logger;

        public TechnicianStatisticService(ITechnicianStatisticRepo repo, ILogger<TechnicianStatisticService> logger)
        {
            _repo = repo;
            _logger = logger;
        }

        public async Task<Result<List<StatisticItemDTO>>> GetCompletedOrdersByWeek(Guid technicianId, DateTime from, DateTime to)
        {
            try { return Result<List<StatisticItemDTO>>.Success(await _repo.GetCompletedOrdersByWeek(technicianId, from, to), 200); }
            catch (Exception ex) { _logger.LogError(ex, "Error"); return Result<List<StatisticItemDTO>>.Failure("Lỗi lấy dữ liệu thống kê", 500); }
        }

        public async Task<Result<List<StatisticItemDTO>>> GetCompletedOrdersByMonth(Guid technicianId, int year)
        {
            try { return Result<List<StatisticItemDTO>>.Success(await _repo.GetCompletedOrdersByMonth(technicianId, year), 200); }
            catch (Exception ex) { _logger.LogError(ex, "Error"); return Result<List<StatisticItemDTO>>.Failure("Lỗi lấy dữ liệu thống kê", 500); }
        }

        public async Task<Result<List<StatisticItemDTO>>> GetReceivedOrdersByWeek(Guid technicianId, DateTime from, DateTime to)
        {
            try { return Result<List<StatisticItemDTO>>.Success(await _repo.GetReceivedOrdersByWeek(technicianId, from, to), 200); }
            catch (Exception ex) { _logger.LogError(ex, "Error"); return Result<List<StatisticItemDTO>>.Failure("Lỗi lấy dữ liệu thống kê", 500); }
        }

        public async Task<Result<List<StatisticItemDTO>>> GetReceivedOrdersByMonth(Guid technicianId, int year)
        {
            try { return Result<List<StatisticItemDTO>>.Success(await _repo.GetReceivedOrdersByMonth(technicianId, year), 200); }
            catch (Exception ex) { _logger.LogError(ex, "Error"); return Result<List<StatisticItemDTO>>.Failure("Lỗi lấy dữ liệu thống kê", 500); }
        }

        public async Task<Result<RatingOverviewDTO>> GetRatingOverview(Guid technicianId)
        {
            try { return Result<RatingOverviewDTO>.Success(await _repo.GetRatingOverview(technicianId), 200); }
            catch (Exception ex) { _logger.LogError(ex, "Error"); return Result<RatingOverviewDTO>.Failure("Lỗi lấy dữ liệu thống kê", 500); }
        }

        public async Task<Result<int>> GetCanceledOrdersTotal(Guid technicianId)
        {
            try { return Result<int>.Success(await _repo.GetCanceledOrdersTotal(technicianId), 200); }
            catch (Exception ex) { _logger.LogError(ex, "Error"); return Result<int>.Failure("Lỗi lấy dữ liệu thống kê", 500); }
        }

        public async Task<Result<List<StatisticItemDTO>>> GetCanceledOrdersByWeek(Guid technicianId, DateTime from, DateTime to)
        {
            try { return Result<List<StatisticItemDTO>>.Success(await _repo.GetCanceledOrdersByWeek(technicianId, from, to), 200); }
            catch (Exception ex) { _logger.LogError(ex, "Error"); return Result<List<StatisticItemDTO>>.Failure("Lỗi lấy dữ liệu thống kê", 500); }
        }

        public async Task<Result<List<StatisticItemDTO>>> GetCanceledOrdersByMonth(Guid technicianId, int year)
        {
            try { return Result<List<StatisticItemDTO>>.Success(await _repo.GetCanceledOrdersByMonth(technicianId, year), 200); }
            catch (Exception ex) { _logger.LogError(ex, "Error"); return Result<List<StatisticItemDTO>>.Failure("Lỗi lấy dữ liệu thống kê", 500); }
        }

        public async Task<Result<int>> GetRejectedOrdersTotal(Guid technicianId)
        {
            try { return Result<int>.Success(await _repo.GetRejectedOrdersTotal(technicianId), 200); }
            catch (Exception ex) { _logger.LogError(ex, "Error"); return Result<int>.Failure("Lỗi lấy dữ liệu thống kê", 500); }
        }

        public async Task<Result<List<StatisticItemDTO>>> GetRejectedOrdersByWeek(Guid technicianId, DateTime from, DateTime to)
        {
            try { return Result<List<StatisticItemDTO>>.Success(await _repo.GetRejectedOrdersByWeek(technicianId, from, to), 200); }
            catch (Exception ex) { _logger.LogError(ex, "Error"); return Result<List<StatisticItemDTO>>.Failure("Lỗi lấy dữ liệu thống kê", 500); }
        }

        public async Task<Result<List<StatisticItemDTO>>> GetRejectedOrdersByMonth(Guid technicianId, int year)
        {
            try { return Result<List<StatisticItemDTO>>.Success(await _repo.GetRejectedOrdersByMonth(technicianId, year), 200); }
            catch (Exception ex) { _logger.LogError(ex, "Error"); return Result<List<StatisticItemDTO>>.Failure("Lỗi lấy dữ liệu thống kê", 500); }
        }

        public async Task<Result<int>> GetTodayReceivedOrders(Guid technicianId)
        {
            try { return Result<int>.Success(await _repo.GetTodayReceivedOrders(technicianId), 200); }
            catch (Exception ex) { _logger.LogError(ex, "Error"); return Result<int>.Failure("Lỗi lấy dữ liệu thống kê", 500); }
        }

        public async Task<Result<int>> GetTodayCompletedOrders(Guid technicianId)
        {
            try { return Result<int>.Success(await _repo.GetTodayCompletedOrders(technicianId), 200); }
            catch (Exception ex) { _logger.LogError(ex, "Error"); return Result<int>.Failure("Lỗi lấy dữ liệu thống kê", 500); }
        }
    }
}
