using Microsoft.AspNetCore.Http;

namespace Capstone_2_BE.DTOs.Customer.Order
{
    public class CreateOrderFormDTO
    {
        public Guid CustomerId { get; set; }
        public Guid TechnicianId { get; set; }
        public Guid ServiceId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public Guid CityId { get; set; }
        public string Latitude { get; set; } = string.Empty;
        public string Longitude { get; set; } = string.Empty;

        public IFormFile? VideoFile { get; set; }
        public List<IFormFile>? ImageFiles { get; set; }
    }
}