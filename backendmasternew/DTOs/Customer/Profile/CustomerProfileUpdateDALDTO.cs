namespace Capstone_2_BE.DTOs.Customer.Profile
{
    public class CustomerProfileUpdateDALDTO
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string AvatarURl { get; set; }
        public string PhoneNumber { get; set; } = string.Empty;
    }
}
