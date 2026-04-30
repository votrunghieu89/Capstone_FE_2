using Capstone_2_BE.DTOs.ChatRealTime;
using Capstone_2_BE.Services;
using Microsoft.AspNetCore.Mvc;

namespace Capstone_2_BE.Controllers
{
    [ApiController]
    [Route("api/chat")]
    public class ChatRealTimeController : ControllerBase
    {
        private readonly ChatRealTimeService _chatService;
        private readonly ILogger<ChatRealTimeController> _logger;

        public ChatRealTimeController(ChatRealTimeService chatService, ILogger<ChatRealTimeController> logger)
        {
            _chatService = chatService;
            _logger = logger;
        }

        [HttpPost("mark-read")]
        public async Task<IActionResult> MarkAsRead([FromQuery] Guid roomId, [FromQuery] Guid accountId)
        {
            var result = await _chatService.MarkAsRead(roomId, accountId);
            if (!result.IsSuccess) return StatusCode(result.StatusCode, new { message = result.Error });
            return StatusCode(result.StatusCode, new { message = result.Data });
        }

        [HttpGet("rooms/{accountId}")]
        public async Task<IActionResult> GetAllRooms(Guid accountId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var result = await _chatService.GetAllRooms(accountId, page, pageSize);
            if (!result.IsSuccess) return StatusCode(result.StatusCode, new { message = result.Error });
            return StatusCode(result.StatusCode, result.Data);
        }

        [HttpGet("messages/{roomId}")]
        public async Task<IActionResult> GetAllMessages(Guid roomId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            var result = await _chatService.GetAllMessages(roomId, page, pageSize);
            if (!result.IsSuccess) return StatusCode(result.StatusCode, new { message = result.Error });
            return StatusCode(result.StatusCode, result.Data);
        }

        [HttpPost("room")]
        public async Task<IActionResult> GetOrCreateRoom([FromQuery] Guid userA, [FromQuery] Guid userB)
        {
            var result = await _chatService.GetorCreateRoom(userA, userB);
            if (!result.IsSuccess) return StatusCode(result.StatusCode, new { message = result.Error });
            return StatusCode(result.StatusCode, new { roomId = result.Data });
        }

        [HttpPost("message")]
        public async Task<IActionResult> InsertMessage([FromBody] CreateMessageFormDTO createMessageFormDTO)
        {
            var result = await _chatService.InsertMessage(createMessageFormDTO);
            if (!result.IsSuccess) return StatusCode(result.StatusCode, new { message = result.Error });
            return StatusCode(result.StatusCode, new { message = result.Data });
        }
    }
}
