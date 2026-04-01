namespace Capstone_2_BE.DTOs.Customer.Order
{
    public class UpdateOrderDALDTO
    {
        public Guid OrderId { get; set; }
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? Address { get; set; }
        public Guid CityId { get; set; }
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public string? videoUrl { get; set; }
        public List<string> ImageUrls { get; set; } = new List<string>();
    }
}
