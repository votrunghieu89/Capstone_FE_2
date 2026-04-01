using Capstone_2_BE.DTOs.Technician.Orders;

namespace Capstone_2_BE.Repositories
{
    public interface ITechnicianOrderRepo
    {
        // Xem đơn hàng đang xử lý
        Task<ViewOrderDTO> GetInProgressOrders(Guid technicianId);
        // Xem danh sách đơn hàng đang chờ xác nhận
        Task<List<ViewOrderDTO>> GetConfirmingOrders(Guid technicianId);
        // Xem danh sách đơn hàng đã xác nhận
        Task<List<ViewOrderDTO>> GetConfirmedOrders(Guid technicianId);
        // Xem lịch sử đơn hàng đã hoàn thành
        Task<List<ViewOrderDTO>> GetHistoryOrders(Guid technicianId);
        // Xem đơn hàng đã bị huỷ ( cả do khách hàng huỷ)
        Task<List<ViewOrderDTO>> GetCanceledOrders(Guid technicianId);
        // Xem đơn hàng bị từ chối ( do kỹ thuật viên từ chối)
        Task<List<ViewOrderDTO>> GetRejectedOrders(Guid technicianId);
        // View Order Details
        Task<ViewOrderDetailDTO> GetOrderDetails(Guid orderId, Guid technicianId);
        // Change Confirming Order to Confirmed
        Task<OrderActionResDTO> ConfirmOrder(Guid orderId, Guid technicianId);
        // Changge Confirmed Order to In Progress
        Task<OrderActionResDTO> StartOrder(Guid orderId, Guid technicianId);
        //// Change In Progress Order to Completed
        //Task<bool> CompleteOrder(Guid orderId, Guid AccountId);
        // Cancel Order
        Task<OrderActionResDTO> RejectedOrder(Guid orderId, Guid technicianId);
        Task<OrderActionResDTO> CompletedOrder(Guid orderId);
    }
}
