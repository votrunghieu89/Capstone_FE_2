namespace Capstone_2_BE.DTOs.ChatRealTime
{
    public class CreateMessageFormDTO
    {
        public Guid SenderId { get; set; }
        public Guid ReceiverId { get; set; }
        public string? Content { get; set; }
        public IFormFile? VideoUrl { get; set; }
        public List<IFormFile>? ImageUrls { get; set; }
    }
}
