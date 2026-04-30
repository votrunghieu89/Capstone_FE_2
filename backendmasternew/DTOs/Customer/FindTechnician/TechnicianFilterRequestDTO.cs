namespace Capstone_2_BE.DTOs.Customer.FindTechnician
{
    public class TechnicianFilterRequestDTO
    {
        public Guid? CityId { get; set; }
        public Guid? ServiceId { get; set; }
        public decimal? startRate { get; set; }
        public decimal? endRate { get; set; }
    }
}
