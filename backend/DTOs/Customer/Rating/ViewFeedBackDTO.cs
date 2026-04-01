namespace Capstone_2_BE.DTOs.Customer.Rating
{
    public class ViewFeedBackDTO
    {
        public Guid OrderId { get; set; }
        public Guid TechnicianId { get; set; }
        public Guid FeedbackId { get; set; }
        public decimal Score { get; set; }
        public string Feedback { get; set; } = string.Empty;
        public int TotalFeedback { get; set; }
    }
}
