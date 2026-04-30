namespace Capstone_2_BE.DTOs.Technician.Rating
{
    public class TechnicianRatingDetailDTO
    {
        public Guid Id { get; set; }
        public string FullName { get; set; }
        public string? AvatarURL { get; set; }
        public decimal AverageScore { get; set; }
        public int TotalFeedbacks { get; set; }
        public List<TechnicianFeedbackViewDTO> Feedbacks { get; set; } = new List<TechnicianFeedbackViewDTO>();
    }
}
