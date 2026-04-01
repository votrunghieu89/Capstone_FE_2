using Capstone_2_BE.DTOs.Customer.AutoFind;
using Capstone_2_BE.DTOs.Customer.Order;
using Capstone_2_BE.Services.Customer;
using Microsoft.AspNetCore.Mvc;

namespace Capstone_2_BE.Controllers.Customer
{
    [ApiController]
    [Route("api/customer/autofind")]
    public class CustomerAutoFindController : ControllerBase
    {
        private readonly CustomerAutoFindService _service;
        private readonly ILogger<CustomerAutoFindController> _logger;

        public CustomerAutoFindController(CustomerAutoFindService service, ILogger<CustomerAutoFindController> logger)
        {
            _service = service;
            _logger = logger;
        }

        [HttpPost("find/{customerId}")]
        public async Task<IActionResult> AutoFindTechnician(Guid customerId, [FromBody] AutoFindFixerDTO dto)
        {
            var result = await _service.AutoFindTechnician(customerId, dto);
            if (!result.IsSuccess) return StatusCode(result.StatusCode, new { message = result.Error });
            return StatusCode(result.StatusCode, new { message = result.Data });
        }

        [HttpPost("place-auto-order")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> PlaceAutoOrder([FromForm] CreateOrderFormDTO form)
        {
            var result = await _service.PlaceAutoOrder(form);
            if (!result.IsSuccess) return StatusCode(result.StatusCode, new { message = result.Error });
            return StatusCode(result.StatusCode, new { message = "??t ??n t? ??ng thành công" });
        }

        [HttpGet("accept/{customerId}")]
        public async Task<IActionResult> GetFirstTechnician(Guid customerId)
        {
            var result = await _service.GetFirstTechnician(customerId);
            if (!result.IsSuccess) return StatusCode(result.StatusCode, new { message = result.Error });
            return StatusCode(result.StatusCode, result.Data);
        }

        [HttpDelete("clear/{customerId}")]
        public async Task<IActionResult> ClearCache(Guid customerId)
        {
            var result = await _service.ClearTechnicianCache(customerId);
            if (!result.IsSuccess) return StatusCode(result.StatusCode, new { message = result.Error });
            return StatusCode(result.StatusCode, new { message = result.Data });
        }
    }
}
