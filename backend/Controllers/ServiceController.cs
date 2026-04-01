using Capstone_2_BE.DTOs.Service;
using Capstone_2_BE.Services;
using Microsoft.AspNetCore.Mvc;

namespace Capstone_2_BE.Controllers
{
    [ApiController]
    [Route("api/service")]
    public class ServiceController : ControllerBase
    {
        private readonly ServiceType _serviceType;
        private readonly ILogger<ServiceController> _logger;

        public ServiceController(ServiceType serviceType, ILogger<ServiceController> logger)
        {
            _serviceType = serviceType;
            _logger = logger;
        }

        [HttpGet("{serviceId}")]
        public async Task<IActionResult> GetServiceName(Guid serviceId)
        {
            var result = await _serviceType.GetServiceName(serviceId);
            if (!result.IsSuccess) return StatusCode(result.StatusCode, new { message = result.Error });
            return StatusCode(result.StatusCode, new { serviceName = result.Data });
        }

        [HttpGet]
        public async Task<IActionResult> GetAllServices()
        {
            var result = await _serviceType.GetAllServices();
            if (!result.IsSuccess) return StatusCode(result.StatusCode, new { message = result.Error });
            return StatusCode(result.StatusCode, result.Data);
        }

        [HttpGet("id-by-name")]
        public async Task<IActionResult> GetServiceIdByName([FromQuery] string serviceName)
        {
            var result = await _serviceType.GetServiceIdByName(serviceName);
            if (!result.IsSuccess) return StatusCode(result.StatusCode, new { message = result.Error });
            return StatusCode(result.StatusCode, new { serviceId = result.Data });
        }

        // Admin endpoints
        [HttpPost("admin/add")]
        public async Task<IActionResult> AddService([FromBody] CreateServiceAdminDTO createDTO)
        {
            var result = await _serviceType.AddService(createDTO);
            if (!result.IsSuccess) return StatusCode(result.StatusCode, new { message = result.Error });
            return StatusCode(result.StatusCode, new { serviceId = result.Data });
        }

        //[HttpGet("admin/all")]
        //public async Task<IActionResult> GetAllServicesAdmin()
        //{
        //    var result = await _serviceType.GetAllServicesAdmin();
        //    if (!result.IsSuccess) return StatusCode(result.StatusCode, new { message = result.Error });
        //    return StatusCode(result.StatusCode, result.Data);
        //}
    }
}
