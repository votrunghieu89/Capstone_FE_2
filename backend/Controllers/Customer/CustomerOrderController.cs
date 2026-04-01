using Capstone_2_BE.DTOs.Customer.Order;
using Capstone_2_BE.DTOs.Technician.Orders;
using Capstone_2_BE.Services.Customer;
using Microsoft.AspNetCore.Mvc;

namespace Capstone_2_BE.Controllers.Customer
{
    [ApiController]
    [Route("api/customer/order")]
    public class CustomerOrderController : ControllerBase
    {
        private readonly CustomerOrderService _customerOrderService;
        private readonly ILogger<CustomerOrderController> _logger;

        public CustomerOrderController(CustomerOrderService customerOrderService, ILogger<CustomerOrderController> logger)
        {
            _customerOrderService = customerOrderService;
            _logger = logger;
        }

        [HttpGet("current/{customerId}")]
        public async Task<IActionResult> GetCurrentOrders(Guid customerId)
        {
            var result = await _customerOrderService.GetCurrentOrders(customerId);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, result.Data);
        }

        [HttpGet("history/{customerId}")]
        public async Task<IActionResult> GetOrderHistory(Guid customerId)
        {
            var result = await _customerOrderService.GetOrderHistory(customerId);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, result.Data);
        }

        [HttpGet("canceled/{customerId}")]
        public async Task<IActionResult> GetCancalledOrder(Guid customerId)
        {
            var result = await _customerOrderService.GetCancalledOrder(customerId);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, result.Data);
        }

        [HttpGet("rejected/{customerId}")]
        public async Task<IActionResult> GetRejectedOrder(Guid customerId)
        {
            var result = await _customerOrderService.GetRejectedOrder(customerId);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, result.Data);
        }

        [HttpPost("cancel")]
        public async Task<IActionResult> CancelOrder([FromBody] OrderActionDTO orderActionDTO)
        {
            var result = await _customerOrderService.CancelOrder(orderActionDTO);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, new { message = result.Data });
        }

        [HttpPost("confirm-complete")]
        public async Task<IActionResult> ConfirmCompletedOrder([FromBody] OrderActionDTO orderActionDTO)
        {
            var result = await _customerOrderService.ConfirmCompletedOrder(orderActionDTO);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, new { message = result.Data });
        }

        //[HttpPost("place")]
        //[Consumes("multipart/form-data")]
        //public async Task<IActionResult> PlaceOrder([FromForm] CreateOrderFormDTO createOrderFormDTO)
        //{
        //    var result = await _customerOrderService.InsertOrder(createOrderFormDTO);
        //    if (!result.IsSuccess)
        //    {
        //        return StatusCode(result.StatusCode, new { message = result.Error });
        //    }
        //    return StatusCode(result.StatusCode, new { message = "??t ??n hàng thành công" });
        //}

        [HttpGet("detail/{orderId}")]
        public async Task<IActionResult> GetOrderDetail(Guid orderId)
        {
            var result = await _customerOrderService.GetOrderDetail(orderId);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, result.Data);
        }

        [HttpPut("update")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UpdateOrder([FromBody] OrderUpdateFormDTO updateOrderDTO)
        {
            var result = await _customerOrderService.UpdateOrder(updateOrderDTO);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, new { message = result.Data });
        }
    }
}
