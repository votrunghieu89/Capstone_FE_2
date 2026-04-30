namespace Capstone_2_BE.DTOs.Technician.Rating
{
    public class TechnicianGetOrderFromFeedbackDTO
    {
        public Guid OrderId { get; set; }
        public string CustomerName { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Address { get; set; }
        public string City { get; set; }
        public string Status { get; set; }
        public DateTime OrderDate { get; set; }
    }
}
