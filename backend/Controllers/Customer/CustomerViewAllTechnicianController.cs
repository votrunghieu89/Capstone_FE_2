using Capstone_2_BE.DTOs.Customer.FindTechnician;
using Capstone_2_BE.DTOs.Customer.Order;
using Capstone_2_BE.Services.Customer;
using Microsoft.AspNetCore.Mvc;

namespace Capstone_2_BE.Controllers.Customer
{
    [ApiController]
    [Route("api/customer/technicians")]
    public class CustomerViewAllTechnicianController : ControllerBase
    {
        private readonly CustomerViewAllTechnicianService _service;
        private readonly ILogger<CustomerViewAllTechnicianController> _logger;

        public CustomerViewAllTechnicianController(CustomerViewAllTechnicianService service, ILogger<CustomerViewAllTechnicianController> logger)
        {
            _service = service;
            _logger = logger;
        }

        [HttpGet("all")]
        public async Task<IActionResult> ViewAll()
        {
            var result = await _service.ViewAllTechnician();
            if (!result.IsSuccess) return StatusCode(result.StatusCode, new { message = result.Error });
            return StatusCode(result.StatusCode, result.Data);
        }

        [HttpGet("by-area/{city}")]
        public async Task<IActionResult> ByArea(Guid cityId)
        {
            var result = await _service.FilterByArea(cityId);
            if (!result.IsSuccess) return StatusCode(result.StatusCode, new { message = result.Error });
            return StatusCode(result.StatusCode, result.Data);
        }

        [HttpGet("by-service/{serviceId}")]
        public async Task<IActionResult> ByService(Guid serviceId)
        {
            var result = await _service.FilterByService(serviceId);
            if (!result.IsSuccess) return StatusCode(result.StatusCode, new { message = result.Error });
            return StatusCode(result.StatusCode, result.Data);
        }

        [HttpGet("by-rate")]
        public async Task<IActionResult> ByRate([FromQuery] decimal start, [FromQuery] decimal end)
        {
            var result = await _service.FilterByRate(start, end);
            if (!result.IsSuccess) return StatusCode(result.StatusCode, new { message = result.Error });
            return StatusCode(result.StatusCode, result.Data);
        }

        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string TechnicianName)
        {
            var result = await _service.SearchByName(TechnicianName);
            if (!result.IsSuccess) return StatusCode(result.StatusCode, new { message = result.Error });
            return StatusCode(result.StatusCode, result.Data);
        }

        [HttpPost("place-order")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> PlaceOrder([FromForm] CreateOrderFormDTO form)
        {
            var result = await _service.PlaceOrder(form);
            if (!result.IsSuccess) return StatusCode(result.StatusCode, new { message = result.Error });
            return StatusCode(result.StatusCode, new { message = "??t ??n thành công" });
        }
    }
}
