namespace Capstone_2_BE.DTOs.Service
{
    public class ServiceAdminDTO
    {
        public Guid Id { get; set; }
        public string ServiceName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime CreateAt { get; set; }
        public DateTime UpdateAt { get; set; }
    }
}