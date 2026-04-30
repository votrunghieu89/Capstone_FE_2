namespace Capstone_2_BE.DTOs.Technician.Orders
{
    public class ViewOrderDetailDTO
    {
        public Guid OrderId { get; set; }
        public string CustomerName { get; set; }
        public string ServiceName { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string PhoneNumgber { get; set; }
        public string Address { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? videoUrl { get; set; } = string.Empty;
        public double? EstimatedTime { get; set; }
        public List<string> ImageUrls { get; set; } = new List<string>();
        public DateTime CreateAt { get; set; }

    }
}
