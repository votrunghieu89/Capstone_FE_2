using Capstone_2_BE.Services.AIservice;
using Microsoft.AspNetCore.Mvc;

[Route("api/ai")]
[ApiController]
public class AIController : ControllerBase
{
    private readonly AIService _aiService;

    public AIController(AIService aiService)
    {
        _aiService = aiService;
    }

    [HttpPost("chat")]
    public async Task<IActionResult> Chat([FromBody] ChatRequest req)
    {
        var result = await _aiService.Chat(req.AccountId, req.Message);
        return Ok(result);
    }
}