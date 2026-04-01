using Capstone_2_BE.DTOs.Technician.Statistic;
using Capstone_2_BE.Repositories.Technician;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace Capstone_2_BE.DALs.Technician
{
    public class TechnicianStatisticDAL : ITechnicianStatisticRepo
    {
        private readonly AppDbContext _context;
        private readonly ILogger<TechnicianStatisticDAL> _logger;

        public TechnicianStatisticDAL(AppDbContext context, ILogger<TechnicianStatisticDAL> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<StatisticItemDTO>> GetCompletedOrdersByWeek(Guid technicianId, DateTime from, DateTime to)
        {
            var data = await _context.OrderrModel
                .Where(o => o.TechnicianId == technicianId && o.Status == "Completed" && o.CompleteAt >= from && o.CompleteAt <= to)
                .GroupBy(o => new { Year = o.CompleteAt.Year, Month = o.CompleteAt.Month, Day = o.CompleteAt.Day })
                .Select(g => new
                {
                    Date = new DateTime(g.Key.Year, g.Key.Month, g.Key.Day),
                    Count = g.Count()
                })
                .ToListAsync();

            var result = new List<StatisticItemDTO>();
            for (var d = from.Date; d <= to.Date; d = d.AddDays(1))
            {
                result.Add(new StatisticItemDTO
                {
                    Label = d.ToString("dd/MM/yyyy"),
                    Value = data.FirstOrDefault(x => x.Date == d)?.Count ?? 0
                });
            }
            return result;
        }

        public async Task<List<StatisticItemDTO>> GetCompletedOrdersByMonth(Guid technicianId, int year)
        {
            var data = await _context.OrderrModel
                .Where(o => o.TechnicianId == technicianId && o.Status == "Completed" && o.CompleteAt.Year == year)
                .GroupBy(o => o.CompleteAt.Month)
                .Select(g => new
                {
                    Month = g.Key,
                    Count = g.Count()
                })
                .ToListAsync();

            var result = new List<StatisticItemDTO>();
            for (int i = 1; i <= 12; i++)
            {
                result.Add(new StatisticItemDTO
                {
                    Label = $"Tháng {i}",
                    Value = data.FirstOrDefault(x => x.Month == i)?.Count ?? 0
                });
            }
            return result;
        }

        public async Task<List<StatisticItemDTO>> GetReceivedOrdersByWeek(Guid technicianId, DateTime from, DateTime to)
        {
            var data = await _context.OrderrModel
                .Where(o => o.TechnicianId == technicianId && o.CreateAt >= from && o.CreateAt <= to)
                .GroupBy(o => new { Year = o.CreateAt.Year, Month = o.CreateAt.Month, Day = o.CreateAt.Day })
                .Select(g => new
                {
                    Date = new DateTime(g.Key.Year, g.Key.Month, g.Key.Day),
                    Count = g.Count()
                })
                .ToListAsync();

            var result = new List<StatisticItemDTO>();
            for (var d = from.Date; d <= to.Date; d = d.AddDays(1))
            {
                result.Add(new StatisticItemDTO
                {
                    Label = d.ToString("dd/MM/yyyy"),
                    Value = data.FirstOrDefault(x => x.Date == d)?.Count ?? 0
                });
            }
            return result;
        }

        public async Task<List<StatisticItemDTO>> GetReceivedOrdersByMonth(Guid technicianId, int year)
        {
            var data = await _context.OrderrModel
                .Where(o => o.TechnicianId == technicianId && o.CreateAt.Year == year)
                .GroupBy(o => o.CreateAt.Month)
                .Select(g => new
                {
                    Month = g.Key,
                    Count = g.Count()
                })
                .ToListAsync();

            var result = new List<StatisticItemDTO>();
            for (int i = 1; i <= 12; i++)
            {
                result.Add(new StatisticItemDTO
                {
                    Label = $"Tháng {i}",
                    Value = data.FirstOrDefault(x => x.Month == i)?.Count ?? 0
                });
            }
            return result;
        }

        public async Task<RatingOverviewDTO> GetRatingOverview(Guid technicianId)
        {
            var ratings = await _context.RatingModel
                .Where(r => r.TechnicianId == technicianId)
                .ToListAsync();

            return new RatingOverviewDTO
            {
                TotalRating = ratings.Count,
                AvgScore = ratings.Count > 0 ? Math.Round(ratings.Average(r => r.Score), 1) : 0
            };
        }

        public async Task<int> GetCanceledOrdersTotal(Guid technicianId)
        {
            return await _context.OrderrModel
                .Where(o => o.TechnicianId == technicianId && o.Status == "Cancelled")
                .CountAsync();
        }

        public async Task<List<StatisticItemDTO>> GetCanceledOrdersByWeek(Guid technicianId, DateTime from, DateTime to)
        {
            var data = await _context.OrderrModel
                .Where(o => o.TechnicianId == technicianId && o.Status == "Cancelled" && o.CreateAt >= from && o.CreateAt <= to)
                .GroupBy(o => new { Year = o.CreateAt.Year, Month = o.CreateAt.Month, Day = o.CreateAt.Day })
                .Select(g => new
                {
                    Date = new DateTime(g.Key.Year, g.Key.Month, g.Key.Day),
                    Count = g.Count()
                })
                .ToListAsync();

            var result = new List<StatisticItemDTO>();
            for (var d = from.Date; d <= to.Date; d = d.AddDays(1))
            {
                result.Add(new StatisticItemDTO
                {
                    Label = d.ToString("dd/MM/yyyy"),
                    Value = data.FirstOrDefault(x => x.Date == d)?.Count ?? 0
                });
            }
            return result;
        }

        public async Task<List<StatisticItemDTO>> GetCanceledOrdersByMonth(Guid technicianId, int year)
        {
            var data = await _context.OrderrModel
                .Where(o => o.TechnicianId == technicianId && o.Status == "Cancelled" && o.CreateAt.Year == year)
                .GroupBy(o => o.CreateAt.Month)
                .Select(g => new
                {
                    Month = g.Key,
                    Count = g.Count()
                })
                .ToListAsync();

            var result = new List<StatisticItemDTO>();
            for (int i = 1; i <= 12; i++)
            {
                result.Add(new StatisticItemDTO
                {
                    Label = $"Tháng {i}",
                    Value = data.FirstOrDefault(x => x.Month == i)?.Count ?? 0
                });
            }
            return result;
        }

        public async Task<int> GetRejectedOrdersTotal(Guid technicianId)
        {
            return await _context.OrderrModel
                .Where(o => o.TechnicianId == technicianId && o.Status == "Rejected")
                .CountAsync();
        }

        public async Task<List<StatisticItemDTO>> GetRejectedOrdersByWeek(Guid technicianId, DateTime from, DateTime to)
        {
            var data = await _context.OrderrModel
                .Where(o => o.TechnicianId == technicianId && o.Status == "Rejected" && o.CreateAt >= from && o.CreateAt <= to)
                .GroupBy(o => new { Year = o.CreateAt.Year, Month = o.CreateAt.Month, Day = o.CreateAt.Day })
                .Select(g => new
                {
                    Date = new DateTime(g.Key.Year, g.Key.Month, g.Key.Day),
                    Count = g.Count()
                })
                .ToListAsync();

            var result = new List<StatisticItemDTO>();
            for (var d = from.Date; d <= to.Date; d = d.AddDays(1))
            {
                result.Add(new StatisticItemDTO
                {
                    Label = d.ToString("dd/MM/yyyy"),
                    Value = data.FirstOrDefault(x => x.Date == d)?.Count ?? 0
                });
            }
            return result;
        }

        public async Task<List<StatisticItemDTO>> GetRejectedOrdersByMonth(Guid technicianId, int year)
        {
            var data = await _context.OrderrModel
                .Where(o => o.TechnicianId == technicianId && o.Status == "Rejected" && o.CreateAt.Year == year)
                .GroupBy(o => o.CreateAt.Month)
                .Select(g => new
                {
                    Month = g.Key,
                    Count = g.Count()
                })
                .ToListAsync();

            var result = new List<StatisticItemDTO>();
            for (int i = 1; i <= 12; i++)
            {
                result.Add(new StatisticItemDTO
                {
                    Label = $"Tháng {i}",
                    Value = data.FirstOrDefault(x => x.Month == i)?.Count ?? 0
                });
            }
            return result;
        }

        public async Task<int> GetTodayReceivedOrders(Guid technicianId)
        {
            var today = DateTime.UtcNow.Date;
            return await _context.OrderrModel
                .Where(o => o.TechnicianId == technicianId && o.CreateAt >= today)
                .CountAsync();
        }

        public async Task<int> GetTodayCompletedOrders(Guid technicianId)
        {
            var today = DateTime.UtcNow.Date;
            return await _context.OrderrModel
                .Where(o => o.TechnicianId == technicianId && o.Status == "Completed" && o.CompleteAt >= today)
                .CountAsync();
        }
    }
}
