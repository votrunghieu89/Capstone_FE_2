namespace Capstone_2_BE.DTOs.Customer.Profile
{
    public class CustomerProfileViewDTO
    {
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string FullName { get; set; }
        public string AvatarURL { get; set; }
        public DateTime CreateAt { get; set; }
    }
}
