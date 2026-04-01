using Capstone_2_BE.DTOs.Customer.Rating;
using Capstone_2_BE.Repositories.Customer;
using Capstone_2_BE.Settings;

namespace Capstone_2_BE.Services.Customer
{
    public class CustomerRatingService
    {
        private readonly ICustomerRatingRepo _customerRatingRepo;
        private readonly ILogger<CustomerRatingService> _logger;

        public CustomerRatingService(ICustomerRatingRepo customerRatingRepo, ILogger<CustomerRatingService> logger)
        {
            _customerRatingRepo = customerRatingRepo;
            _logger = logger;
        }

        public async Task<Result<string>> CreateFeedBack(CreateFeedbackDTO createFeedback)
        {
            try
            {
                var result = await _customerRatingRepo.CreateFeedBack(createFeedback);
                if (result)
                {
                    return Result<string>.Success("?ánh giá k? thu?t viên thành công", 200);
                }
                return Result<string>.Failure("Không th? t?o ?ánh giá", 400);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating feedback in service.");
                return Result<string>.Failure("L?i h? th?ng khi t?o ?ánh giá", 500);
            }
        }

        public async Task<Result<List<ViewFeedBackDTO>>> ViewCreatedFeedBack(Guid customerId)
        {
            try
            {
                var result = await _customerRatingRepo.ViewCreatedFeedBack(customerId);
                if (result != null && result.Count > 0)
                {
                    return Result<List<ViewFeedBackDTO>>.Success(result, 200);
                }
                return Result<List<ViewFeedBackDTO>>.Success(new List<ViewFeedBackDTO>(), 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting feedbacks in service for CustomerId: {CustomerId}", customerId);
                return Result<List<ViewFeedBackDTO>>.Failure("L?i h? th?ng khi l?y danh sách ?ánh giá", 500);
            }
        }

        public async Task<Result<string>> UpdateFeedBack(UpdateFeedbackDTO updateFeedback)
        {
            try
            {
                var result = await _customerRatingRepo.UpdateFeedBack(updateFeedback);
                if (result)
                {
                    return Result<string>.Success("C?p nh?t ?ánh giá thành công", 200);
                }
                return Result<string>.Failure("Không th? c?p nh?t ?ánh giá", 400);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating feedback in service for FeedbackId: {FeedbackId}", updateFeedback.FeedbackId);
                return Result<string>.Failure("L?i h? th?ng khi c?p nh?t ?ánh giá", 500);
            }
        }

        public async Task<Result<string>> DeleteFeedBack(Guid feedbackId)
        {
            try
            {
                var result = await _customerRatingRepo.DeleteFeedBack(feedbackId);
                if (result)
                {
                    return Result<string>.Success("Xóa ?ánh giá thành công", 200);
                }
                return Result<string>.Failure("Không th? xóa ?ánh giá", 400);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting feedback in service for FeedbackId: {FeedbackId}", feedbackId);
                return Result<string>.Failure("L?i h? th?ng khi xóa ?ánh giá", 500);
            }
        }
    }
}