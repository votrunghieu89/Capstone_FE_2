using Capstone_2_BE.DTOs.Notification;
using Capstone_2_BE.Repositories;

namespace Capstone_2_BE.Services
{
    public class NotificationService
    {
        private readonly INotificationRepo _notificationRepo;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(INotificationRepo notificationRepo, ILogger<NotificationService> logger)
        {
            _notificationRepo = notificationRepo;
            _logger = logger;
        }

        public async Task<Result<List<GetNotificationDTO>>> GetAllNotifications(Guid accountId)
        {
            try
            {
                var list = await _notificationRepo.GetAllNotifications(accountId);
                if (list == null || list.Count == 0)
                {
                    return Result<List<GetNotificationDTO>>.Success(new List<GetNotificationDTO>(), 200);
                }
                return Result<List<GetNotificationDTO>>.Success(list, 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting notifications for account {AccountId}", accountId);
                return Result<List<GetNotificationDTO>>.Failure("L?i khi l?y thông báo", 500);
            }
        }

        public async Task<Result<string>> Mark(Guid notificationId)
        {
            try
            {
                var ok = await _notificationRepo.Mark(notificationId);
                if (ok) return Result<string>.Success("?ánh d?u thông báo thành ?ã ??c", 200);
                return Result<string>.Failure("Không tìm th?y thông báo", 404);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking notification {NotificationId}", notificationId);
                return Result<string>.Failure("L?i khi ?ánh d?u thông báo", 500);
            }
        }

        public async Task<Result<string>> UnMark(Guid notificationId)
        {
            try
            {
                var ok = await _notificationRepo.UnMark(notificationId);
                if (ok) return Result<string>.Success("?ánh d?u thông báo thành ch?a ??c", 200);
                return Result<string>.Failure("Không tìm th?y thông báo", 404);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error unmarking notification {NotificationId}", notificationId);
                return Result<string>.Failure("L?i khi b? ?ánh d?u thông báo", 500);
            }
        }

        public async Task<Result<string>> MarkAll(Guid accountId)
        {
            try
            {
                var ok = await _notificationRepo.MarkAll(accountId);
                if (ok) return Result<string>.Success("?ã ?ánh d?u t?t c? thông báo là ?ã ??c", 200);
                return Result<string>.Failure("Không th? ?ánh d?u t?t c?", 400);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking all notifications for account {AccountId}", accountId);
                return Result<string>.Failure("L?i khi ?ánh d?u t?t c? thông báo", 500);
            }
        }

        public async Task<Result<string>> UnMarkAll(Guid accountId)
        {
            try
            {
                var ok = await _notificationRepo.UnMarkAll(accountId);
                if (ok) return Result<string>.Success("?ã b? ?ánh d?u t?t c? thông báo", 200);
                return Result<string>.Failure("Không th? b? ?ánh d?u t?t c?", 400);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error unmarking all notifications for account {AccountId}", accountId);
                return Result<string>.Failure("L?i khi b? ?ánh d?u t?t c? thông báo", 500);
            }
        }

        public async Task<Result<string>> DeleteOldReadNotifications()
        {
            try
            {
                var ok = await _notificationRepo.DeleteNotification();
                if (ok) return Result<string>.Success("Xoá thông báo c? thành công", 200);
                return Result<string>.Failure("Xoá thông báo th?t b?i", 400);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting old notifications");
                return Result<string>.Failure("L?i khi xoá thông báo", 500);
            }
        }
    }
}
