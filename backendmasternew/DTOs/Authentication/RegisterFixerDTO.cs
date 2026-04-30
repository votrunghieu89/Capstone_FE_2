namespace Capstone_2_BE.DTOs.Authentication
{
    public class RegisterFixerDTO
    {
        public string Email { get; set; }
        public string Password { get; set; }
        public string FullName { get; set; }
        public string PhoneNumber { get; set; }
        public string? Address { get; set; }
        public Guid? CityId { get; set; }
        public string?  Latitude { get; set; }
        public string? Longitude { get; set; }
    }
}
