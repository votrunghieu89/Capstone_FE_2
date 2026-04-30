using Capstone_2_BE.DTOs.Service;
using Capstone_2_BE.Models;
using Capstone_2_BE.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Capstone_2_BE.DALs
{
    public class ServiceDAL : IServiceRepo
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ServiceDAL> _logger;

        public ServiceDAL(AppDbContext context, ILogger<ServiceDAL> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<string?> GetServiceName(Guid serviceId)
        {
            try
            {
                var svc = await _context.ServiceCategoriesModel.FindAsync(serviceId);
                return svc?.ServiceName;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting service name for {ServiceId}", serviceId);
                return null;
            }
        }

        public async Task<List<ServiceDTO>> GetAllServices()
        {
            try
            {
                return await _context.ServiceCategoriesModel
                    .Select(s => new ServiceDTO { Id = s.Id, ServiceName = s.ServiceName, Description = s.Description })
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all services");
                return new List<ServiceDTO>();
            }
        }

        public async Task<Guid?> GetServiceIdByName(string serviceName)
        {
            try
            {
                var svc = await _context.ServiceCategoriesModel.FirstOrDefaultAsync(s => s.ServiceName == serviceName);
                return svc?.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting service id for {ServiceName}", serviceName);
                return null;
            }
        }

        public async Task<Guid?> AddService(CreateServiceAdminDTO createDTO)
        {
            try
            {
                var service = new ServiceCategoriesModel
                {
                    ServiceName = createDTO.ServiceName,
                    Description = createDTO.Description,
                    CreateAt = DateTime.Now,
                    UpdateAt = DateTime.Now
                };
                await _context.ServiceCategoriesModel.AddAsync(service);
                await _context.SaveChangesAsync();
                return service.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding service {ServiceName}", createDTO.ServiceName);
                return null;
            }
        }

        public async Task<List<ServiceAdminDTO>> GetAllServicesAdmin()
        {
            try
            {
                return await _context.ServiceCategoriesModel
                    .Select(s => new ServiceAdminDTO
                    {
                        Id = s.Id,
                        ServiceName = s.ServiceName,
                        Description = s.Description,
                        CreateAt = s.CreateAt,
                        UpdateAt = s.UpdateAt
                    })
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all services for admin");
                return new List<ServiceAdminDTO>();
            }
        }

        public async Task<bool> UpdateService(ServiceDTO updateService)
        {
            try
            {
                var isUpdate = await _context.ServiceCategoriesModel.Where(s => s.Id == updateService.Id).ExecuteUpdateAsync(eu => eu.SetProperty(a => a.ServiceName, updateService.ServiceName)
                                                                                                                                     .SetProperty(a => a.Description, updateService.Description)
                                                                                                                                     .SetProperty(a => a.UpdateAt, DateTime.Now));
                if(isUpdate == 0)
                {
                    return false;
                }
                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        public async Task<bool> DeleteService(Guid serviceId)
        {
            try
            {
                var isDelete = await _context.ServiceCategoriesModel.Where(s => s.Id ==  serviceId).ExecuteDeleteAsync();
                if (isDelete == 0)
                {
                    return false;
                }
                return true;

            }
            catch (Exception ex) { 
                return false;
            }
        }
        // Thêm vào ServiceDAL.cs
        public async Task<List<object>> GetServicesSummary()
        {
            return await _context.ServiceCategoriesModel
                .Select(s => new
                {
                    id = s.Id, // Thêm dòng này
                    name = s.ServiceName,
                    total = _context.OrderrModel.Count(o => o.ServiceId == s.Id),
                    completed = _context.OrderrModel.Count(o => o.ServiceId == s.Id && o.Status.Contains("Completed"))
                })
                .ToListAsync<object>();
        }
    }
}
