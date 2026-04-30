namespace Capstone_2_BE.DTOs.Technician.Orders
{
    public class TechnicianOrdersOverviewDTO
    {
        public ViewOrderDTO? InProgressOrder { get; set; }
        public List<ViewOrderDTO> ConfirmingOrders { get; set; } = new List<ViewOrderDTO>();
        public List<ViewOrderDTO> ConfirmedOrders { get; set; } = new List<ViewOrderDTO>();
        public int TotalHistoryOrders { get; set; }
        public int TotalCanceledOrders { get; set; }
    }
}
