namespace Capstone_2_BE.DTOs.Customer.Rating
{
    public class UpdateFeedbackDTO
    {
        public Guid FeedbackId { get; set; }
        public decimal Score { get; set; }
        public string Feedback { get; set; } = string.Empty;
    }
}
