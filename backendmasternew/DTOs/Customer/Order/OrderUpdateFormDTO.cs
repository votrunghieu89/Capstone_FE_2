namespace Capstone_2_BE.DTOs.Customer.Order
{
    public class OrderUpdateFormDTO
    {
        public Guid OrderId { get; set; }
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? Address { get; set; }
        public Guid CityId { get; set; }
        public string Latitude { get; set; }
        public string Longitude { get; set; }
        public IFormFile? videoUrl { get; set; }
        public List<IFormFile> ImageUrls { get; set; } = new List<IFormFile>();
    }
}
