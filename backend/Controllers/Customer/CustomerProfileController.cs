using Capstone_2_BE.DTOs.Customer.Profile;
using Capstone_2_BE.Services.Customer;
using Microsoft.AspNetCore.Mvc;

namespace Capstone_2_BE.Controllers.Customer
{
    [ApiController]
    [Route("api/customer/profile")]
    public class CustomerProfileController : ControllerBase
    {
        private readonly CustomerProfileService _customerProfileService;
        private readonly ILogger<CustomerProfileController> _logger;

        public CustomerProfileController(CustomerProfileService customerProfileService, ILogger<CustomerProfileController> logger)
        {
            _customerProfileService = customerProfileService;
            _logger = logger;
        }

        /// <summary>
        /// L?y thông tin profile khách hàng
        /// </summary>
        [HttpGet("{customerId}")]
        public async Task<IActionResult> GetCustomerProfile(Guid customerId)
        {
            var result = await _customerProfileService.GetCustomerProfile(customerId);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, result.Data);
        }

        /// <summary>
        /// C?p nh?t thông tin profile khách hàng
        /// </summary>
        [HttpPut]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UpdateCustomerProfile([FromForm] CustomerProfileUpdateDTO updateDTO)
        {
            var result = await _customerProfileService.UpdateCustomerProfile(updateDTO);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, new { message = result.Data });
        }
    }
}
