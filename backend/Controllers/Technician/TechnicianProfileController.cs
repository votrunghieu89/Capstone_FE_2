using Capstone_2_BE.DTOs.Technician.Profile;
using Capstone_2_BE.Services.Technician;
using Microsoft.AspNetCore.Mvc;

namespace Capstone_2_BE.Controllers.Technician
{
    [ApiController]
    [Route("api/technician/profile")]
    public class TechnicianProfileController : ControllerBase
    {
        private readonly TechnicianProfileService _technicianProfileService;
        private readonly ILogger<TechnicianProfileController> _logger;

        public TechnicianProfileController(TechnicianProfileService technicianProfileService, ILogger<TechnicianProfileController> logger)
        {
            _technicianProfileService = technicianProfileService;
            _logger = logger;
        }

        [HttpGet("{technicianId}")]
        public async Task<IActionResult> GetTechnicianProfile(Guid technicianId)
        {
            var result = await _technicianProfileService.GetTechnicianProfile(technicianId);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, result.Data);
        }

        [HttpPut]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UpdateTechnicianProfile([FromForm] TechnicianProfileUpdateDTO updateDTO)
        {
            var result = await _technicianProfileService.UpdateTechnicianProfile(updateDTO);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, new { message = result.Data });
        }
    }
}
