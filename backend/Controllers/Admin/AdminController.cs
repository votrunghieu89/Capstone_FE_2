using Capstone_2_BE.Services.Admin;
using Microsoft.AspNetCore.Mvc;

namespace Capstone_2_BE.Controllers
{
    [Route("api/admin")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly AdminService _service;

        public AdminController(AdminService service)
        {
            _service = service;
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            var result = await _service.GetUsers();
            return Ok(result.Data);
        }

        [HttpPut("users/{id}/lock")]
        public async Task<IActionResult> LockUser(Guid id)
        {
            var result = await _service.LockUser(id);
            return StatusCode(result.StatusCode, result);
        }

        [HttpPut("users/{id}/unlock")]
        public async Task<IActionResult> UnlockUser(Guid id)
        {
            var result = await _service.UnlockUser(id);
            return StatusCode(result.StatusCode, result);
        }

        [HttpGet("stats/users")]
        public async Task<IActionResult> GetUserStats()
        {
            var result = await _service.GetUserStats();
            return Ok(result.Data);
        }

        [HttpGet("stats/orders")]
        public async Task<IActionResult> GetOrderStats()
        {
            var result = await _service.GetOrderStats();
            return Ok(result.Data);
        }

        [HttpGet("feedback")]
        public async Task<IActionResult> GetFeedback()
        {
            var result = await _service.GetFeedback();
            return Ok(result.Data);
        }

        [HttpDelete("feedback/{id}")]
        public async Task<IActionResult> DeleteFeedback(Guid id)
        {
            var result = await _service.DeleteFeedback(id);
            return StatusCode(result.StatusCode, result);
        }

        [HttpGet("technicians")]
        public async Task<IActionResult> GetTechnicians()
        {
            var result = await _service.GetTechnicians();
            return Ok(result.Data);
        }
    }
}