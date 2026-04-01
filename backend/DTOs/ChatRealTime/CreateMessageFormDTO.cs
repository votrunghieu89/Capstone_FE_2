namespace Capstone_2_BE.DTOs.ChatRealTime
{
    public class CreateMessageFormDTO
    {
        public Guid SenderId { get; set; }
        public Guid ReceiverId { get; set; }
        public string? Content { get; set; }
    }
}
