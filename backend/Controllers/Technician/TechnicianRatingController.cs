using Capstone_2_BE.Services.Technician;
using Microsoft.AspNetCore.Mvc;

namespace Capstone_2_BE.Controllers.Technician
{
    [ApiController]
    [Route("api/technician/rating")]
    public class TechnicianRatingController : ControllerBase
    {
        private readonly TechnicianRatingService _technicianRatingService;
        private readonly ILogger<TechnicianRatingController> _logger;

        public TechnicianRatingController(TechnicianRatingService technicianRatingService, ILogger<TechnicianRatingController> logger)
        {
            _technicianRatingService = technicianRatingService;
            _logger = logger;
        }

        /// <summary>
        /// Lấy tổng quan đánh giá của kỹ thuật viên
        /// </summary>
        [HttpGet("overview/{technicianId}")]
        public async Task<IActionResult> GetTechnicianRatingOverview(Guid technicianId)
        {
            var result = await _technicianRatingService.GetTechnicianRatingOverview(technicianId);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, result.Data);
        }

        /// <summary>
        /// Lấy danh sách feedback của kỹ thuật viên
        /// </summary>
        [HttpGet("feedbacks/{technicianId}")]
        public async Task<IActionResult> GetTechnicianFeedbacks(Guid technicianId)
        {
            var result = await _technicianRatingService.GetTechnicianFeedbacks(technicianId);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, result.Data);
        }

        ///// <summary>
        ///// Lấy chi tiết đầy đủ đánh giá của kỹ thuật viên (overview + feedbacks)
        ///// </summary>
        //[HttpGet("detail/{technicianId}")]
        //public async Task<IActionResult> GetTechnicianRatingDetail(Guid technicianId)
        //{
        //    var result = await _technicianRatingService.GetTechnicianRatingDetail(technicianId);
        //    if (!result.IsSuccess)
        //    {
        //        return StatusCode(result.StatusCode, new { message = result.Error });
        //    }
        //    return StatusCode(result.StatusCode, result.Data);
        //}
    }
}
