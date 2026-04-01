namespace Capstone_2_BE.DTOs.Technician.Rating
{
    public class TechnicianFeedbackViewDTO
    {
        public Guid CustomerId { get; set; }
        public Guid OrderId { get; set; }
        public Guid FeedbackId { get; set; }
        public string CustomerFullName { get; set; }
        public string? CustomerAvatarURL { get; set; } = string.Empty;
        public string Feedback { get; set; } = string.Empty;
        public decimal Score { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
