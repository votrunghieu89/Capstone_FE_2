using Capstone_2_BE.DTOs.City;
using Capstone_2_BE.Services;
using Microsoft.AspNetCore.Mvc;

namespace Capstone_2_BE.Controllers
{
    [ApiController]
    [Route("api/admin/cities")]
    public class CityController : ControllerBase
    {
        private readonly CityService _cityService;
        private readonly ILogger<CityController> _logger;

        public CityController(CityService cityService, ILogger<CityController> logger)
        {
            _cityService = cityService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllCities()
        {
            var result = await _cityService.ViewAllCities();
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, result.Data);
        }

        [HttpPost]
        public async Task<IActionResult> CreateCity([FromBody] CreateCityDTO createCityDTO)
        {
            if (createCityDTO == null || string.IsNullOrWhiteSpace(createCityDTO.CityName))
                return BadRequest(new { message = "CityName is required" });

            var result = await _cityService.CreateCity(createCityDTO);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, new { message = result.Data });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCity(Guid id, [FromBody] CreateCityDTO updateDTO)
        {
            if (updateDTO == null || string.IsNullOrWhiteSpace(updateDTO.CityName))
                return BadRequest(new { message = "CityName is required" });

            var result = await _cityService.UpdateCity(id, updateDTO);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, new { message = result.Data });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCity(Guid id)
        {
            var result = await _cityService.DeleteCity(id);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, new { message = result.Data });
        }
    }
}
