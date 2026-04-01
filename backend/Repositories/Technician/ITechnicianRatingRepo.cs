using Capstone_2_BE.DTOs.Technician.Orders;
using Capstone_2_BE.DTOs.Technician.Rating;

namespace Capstone_2_BE.Repositories
{
    public interface ITechnicianRatingRepo
    {
        Task<TechnicianRatingViewDTO> getTechniqueRateOverview(Guid technicianId);
        Task<List<TechnicianFeedbackViewDTO>> getTechniqueFeedBack(Guid technicianId);
        Task<TechnicianGetOrderFromFeedbackDTO> getDetailOrderofFeedback(Guid feedbackId);
    }
}
