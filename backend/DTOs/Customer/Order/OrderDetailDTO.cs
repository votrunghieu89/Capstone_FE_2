namespace Capstone_2_BE.DTOs.Customer.Order
{
    public class OrderDetailDTO
    {
        public Guid OrderId { get; set; }
        public string ServiceName { get; set; } = string.Empty;
        public string TechnicianName { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? videoUrl { get; set; } = string.Empty;
        public List<string> ImageUrls { get; set; } = new List<string>();
        public DateTime CreateAt { get; set; }


    }
}
