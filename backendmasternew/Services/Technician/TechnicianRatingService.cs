using Capstone_2_BE.DTOs.Technician.Rating;
using Capstone_2_BE.Repositories;
using Capstone_2_BE.Settings;

namespace Capstone_2_BE.Services.Technician
{
    public class TechnicianRatingService
    {
        private readonly ITechnicianRatingRepo _technicianRatingRepo;
        private readonly AWS _aws;
        private readonly ILogger<TechnicianRatingService> _logger;

        public TechnicianRatingService(ITechnicianRatingRepo technicianRatingRepo, AWS aws, ILogger<TechnicianRatingService> logger)
        {
            _technicianRatingRepo = technicianRatingRepo;
            _aws = aws;
            _logger = logger;
        }

        public async Task<Result<TechnicianRatingViewDTO>> GetTechnicianRatingOverview(Guid technicianId)
        {
            try
            {
                var ratingOverview = await _technicianRatingRepo.getTechniqueRateOverview(technicianId);
                
                if (ratingOverview == null)
                {
                    return Result<TechnicianRatingViewDTO>.Failure("Không tìm thấy thông tin đánh giá kỹ thuật viên", 404);
                }

                // Convert avatar key to public URL if exists
                if (!string.IsNullOrEmpty(ratingOverview.AvatarURL))
                {
                    ratingOverview.AvatarURL = await _aws.ReadImage(ratingOverview.AvatarURL);
                }

                return Result<TechnicianRatingViewDTO>.Success(ratingOverview, 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting technician rating overview for ID: {TechnicianId}", technicianId);
                return Result<TechnicianRatingViewDTO>.Failure("Lỗi khi lấy thông tin đánh giá kỹ thuật viên", 500);
            }
        }

        public async Task<Result<List<TechnicianFeedbackViewDTO>>> GetTechnicianFeedbacks(Guid technicianId)
        {
            try
            {
                var feedbacks = await _technicianRatingRepo.getTechniqueFeedBack(technicianId);
                
                if (feedbacks == null || feedbacks.Count == 0)
                {
                    return Result<List<TechnicianFeedbackViewDTO>>.Success(new List<TechnicianFeedbackViewDTO>(), 200);
                }

                foreach (var feedback in feedbacks)
                {
                    if (!string.IsNullOrEmpty(feedback.CustomerAvatarURL))
                    {
                        feedback.CustomerAvatarURL = await _aws.ReadImage(feedback.CustomerAvatarURL);
                    }
                }

                return Result<List<TechnicianFeedbackViewDTO>>.Success(feedbacks, 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting technician feedbacks for ID: {TechnicianId}", technicianId);
                return Result<List<TechnicianFeedbackViewDTO>>.Failure("Lỗi khi lấy danh sách đánh giá", 500);
            }
        }

        public async Task<Result<TechnicianGetOrderFromFeedbackDTO>> GetDetailOrderofFeedback(Guid feedbackId)
        {
            try
            {
                var orderDetail = await _technicianRatingRepo.getDetailOrderofFeedback(feedbackId);
                
                if (orderDetail == null)
                {
                    return Result<TechnicianGetOrderFromFeedbackDTO>.Failure("Không tìm thấy thông tin đơn hàng từ đánh giá này", 404);
                }

                return Result<TechnicianGetOrderFromFeedbackDTO>.Success(orderDetail, 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting order details for feedback ID: {FeedbackId}", feedbackId);
                return Result<TechnicianGetOrderFromFeedbackDTO>.Failure("Lỗi khi lấy thông tin đơn hàng từ đánh giá", 500);
            }
        }
    }
}
