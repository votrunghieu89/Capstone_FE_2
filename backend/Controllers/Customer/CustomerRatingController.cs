using Capstone_2_BE.DTOs.Customer.Rating;
using Capstone_2_BE.Services.Customer;
using Microsoft.AspNetCore.Mvc;

namespace Capstone_2_BE.Controllers.Customer
{
    [ApiController]
    [Route("api/customer/rating")]
    public class CustomerRatingController : ControllerBase
    {
        private readonly CustomerRatingService _customerRatingService;

        public CustomerRatingController(CustomerRatingService customerRatingService)
        {
            _customerRatingService = customerRatingService;
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateFeedBack([FromBody] CreateFeedbackDTO createFeedback)
        {
            var result = await _customerRatingService.CreateFeedBack(createFeedback);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, new { message = result.Data });
        }

        [HttpGet("view/{customerId}")]
        public async Task<IActionResult> ViewCreatedFeedBack(Guid customerId)
        {
            var result = await _customerRatingService.ViewCreatedFeedBack(customerId);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, result.Data);
        }

        [HttpPut("update")]
        public async Task<IActionResult> UpdateFeedBack([FromBody] UpdateFeedbackDTO updateFeedback)
        {
            var result = await _customerRatingService.UpdateFeedBack(updateFeedback);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, new { message = result.Data });
        }

        [HttpDelete("delete/{feedbackId}")]
        public async Task<IActionResult> DeleteFeedBack(Guid feedbackId)
        {
            var result = await _customerRatingService.DeleteFeedBack(feedbackId);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, new { message = result.Data });
        }
    }
}