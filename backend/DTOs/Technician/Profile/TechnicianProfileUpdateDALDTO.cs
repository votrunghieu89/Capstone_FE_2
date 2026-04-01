namespace Capstone_2_BE.DTOs.Technician.Profile
{
    public class TechnicianProfileUpdateDALDTO
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string AvatarURl { get; set; }
        public string PhoneNumber { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public Guid CityId { get; set; }
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public Guid ServiceId { get; set; }
        public string Description { get; set; } = string.Empty;
        public string Experiences { get; set; } = string.Empty;
    }
}
