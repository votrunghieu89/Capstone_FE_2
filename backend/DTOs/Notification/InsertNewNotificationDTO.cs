namespace Capstone_2_BE.DTOs.Notification
{
    public class InsertNewNotificationDTO
    {
        public Guid SenderId { get; set; }
        public Guid ReceiverId { get; set; }
        public string Message { get; set; }
        public DateTime CratedAt { get; set; }

    }
}
