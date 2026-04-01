using Capstone_2_BE.DTOs.Service;

namespace Capstone_2_BE.Repositories
{
    public interface IServiceRepo
    {
        Task<string?> GetServiceName(Guid serviceId); 
        Task<List<ServiceDTO>> GetAllServices(); // Dùng cho form order
        Task<Guid?> GetServiceIdByName(string serviceName);

        // Thêm 1 service mới (Admin)
        Task<Guid?> AddService(CreateServiceAdminDTO createDTO);

        // Lấy tất cả service but with description for Admin
        Task<List<ServiceAdminDTO>> GetAllServicesAdmin();
    }
}
