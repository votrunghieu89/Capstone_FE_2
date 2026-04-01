using Capstone_2_BE.DTOs.Technician.Orders;
using Capstone_2_BE.DTOs.Technician.Rating;
using Capstone_2_BE.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Capstone_2_BE.DALs.Technician
{
    public class TechnicianRatingDAL : ITechnicianRatingRepo
    {
        private readonly AppDbContext _context;
        private readonly ILogger<TechnicianRatingDAL> _logger;

        public TechnicianRatingDAL(AppDbContext context, ILogger<TechnicianRatingDAL> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<TechnicianGetOrderFromFeedbackDTO> getDetailOrderofFeedback(Guid feedbackId)
        {
            try
            {
                var result = await (from r in _context.RatingModel
                                    join o in _context.OrderrModel on r.OrderId equals o.Id
                                    join c in _context.CustomerProfileModel on o.CustomerId equals c.Id
                                    join ct in _context.CitiesModel on o.CityId equals ct.Id
                                    where r.Id == feedbackId
                                    select new TechnicianGetOrderFromFeedbackDTO
                                    {
                                        OrderId = o.Id,
                                        CustomerName = c.FullName,
                                        Title = o.Title,
                                        Description = o.Description,
                                        Address = o.Address,
                                        City = ct.CityName,
                                        Status = o.Status,
                                        OrderDate = o.CreateAt
                                    }).FirstOrDefaultAsync();
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting order details for feedback ID: {FeedbackId}", feedbackId);
                throw;
            }
        }

        public async Task<List<TechnicianFeedbackViewDTO>> getTechniqueFeedBack(Guid technicianId)
        {
            try
            {
                var feedbacks = await (from r in _context.RatingModel
                                       join c in _context.CustomerProfileModel on r.CustomerId equals c.Id
                                       where r.TechnicianId == technicianId
                                       select new TechnicianFeedbackViewDTO
                                       {
                                           FeedbackId = r.Id,
                                           OrderId = r.OrderId,
                                           CustomerId = c.Id,
                                           CustomerFullName = c.FullName,
                                           CustomerAvatarURL = c.AvatarURL,
                                           Feedback = r.Feedback,
                                           Score = r.Score,
                                           CreatedAt = r.CreateAt
                                       }).ToListAsync();
                return feedbacks;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting technician feedback for ID: {TechnicianId}", technicianId);
                throw;
            }
        }

        public async Task<TechnicianRatingViewDTO> getTechniqueRateOverview(Guid technicianId)
        {
            try
            {
                var result = await _context.TechnicianProfileModel
                    .Where(t => t.Id == technicianId)
                    .Select(t => new TechnicianRatingViewDTO
                    {
                        Id = t.Id,
                        FullName = t.FullName,
                        AvatarURL = t.AvatarURl,
                        AvgScore = _context.RatingModel.Where(r => r.TechnicianId == technicianId).Average(r => (decimal?)r.Score) ?? 0,
                        RatingCount = _context.RatingModel.Where(r => r.TechnicianId == technicianId).Count(),
                        TotalOrders = t.OrderCount
                    })
                    .FirstOrDefaultAsync();

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting technician rating overview for ID: {TechnicianId}", technicianId);
                throw;
            }
        }
    }
}
