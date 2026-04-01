namespace Capstone_2_BE.DTOs.Customer.Order
{
    public class OrderOverviewDTO
    {
        public Guid OrderId { get; set; }
        public string TechnicianName { get; set; }
        public string ServiceName { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Status { get; set; }
        public DateTime OrderDate { get; set; }
    }
}
