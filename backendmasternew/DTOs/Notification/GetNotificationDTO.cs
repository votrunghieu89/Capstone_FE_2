namespace Capstone_2_BE.DTOs.Notification
{
    public class GetNotificationDTO
    {
        public Guid NotificationId { get; set; }
        public Guid SenderId { get; set; }
        public string Message { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreateAt { get; set; }
    }
}
