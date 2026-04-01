namespace Capstone_2_BE.DTOs.Customer.Order
{
    public class OrderOldImageVideo
    {
        public string? VideoUrl { get; set; }
        public List<string> ImageUrls { get; set; } = new List<string>();
    }
}
