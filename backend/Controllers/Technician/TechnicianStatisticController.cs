using Capstone_2_BE.Services.Technician;
using Microsoft.AspNetCore.Mvc;

namespace Capstone_2_BE.Controllers.Technician
{
    [ApiController]
    [Route("api/technician/statistic")]
    public class TechnicianStatisticController : ControllerBase
    {
        private readonly TechnicianStatisticService _service;

        public TechnicianStatisticController(TechnicianStatisticService service)
        {
            _service = service;
        }

        [HttpGet("{technicianId}/completed-weekly")]
        public async Task<IActionResult> GetCompletedOrdersByWeek(Guid technicianId, [FromQuery] DateTime from, [FromQuery] DateTime to)
        {
            var result = await _service.GetCompletedOrdersByWeek(technicianId, from, to);
            return result.IsSuccess ? Ok(result.Data) : StatusCode(result.StatusCode, new { message = result.Error });
        }

        [HttpGet("{technicianId}/completed-monthly")]
        public async Task<IActionResult> GetCompletedOrdersByMonth(Guid technicianId, [FromQuery] int year)
        {
            var result = await _service.GetCompletedOrdersByMonth(technicianId, year);
            return result.IsSuccess ? Ok(result.Data) : StatusCode(result.StatusCode, new { message = result.Error });
        }

        [HttpGet("{technicianId}/received-weekly")]
        public async Task<IActionResult> GetReceivedOrdersByWeek(Guid technicianId, [FromQuery] DateTime from, [FromQuery] DateTime to)
        {
            var result = await _service.GetReceivedOrdersByWeek(technicianId, from, to);
            return result.IsSuccess ? Ok(result.Data) : StatusCode(result.StatusCode, new { message = result.Error });
        }

        [HttpGet("{technicianId}/received-monthly")]
        public async Task<IActionResult> GetReceivedOrdersByMonth(Guid technicianId, [FromQuery] int year)
        {
            var result = await _service.GetReceivedOrdersByMonth(technicianId, year);
            return result.IsSuccess ? Ok(result.Data) : StatusCode(result.StatusCode, new { message = result.Error });
        }

        [HttpGet("{technicianId}/ratings")]
        public async Task<IActionResult> GetRatingOverview(Guid technicianId)
        {
            var result = await _service.GetRatingOverview(technicianId);
            return result.IsSuccess ? Ok(result.Data) : StatusCode(result.StatusCode, new { message = result.Error });
        }

        [HttpGet("{technicianId}/canceled/total")]
        public async Task<IActionResult> GetCanceledOrdersTotal(Guid technicianId)
        {
            var result = await _service.GetCanceledOrdersTotal(technicianId);
            return result.IsSuccess ? Ok(result.Data) : StatusCode(result.StatusCode, new { message = result.Error });
        }

        [HttpGet("{technicianId}/canceled/weekly")]
        public async Task<IActionResult> GetCanceledOrdersByWeek(Guid technicianId, [FromQuery] DateTime from, [FromQuery] DateTime to)
        {
            var result = await _service.GetCanceledOrdersByWeek(technicianId, from, to);
            return result.IsSuccess ? Ok(result.Data) : StatusCode(result.StatusCode, new { message = result.Error });
        }

        [HttpGet("{technicianId}/canceled/monthly")]
        public async Task<IActionResult> GetCanceledOrdersByMonth(Guid technicianId, [FromQuery] int year)
        {
            var result = await _service.GetCanceledOrdersByMonth(technicianId, year);
            return result.IsSuccess ? Ok(result.Data) : StatusCode(result.StatusCode, new { message = result.Error });
        }

        [HttpGet("{technicianId}/rejected/total")]
        public async Task<IActionResult> GetRejectedOrdersTotal(Guid technicianId)
        {
            var result = await _service.GetRejectedOrdersTotal(technicianId);
            return result.IsSuccess ? Ok(result.Data) : StatusCode(result.StatusCode, new { message = result.Error });
        }

        [HttpGet("{technicianId}/rejected/weekly")]
        public async Task<IActionResult> GetRejectedOrdersByWeek(Guid technicianId, [FromQuery] DateTime from, [FromQuery] DateTime to)
        {
            var result = await _service.GetRejectedOrdersByWeek(technicianId, from, to);
            return result.IsSuccess ? Ok(result.Data) : StatusCode(result.StatusCode, new { message = result.Error });
        }

        [HttpGet("{technicianId}/rejected/monthly")]
        public async Task<IActionResult> GetRejectedOrdersByMonth(Guid technicianId, [FromQuery] int year)
        {
            var result = await _service.GetRejectedOrdersByMonth(technicianId, year);
            return result.IsSuccess ? Ok(result.Data) : StatusCode(result.StatusCode, new { message = result.Error });
        }

        [HttpGet("{technicianId}/received-today")]
        public async Task<IActionResult> GetTodayReceivedOrders(Guid technicianId)
        {
            var result = await _service.GetTodayReceivedOrders(technicianId);
            return result.IsSuccess ? Ok(result.Data) : StatusCode(result.StatusCode, new { message = result.Error });
        }

        [HttpGet("{technicianId}/completed-today")]
        public async Task<IActionResult> GetTodayCompletedOrders(Guid technicianId)
        {
            var result = await _service.GetTodayCompletedOrders(technicianId);
            return result.IsSuccess ? Ok(result.Data) : StatusCode(result.StatusCode, new { message = result.Error });
        }
    }
}
