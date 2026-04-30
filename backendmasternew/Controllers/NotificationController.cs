using Capstone_2_BE.DTOs.Notification;
using Capstone_2_BE.Services;
using Microsoft.AspNetCore.Mvc;

namespace Capstone_2_BE.Controllers
{
    [ApiController]
    [Route("api/notification")]
    public class NotificationController : ControllerBase
    {
        private readonly NotificationService _notificationService;
        private readonly ILogger<NotificationController> _logger;

        public NotificationController(NotificationService notificationService, ILogger<NotificationController> logger)
        {
            _notificationService = notificationService;
            _logger = logger;
        }

        [HttpGet("{accountId}")]
        public async Task<IActionResult> GetAllNotifications(Guid accountId)
        {
            var result = await _notificationService.GetAllNotifications(accountId);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, result.Data);
        }

        [HttpPost("mark/{notificationId}")]
        public async Task<IActionResult> Mark(Guid notificationId)
        {
            var result = await _notificationService.Mark(notificationId);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, new { message = result.Data });
        }

        [HttpPost("unmark/{notificationId}")]
        public async Task<IActionResult> UnMark(Guid notificationId)
        {
            var result = await _notificationService.UnMark(notificationId);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, new { message = result.Data });
        }

        [HttpPost("mark-all/{accountId}")]
        public async Task<IActionResult> MarkAll(Guid accountId)
        {
            var result = await _notificationService.MarkAll(accountId);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, new { message = result.Data });
        }

        [HttpPost("unmark-all/{accountId}")]
        public async Task<IActionResult> UnMarkAll(Guid accountId)
        {
            var result = await _notificationService.UnMarkAll(accountId);
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, new { message = result.Data });
        }

        [HttpDelete("delete-old-read")]
        public async Task<IActionResult> DeleteOldReadNotifications()
        {
            var result = await _notificationService.DeleteOldReadNotifications();
            if (!result.IsSuccess)
            {
                return StatusCode(result.StatusCode, new { message = result.Error });
            }
            return StatusCode(result.StatusCode, new { message = result.Data });
        }
    }
}
