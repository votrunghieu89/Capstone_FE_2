namespace Capstone_2_BE.DTOs.Technician.Profile
{
    public class TechnicianProfileViewDTO
    {
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string FullName { get; set; }
        public string AvatarURL { get; set; }
        public string Address { get; set; }
        public string City { get; set; }
        public string ServiceName { get; set; }
        public int TotalOrders { get; set; }
        public int TotalRating { get; set; }
        public decimal AverageRating { get; set; }
        public DateTime CreateAt { get; set; }
        public string Description { get; set; }
        public string Experiences { get; set; }
    }
}
