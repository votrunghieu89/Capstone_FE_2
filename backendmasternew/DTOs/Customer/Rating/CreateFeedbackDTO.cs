namespace Capstone_2_BE.DTOs.Customer.Rating
{
    public class CreateFeedbackDTO
    {
        public Guid TechnicianId { get; set; }
        public Guid OrderId { get; set; }
        public Guid CustomerId { get; set; }
        public decimal Score { get; set; }
        public string Feedback { get; set; } = string.Empty;
    }
}
