using Capstone_2_BE.DTOs.Admin;
using Capstone_2_BE.Repositories;
using Capstone_2_BE.Services.Admin;
using Microsoft.AspNetCore.Mvc;
using Capstone_2_BE.DTOs.Service; // Thêm dòng này vào phần using

namespace Capstone_2_BE.Controllers
{
    [Route("api/admin")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly AdminService _service;
        private readonly IServiceRepo _serviceRepo;

        // GỘP CẢ HAI VÀO MỘT CONSTRUCTOR DUY NHẤT
        public AdminController(AdminService service, IServiceRepo serviceRepo)
        {
            _service = service;
            _serviceRepo = serviceRepo;
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

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var result = await _service.GetDashboardStats();
            return Ok(result.Data);
        }

        [HttpGet("requests")]
        public async Task<IActionResult> GetRequests()
        {
            var result = await _service.GetRequests();
            return Ok(result.Data);
        }
        [HttpGet("technicians/full")]
        public async Task<IActionResult> GetTechniciansFull()
        {
            var result = await _service.GetTechniciansFull();
            return Ok(result.Data);
        }

        [HttpGet("technicians/{id}/reviews")]
        public async Task<IActionResult> GetReviews(Guid id)
        {
            var result = await _service.GetTechnicianReviews(id);
            return Ok(result.Data);
        }

        [HttpPost("technicians")]
        public async Task<IActionResult> CreateTechnician([FromBody] CreateTechnicianDto dto)
        {
            var result = await _service.CreateTechnician(dto);
            return Ok(result.Data);
        }
        // 1. Route GET Summary (Cho trang ServicesPage)
        [HttpGet("services-summary")]
        public async Task<IActionResult> GetSummary()
        {
            var data = await _serviceRepo.GetServicesSummary();
            return Ok(data);
        }

        // 2. Route DELETE theo ID (Tuân thủ theo BE)
        [HttpDelete("services/{id:guid}")] // Chỉ nhận GUID
        public async Task<IActionResult> Delete(Guid id)
        {
            var success = await _serviceRepo.DeleteService(id); // Gọi hàm DeleteService(Guid) cũ của bạn
            if (!success) return BadRequest("Không thể xóa dịch vụ.");
            return Ok(new { message = "Xóa thành công" });
        }

        // 3. Route POST để tạo mới
        [HttpPost("services")]
        public async Task<IActionResult> Create([FromBody] CreateServiceAdminDTO dto)
        {
            var id = await _serviceRepo.AddService(dto);
            if (id == null) return BadRequest("Có lỗi khi tạo dịch vụ.");
            return Ok(new { id, message = "Thêm thành công" });
        }
    }
}