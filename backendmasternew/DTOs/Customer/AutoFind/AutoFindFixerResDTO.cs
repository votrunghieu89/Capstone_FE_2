namespace Capstone_2_BE.DTOs.Customer.AutoFind
{
    public class AutoFindFixerResDTO
    {
        public Guid TechnicianId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string avatarURL { get; set; } = string.Empty;   
        public string ServiceName { get; set; } = string.Empty;
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public decimal AvgScore { get; set; }
        public decimal Total { get; set; }
        public int OrderCount { get; set; }
        public int RatingCount { get; set; }
        public double YearOfExperience { get; set; }
        public double? EstimatedTime { get; set; }
        public string Address { get; set; }
        public string City { get; set; }
    }
}
