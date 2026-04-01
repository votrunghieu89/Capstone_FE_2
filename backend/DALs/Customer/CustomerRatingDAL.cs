using Capstone_2_BE.DTOs.Customer.Rating;
using Capstone_2_BE.Models;
using Capstone_2_BE.Repositories.Customer;
using Microsoft.EntityFrameworkCore;

namespace Capstone_2_BE.DALs.Customer
{
    public class CustomerRatingDAL : ICustomerRatingRepo
    {
        private readonly AppDbContext _context;
        private readonly ILogger<CustomerRatingDAL> _logger;

        public CustomerRatingDAL(AppDbContext context, ILogger<CustomerRatingDAL> logger)
        {
            _context = context;
            _logger = logger;
        }
        public async Task<bool> CreateFeedBack(CreateFeedbackDTO createFeedback)
        {
            try
            {
                RatingModel newFeedback = new RatingModel
                {
                    TechnicianId = createFeedback.TechnicianId,
                    CustomerId = createFeedback.CustomerId,
                    OrderId = createFeedback.OrderId,
                    Score = createFeedback.Score,
                    Feedback = createFeedback.Feedback,
                    CreateAt = DateTime.Now
                };
                await _context.RatingModel.AddAsync(newFeedback);
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while creating feedback.");
                return false;
            }
        }

        public async Task<bool> DeleteFeedBack(Guid FeedbackId)
        {
            try
            {
                int isDelte = await _context.RatingModel.Where(r => r.Id == FeedbackId).ExecuteDeleteAsync();
                if (isDelte > 0)
                {
                    return true;
                }
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while deleting feedback with ID: {FeedbackId}", FeedbackId);
                return false;
            }
        }

        public async Task<bool> UpdateFeedBack(UpdateFeedbackDTO updateFeedback)
        {
            try
            {
                int isUpdate = await _context.RatingModel.Where(r => r.Id == updateFeedback.FeedbackId).ExecuteUpdateAsync(r => r
                    .SetProperty(r => r.Score, updateFeedback.Score) // Ví dụ: cập nhật điểm số thành 5
                    .SetProperty(r => r.Feedback, updateFeedback.Feedback) // Ví dụ: cập nhật nội dung đánh giá
                    .SetProperty(r => r.UpdateAt, DateTime.Now) // Cập nhật lại thời gian tạo
                );
                if (isUpdate > 0)
                {
                    return true;
                }
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while updating feedback with ID: {FeedbackId}", updateFeedback.FeedbackId);
                return false;
            }
        }

        public async Task<List<ViewFeedBackDTO>> ViewCreatedFeedBack(Guid CustomerId)
        {
            try
            {
                var totalFeedback = await _context.RatingModel.CountAsync(r => r.CustomerId == CustomerId);

                var result = await _context.RatingModel
                    .Where(r => r.CustomerId == CustomerId)
                    .Select(r => new ViewFeedBackDTO
                    {
                        OrderId = r.OrderId,
                        TechnicianId = r.TechnicianId,
                        FeedbackId = r.Id,
                        Score = r.Score,
                        Feedback = r.Feedback,
                        TotalFeedback = totalFeedback
                    })
                    .ToListAsync();
                if (result != null && result.Count > 0)
                {
                    return result;
                }
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while viewing feedback for Customer ID: {CustomerId}", CustomerId);
                return null;
            }
        }
    }
}
