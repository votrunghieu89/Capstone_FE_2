using Capstone_2_BE.DTOs.Notification;

namespace Capstone_2_BE.Repositories
{
    public interface INotificationRepo
    {
        Task<bool> Mark(Guid notificationId);
        Task<bool> UnMark(Guid notificationId);
        Task<bool> MarkAll(Guid accountId);
        Task<bool> UnMarkAll(Guid accountId);
        Task<bool> InsertNewNotification(InsertNewNotificationDTO insertNewNotificationDTO);
        Task<List<GetNotificationDTO>> GetAllNotifications(Guid accountId);
        Task<bool> DeleteNotification();
    }
}
