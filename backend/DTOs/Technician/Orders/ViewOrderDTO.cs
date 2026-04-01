namespace Capstone_2_BE.DTOs.Technician.Orders
{
    public class ViewOrderDTO
    {
        public Guid OrderId { get; set; }
        public string CustomerName { get; set; }
        public string ServiceName { get; set; } 
        public string Title { get; set; } =  string.Empty;
        public string Status { get; set; }
        public DateTime OrderDate { get; set; }
       
    }
}
