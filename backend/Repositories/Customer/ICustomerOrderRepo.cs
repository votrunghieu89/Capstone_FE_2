using Capstone_2_BE.DTOs.Customer.Order;
using Capstone_2_BE.DTOs.Technician.Orders;

namespace Capstone_2_BE.Repositories.Customer
{
    public interface ICustomerOrderRepo
    {
        // đặt đơn hàng ( Phần SerivceId sẽ lấy từ thông tin kỹ thuật viên chọn nên có sẽ cố định ( màu xám) ko thể sửa)
        Task<bool> InsertOrder(CreateOrderDALDTO placeOrderDALDTO);
        // Xem đơn hàng hiện tại ( bao gồm cả trang thái đơn hàng: đang chờ, đang xử lý, đang giao hàng)
        Task<List<OrderOverviewDTO>> GetCurrentOrders(Guid customerId);
        // Xem lịch sử đơn hàng
        Task<List<OrderOverviewDTO>> GetOrderHistory(Guid customerId);
        // Xem đơn dàng đã huỷ
        Task<List<OrderOverviewDTO>> GetCancalledOrder(Guid customerId);
        // Xem đơn hàng bị từ chối
        Task<List<OrderOverviewDTO>> GetRejectedOrder(Guid customerId);
        // Xem chi tiết đơn hàng
        Task<OrderDetailDTO> GetOrderDetail(Guid orderId);
        // Huỷ đơn hàng
        Task<OrderActionResDTO> CancelOrder(OrderActionDTO orderActionDTO);
        // Sửa đơn hàng ( chỉ được sửa khi đơn hàng đang chờ hoặc từ chối, bị huỷ)
        Task<OrderOldImageVideo> updateOrder(UpdateOrderDALDTO updateOrderDTO);
        // Xác nhận đơn hàng đã hoàn thành
        Task<OrderActionResDTO> ConfirmCompletedOrder(OrderActionDTO orderActionDTO);
    }
}
