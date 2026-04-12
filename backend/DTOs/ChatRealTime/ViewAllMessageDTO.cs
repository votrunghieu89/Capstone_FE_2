namespace Capstone_2_BE.DTOs.ChatRealTime
{
    public class ViewAllMessageDTO
    {
        public Guid MessengerId { get; set; }
        public string? Content { get; set; }
        public string? videoUrl { get; set; }   
        public List<string> ImageUrls { get; set; } = new List<string>();
        public string? SenderName { get; set; }
        public Guid SenderId { get; set; }
        public string? AvatarUrl { get; set; }
        public DateTime SentTime { get; set; }
    }
}
