namespace Capstone_2_BE.DTOs.Customer.Order
{
    public class CreateOrderDTO
    {
        public Guid CustomerId { get; set; }
        public Guid TechnicianId { get; set; }
        public Guid ServiceId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public Guid City { get; set; } 
        public string Latitude { get; set; }
        public string Longitude { get; set; }
        // filenames stored in AWS (not raw files)
        public string VideoFileName { get; set; } = string.Empty;
        public List<string> ImageFileNames { get; set; } = new List<string>();
    }
}