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
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }

        public IFormFile? VideoFile { get; set; }
        public List<IFormFile>? ImageFiles { get; set; }
    }
}