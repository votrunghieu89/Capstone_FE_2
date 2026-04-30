using Capstone_2_BE.DTOs.Service;

namespace Capstone_2_BE.Repositories
{
    public interface IServiceRepo
    {
        // --- Các hàm lấy thông tin cơ bản ---
        Task<string?> GetServiceName(Guid serviceId);
        Task<List<ServiceDTO>> GetAllServices(); // Dùng cho form order
        Task<Guid?> GetServiceIdByName(string serviceName);

        // --- Các hàm dành cho Admin ---

        // Thêm 1 service mới
        Task<Guid?> AddService(CreateServiceAdminDTO createDTO);

        // Lấy tất cả service với description cho Admin
        Task<List<ServiceAdminDTO>> GetAllServicesAdmin();

        // Lấy dữ liệu tổng hợp (Total/Completed) cho Dashboard/ServicesPage
        Task<List<object>> GetServicesSummary();

        // --- Cập nhật và Xóa ---
        Task<bool> UpdateService(ServiceDTO updateService);
        Task<bool> DeleteService(Guid serviceId);
    }
}