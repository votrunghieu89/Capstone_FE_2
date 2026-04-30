namespace Capstone_2_BE.DTOs.Customer.AutoFind
{
    public class AutoFindFixerDTO
    {
        public string Latitude { get; set; }
        public string Longitude { get; set; }
        public Guid CityId { get; set; }
        public Guid ServiceId { get; set; }
    }
}
