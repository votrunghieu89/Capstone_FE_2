namespace Capstone_2_BE.DTOs.Technician.Rating
{
    public class TechnicianRatingViewDTO
    {
        public Guid Id { get; set; }
        public decimal AvgScore { get; set; }
        public int RatingCount { get; set; }
        public int TotalOrders { get; set; }
        public string FullName { get; set; }    
        public string? AvatarURL { get; set; }
    }
}
