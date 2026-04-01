namespace Capstone_2_BE.DTOs.Service
{
    public class ServiceDTO
    {
        public Guid Id { get; set; }
        public string ServiceName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }
}
