using Capstone_2_BE.DTOs.Technician.Orders;
using Capstone_2_BE.Services.Technician;
using Microsoft.AspNetCore.Mvc;

namespace Capstone_2_BE.Controllers.Technician
{
    [ApiController]
    [Route("api/technician/order")]
    public class TechnicianOrderController : ControllerBase
    {
        private readonly TechnicianOrderService _technicianOrderService;
        private readonly ILogger<TechnicianOrderController> _logger;

        public TechnicianOrderController(TechnicianOrderService technicianOrderService, ILogger<TechnicianOrderController> logger)
        {
            _technicianOrderService = technicianOrderService;
            _logger = logger;
        }

        ///// <summary>
        ///// Lấy tổng quan tất cả đơn hàng của kỹ thuật viên
        ///// </summary>
        //[HttpGet("overview/{technicianId}")]
        //public async Task<IActionResult> GetOrdersOverview(Guid technicianId)
        //{
        //    var result = await _technicianOrderService.GetOrdersOverview(technicianId);
        //    if (!result.IsSuccess)
        //    {
        //        return StatusCode(result.StatusCode, new { message = result.Error });
        //    }
        //    return StatusCode(result.StatusCode, result.Data);
        //}

        /// <summary>
        /// Lấy đơn hàng đang thực hiện
        /// </summary>
        [HttpGet("in-progress/{technicianId}")]
        public async Task<IActionResult> GetInProgressOrder(Guid technicianId)
        {
            var result = await _technicianOrderService.GetInProgressOrder(technicianId);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, result.Data);
        }

        /// <summary>
        /// Lấy danh sách đơn hàng chờ xác nhận
        /// </summary>
        [HttpGet("confirming/{technicianId}")]
        public async Task<IActionResult> GetConfirmingOrders(Guid technicianId)
        {
            var result = await _technicianOrderService.GetConfirmingOrders(technicianId);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, result.Data);
        }

        /// <summary>
        /// Lấy danh sách đơn hàng đã xác nhận
        /// </summary>
        [HttpGet("confirmed/{technicianId}")]
        public async Task<IActionResult> GetConfirmedOrders(Guid technicianId)
        {
            var result = await _technicianOrderService.GetConfirmedOrders(technicianId);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, result.Data);
        }

        /// <summary>
        /// Lấy lịch sử đơn hàng đã hoàn thành
        /// </summary>
        [HttpGet("history/{technicianId}")]
        public async Task<IActionResult> GetHistoryOrders(Guid technicianId)
        {
            var result = await _technicianOrderService.GetHistoryOrders(technicianId);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, result.Data);
        }

        /// <summary>
        /// Lấy danh sách đơn hàng đã hủy
        /// </summary>
        [HttpGet("canceled/{technicianId}")]
        public async Task<IActionResult> GetCanceledOrders(Guid technicianId)
        {
            var result = await _technicianOrderService.GetCanceledOrders(technicianId);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, result.Data);
        }

        /// <summary>
        /// Lấy danh sách đơn bị từ chối (do kỹ thuật viên từ chối)
        /// </summary>
        [HttpGet("rejected/{technicianId}")]
        public async Task<IActionResult> GetRejectedOrders(Guid technicianId)
        {
            var result = await _technicianOrderService.GetRejectedOrders(technicianId);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, result.Data);
        }

        /// <summary>
        /// Xác nhận đơn hàng (Pending Confirmation -> Confirmed)
        /// </summary>
        [HttpPost("confirm")]
        public async Task<IActionResult> ConfirmOrder([FromBody] OrderActionDTO orderActionDTO)
        {
            var result = await _technicianOrderService.ConfirmOrder(orderActionDTO);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, new { message = result.Data });
        }

        /// <summary>
        /// Bắt đầu thực hiện đơn hàng (Confirmed -> In Progress)
        /// </summary>
        [HttpPost("start")]
        public async Task<IActionResult> StartOrder([FromBody] OrderActionDTO orderActionDTO)
        {
            var result = await _technicianOrderService.StartOrder(orderActionDTO);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, new { message = result.Data });
        }

        /// <summary>
        /// Hoàn thành đơn hàng (In Progress -> Completed)
        /// NOTE: CompleteOrder is commented in DAL. Keep commented here for consistency.
        /// </summary>
        [HttpPost("complete/{orderId}")]
        public async Task<IActionResult> CompleteOrder(Guid orderId)
        {
            var result = await _technicianOrderService.CompleteOrder(orderId);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, new { message = result.Data });
        }

        /// <summary>
        /// Hủy đơn hàng (Pending Confirmation -> Refuse)
        /// </summary>
        [HttpPost("reject")]
        public async Task<IActionResult> RejectedOrder([FromBody] OrderActionDTO orderActionDTO)
        {
            var result = await _technicianOrderService.RejectedOrder(orderActionDTO);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, new { message = result.Data });
        }
    }
}
