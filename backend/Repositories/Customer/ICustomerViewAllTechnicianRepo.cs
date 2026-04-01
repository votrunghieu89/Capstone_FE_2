using Capstone_2_BE.DTOs.Customer.FindTechnician;
using Capstone_2_BE.DTOs.Customer.Order;

namespace Capstone_2_BE.Repositories.Customer
{
    public interface ICustomerViewAllTechnicianRepo
    {
        // Xem tất cả kỹ thuật viên ( chỗ này hiển thị thêm tên và id service, nhớ phải có Avgscore, OrderCount, RatingCount nữa)
        Task<List<ViewAllTechnicianDTO>> ViewALLTechnician();
        // Đặt đơn hàng cho kỹ thuật viên ( phải kèm Id service để có thể dùng cho form nhập)
        Task<bool> PlaceOrderForTechnician(CreateOrderDALDTO placeOrderDALDTO);
        // Lọc ( rate, khu vực, dịch vụ
        Task<List<ViewAllTechnicianDTO>> FilterTechnicianbyRate(decimal startRate, decimal endRate);
        Task<List<ViewAllTechnicianDTO>> FilterTechnicianbyArea(Guid CityId);
        Task<List<ViewAllTechnicianDTO>> FilterTechnicianbyService(Guid ServiceId);
        // Tìm kiếm theo họ và tên
        Task<List<ViewAllTechnicianDTO>> SearchTechnicianbyName(string FullName);
    }
}
