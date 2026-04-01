using Capstone_2_BE.DTOs.Notification;
using Capstone_2_BE.Models;
using Capstone_2_BE.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Capstone_2_BE.DTOs
{
    public class NotificationDAL : INotificationRepo
    {
        private readonly AppDbContext _context;
        private readonly ILogger<NotificationDAL> _logger;

        public NotificationDAL(AppDbContext context, ILogger<NotificationDAL> logger)
        {
            _context = context;
            _logger = logger;
        }

        // Delete notifications that are marked read (IsRead == 1) and older than 48 hours
        public async Task<bool> DeleteNotification()
        {
            try
            {
                var cutoff = DateTime.Now.AddHours(-48);
                int deleted = await _context.NotificationsModel
                    .Where(n => n.IsRead == 1 && n.CreateAt < cutoff)
                    .ExecuteDeleteAsync();

                // Return true if operation succeeded (even if zero rows deleted)
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting old read notifications");
                return false;
            }
        }

        public async Task<List<GetNotificationDTO>> GetAllNotifications(Guid accountId)
        {
            try
            {
                var list = await _context.NotificationsModel
                    .Where(n => n.ReceiverId == accountId)
                    .OrderByDescending(n => n.CreateAt)
                    .Select(n => new GetNotificationDTO
                    {
                        NotificationId = n.Id,
                        SenderId = n.SenderId,
                        Message = n.Message,
                        IsRead = n.IsRead == 1,
                        CreateAt = n.CreateAt
                    })
                    .ToListAsync();

                return list ?? new List<GetNotificationDTO>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting notifications for account {AccountId}", accountId);
                return new List<GetNotificationDTO>();
            }
        }

        public async Task<bool> InsertNewNotification(InsertNewNotificationDTO insertNewNotificationDTO)
        {
            try
            {
                var model = new NotificationsModel
                {
                    SenderId = insertNewNotificationDTO.SenderId,
                    ReceiverId = insertNewNotificationDTO.ReceiverId,
                    Message = insertNewNotificationDTO.Message,
                    IsRead = 0,
                    CreateAt =insertNewNotificationDTO.CratedAt,
                };

                await _context.NotificationsModel.AddAsync(model);
                var saved = await _context.SaveChangesAsync();
                return saved > 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inserting new notification");
                return false;
            }
        }

        public async Task<bool> Mark(Guid notificationId)
        {
            try
            {
                int updated = await _context.NotificationsModel
                    .Where(n => n.Id == notificationId)
                    .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, 1));

                return updated > 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking notification {NotificationId}", notificationId);
                return false;
            }
        }

        public async Task<bool> MarkAll(Guid accountId)
        {
            try
            {
                int updated = await _context.NotificationsModel
                    .Where(n => n.ReceiverId == accountId)
                    .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, 1));

                return updated >= 0; // return true even if zero rows affected
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking all notifications for account {AccountId}", accountId);
                return false;
            }
        }

        public async Task<bool> UnMark(Guid notificationId)
        {
            try
            {
                int updated = await _context.NotificationsModel
                    .Where(n => n.Id == notificationId)
                    .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, 0));

                return updated > 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error unmarking notification {NotificationId}", notificationId);
                return false;
            }
        }

        public async Task<bool> UnMarkAll(Guid accountId)
        {
            try
            {
                int updated = await _context.NotificationsModel
                    .Where(n => n.ReceiverId == accountId)
                    .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, 0));

                return updated >= 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error unmarking all notifications for account {AccountId}", accountId);
                return false;
            }
        }
    }
}
