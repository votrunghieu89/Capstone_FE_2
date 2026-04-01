namespace Capstone_2_BE.DTOs.Customer.FindTechnician
{
    public class ViewAllTechnicianDTO
    {
        public Guid TechnicianId { get; set; }
        public Guid ServiceId { get; set; }
        public string TechnicianName { get; set; } = string.Empty;
        public string ServiceName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public int OrderCount { get; set; }
        public int RatingCount { get; set; }
        public decimal AverageRating { get; set; }  
        public Guid CityId { get; set; }
        public string? Address { get; set; }
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
    }
}
