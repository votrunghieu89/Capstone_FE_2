namespace Capstone_2_BE.DTOs.ChatRealTime
{
    public class InsertResDTO
    {
        public Guid MessengerId { get; set; }
        public Guid RoomId { get; set; }
        public Guid SenderId { get; set; }
        public string? Content { get; set; }
        public string? VideoUrl { get; set; }
        public List<string>? ImageUrls { get; set; }
        public string? AvatarUrl { get; set; }
    }
}
