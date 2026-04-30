namespace Capstone_2_BE.DTOs.Customer.Order
{
    public class OrderOverviewDTO
    {
        public Guid OrderId { get; set; }
        public Guid TechnicianId { get; set; }
        public string TechnicianName { get; set; }
        public string ServiceName { get; set; }
        public string Address { get; set; }
        public string CityName { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Status { get; set; }
        public double? EstimatedTime { get; set; }
        public DateTime OrderDate { get; set; }
    }
}
