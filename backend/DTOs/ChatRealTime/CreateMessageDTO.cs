namespace Capstone_2_BE.DTOs.ChatRealTime
{
    public class CreateMessageDTO
    {
        public Guid RoomId {  get; set; }
        public Guid SenderId { get; set; }
        public string? Content { get; set; } 
        public string VideoUrl { get; set; } = string.Empty;
        public List<string> ImageUrls { get; set; } = new List<string>();   
    }
}
