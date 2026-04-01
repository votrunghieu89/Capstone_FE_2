namespace Capstone_2_BE.DTOs.Customer.AutoFind
{
    public class AutoFindFixerDTO
    {
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public Guid CityId { get; set; }
        public Guid ServiceId { get; set; }
    }
}
