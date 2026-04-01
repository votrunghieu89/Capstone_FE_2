namespace Capstone_2_BE.DTOs.Technician.Orders
{
    public class OrderActionResDTO
    {
        public Guid OrderId { get; set; }
        public Guid SenderId { get; set; }
        public Guid ReceiverId { get; set; }
        public string OrderName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
