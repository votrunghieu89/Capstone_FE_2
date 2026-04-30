namespace Capstone_2_BE.DTOs.Technician.Profile
{
    public class TechnicianProfileUpdateDTO
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public IFormFile? AvatarURl { get; set; }
        public string PhoneNumber { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public Guid CityId { get; set; }
        public string Latitude { get; set; }
        public string Longitude { get; set; }
        public Guid ServiceId { get; set; }
        public string Description { get; set; } = string.Empty;
        public double Experiences { get; set; } 
    }
}
