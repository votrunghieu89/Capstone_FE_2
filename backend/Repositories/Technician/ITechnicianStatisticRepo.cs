using Capstone_2_BE.DTOs.Technician.Statistic;

namespace Capstone_2_BE.Repositories.Technician
{
    public interface ITechnicianStatisticRepo
    {
        // bảng thống kê của 1 tài khoản thợ
        // Tổng đơn hàng ( đã hoàn thành theo tuần) completed
        Task<List<StatisticItemDTO>> GetCompletedOrdersByWeek(Guid technicianId, DateTime from, DateTime to);
        // Tổng đơn hàng ( đã hoàn thành theo tháng) 
        Task<List<StatisticItemDTO>> GetCompletedOrdersByMonth(Guid technicianId, int year);
        // Tổng đơn hàng ( đã nhận theo tuần) cả năm trạng thái
        Task<List<StatisticItemDTO>> GetReceivedOrdersByWeek(Guid technicianId, DateTime from, DateTime to);
        // Tổng đơn hàng ( đã nhận theo tháng)
        Task<List<StatisticItemDTO>> GetReceivedOrdersByMonth(Guid technicianId, int year);
        // Tổng số đánh giá ( bao gồm tổng và trung bình)
        Task<RatingOverviewDTO> GetRatingOverview(Guid technicianId);
        // Đơn hàng bị huỷ ( bao gồm tổng và theo tuần, tháng) 2 hàm
        Task<int> GetCanceledOrdersTotal(Guid technicianId);
        Task<List<StatisticItemDTO>> GetCanceledOrdersByWeek(Guid technicianId, DateTime from, DateTime to);
        Task<List<StatisticItemDTO>> GetCanceledOrdersByMonth(Guid technicianId, int year);
        // Đơn hàng từ chối ( bao gồm tổng và theo tuần, tháng) 2 hàm 
        Task<int> GetRejectedOrdersTotal(Guid technicianId);
        Task<List<StatisticItemDTO>> GetRejectedOrdersByWeek(Guid technicianId, DateTime from, DateTime to);
        Task<List<StatisticItemDTO>> GetRejectedOrdersByMonth(Guid technicianId, int year);
        // Đơn hàng nhận hôm nay
        Task<int> GetTodayReceivedOrders(Guid technicianId);
        // Đơn hàng đã hoàn thành hôm nay
        Task<int> GetTodayCompletedOrders(Guid technicianId);
    }
}
