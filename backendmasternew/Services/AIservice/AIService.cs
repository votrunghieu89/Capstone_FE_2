using Capstone_2_BE.Models;
using Microsoft.EntityFrameworkCore;
using System.Text;
using System.Text.Json;

namespace Capstone_2_BE.Services.AIservice
{
    public class AIService
    {
        private readonly AppDbContext _context;
        private readonly HttpClient _http;
        private readonly IConfiguration _configuration;

        public AIService(AppDbContext context, HttpClient http, IConfiguration configuration)
        {
            _context = context;
            _http = http;
            _configuration = configuration;
        }

        public async Task<object> Chat(Guid accountId, string message)
        {
            try
            {
                var apiKey = _configuration["OpenRouter:ApiKey"];

                if (string.IsNullOrEmpty(apiKey))
                {
                    return new { error = "Missing OpenRouter API Key" };
                }

                // 🔥 Lấy 5 tin nhắn gần nhất
                var history = await _context.ChatBotAIModel
                    .Where(x => x.AccountId == accountId)
                    .OrderByDescending(x => x.CreatedAt)
                    .Take(5)
                    .OrderBy(x => x.CreatedAt)
                    .ToListAsync();

                var messages = new List<object>();

                // 🔥 history
                foreach (var msg in history)
                {
                    messages.Add(new
                    {
                        role = msg.Role,
                        content = msg.Message
                    });
                }

                // 🔥 message mới
                messages.Add(new
                {
                    role = "user",
                    content = "Trả lời bằng tiếng Việt: " + message
                });

                var payload = new
                {
                    model = "openai/gpt-4o-mini",
                    messages = messages
                };

                var json = JsonSerializer.Serialize(payload);

                _http.DefaultRequestHeaders.Clear();
                _http.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");
                _http.DefaultRequestHeaders.Add("HTTP-Referer", "http://localhost");
                _http.DefaultRequestHeaders.Add("X-Title", "CapstoneAI");

                var httpContent = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _http.PostAsync(
                    "https://openrouter.ai/api/v1/chat/completions",
                    httpContent
                );

                var responseBody = await response.Content.ReadAsStringAsync();

                Console.WriteLine("OpenRouter response:");
                Console.WriteLine(responseBody);

                if (!response.IsSuccessStatusCode)
                {
                    return new
                    {
                        error = "OpenRouter error",
                        raw = responseBody
                    };
                }

                using var doc = JsonDocument.Parse(responseBody);

                var reply = doc.RootElement
                    .GetProperty("choices")[0]
                    .GetProperty("message")
                    .GetProperty("content")
                    .GetString();

                // 🔥 save user
                _context.ChatBotAIModel.Add(new ChatBotAIModel
                {
                    Id = Guid.NewGuid(),
                    AccountId = accountId,
                    Message = message,
                    Role = "user",
                    CreatedAt = DateTime.Now
                });

                // 🔥 save AI
                _context.ChatBotAIModel.Add(new ChatBotAIModel
                {
                    Id = Guid.NewGuid(),
                    AccountId = accountId,
                    Message = reply ?? "",
                    Role = "assistant",
                    CreatedAt = DateTime.Now
                });

                await _context.SaveChangesAsync();

                return new { reply };
            }
            catch (Exception ex)
            {
                return new
                {
                    error = "Server crash",
                    detail = ex.Message
                };
            }
        }
    }
}