namespace Capstone_2_BE.DTOs.ChatRealTime
{
    public class ViewAllRoomDTO
    {
        public Guid RoomId { get; set; }
        public Guid OtherId { get; set; }
        public string? UserName { get; set; }
        public string? AvatarUrl { get; set; }
        public string? LastMessage { get; set; }
        public DateTime LastMessageTime { get; set; }
    }
}
