using Capstone_2_BE.DTOs.Customer.Rating;
using Capstone_2_BE.DTOs.Customer.Rating;

namespace Capstone_2_BE.Repositories.Customer
{
    public interface ICustomerRatingRepo
    {
        // Đánh giá kỹ thuật viên sau khi hoàn thành đơn hàng
        Task<bool> CreateFeedBack(CreateFeedbackDTO createFeedback);
        // Xem lại toàn bộ đánh giá ( view theo ngày tạo, ms nhất đến cũ nhất)
        Task<List<ViewFeedBackDTO>> ViewCreatedFeedBack(Guid CustomerId);
        // Sửa đánh giá ( chỉ được sửa khi đơn hàng đã hoàn thành và đã đánh giá)
        Task<bool> UpdateFeedBack(UpdateFeedbackDTO updateFeedback);
        // Xoá đánh giá ( chỉ được xoá khi đơn hàng đã hoàn thành và đã đánh giá)
        Task<bool> DeleteFeedBack(Guid FeedbackId);
    }
}
