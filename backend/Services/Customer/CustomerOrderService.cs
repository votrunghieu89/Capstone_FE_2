using Capstone_2_BE.DTOs.Customer.Order;
using Capstone_2_BE.DTOs.Technician.Orders;
using Capstone_2_BE.DTOs.Notification;
using Capstone_2_BE.Repositories.Customer;
using Capstone_2_BE.Repositories;
using Capstone_2_BE.Socket;
using Capstone_2_BE.Settings;
using Microsoft.AspNetCore.SignalR;

namespace Capstone_2_BE.Services.Customer
{
    public class CustomerOrderService
    {
        private readonly ICustomerOrderRepo _customerOrderRepo;
        private readonly ILogger<CustomerOrderService> _logger;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly INotificationRepo _notificationRepo;
        private readonly AWS _aws;

        public CustomerOrderService(ICustomerOrderRepo customerOrderRepo, ILogger<CustomerOrderService> logger, IHubContext<NotificationHub> hubContext, INotificationRepo notificationRepo, AWS aws)
        {
            _customerOrderRepo = customerOrderRepo;
            _logger = logger;
            _hubContext = hubContext;
            _notificationRepo = notificationRepo;
            _aws = aws;
        }

        public async Task<Result<List<OrderOverviewDTO>>> GetCurrentOrders(Guid customerId)
        {
            try
            {
                var orders = await _customerOrderRepo.GetCurrentOrders(customerId);
                if (orders == null || orders.Count == 0)
                {
                    return Result<List<OrderOverviewDTO>>.Success(new List<OrderOverviewDTO>(), 200);
                }
                return Result<List<OrderOverviewDTO>>.Success(orders, 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting current orders for customer {CustomerId}", customerId);
                return Result<List<OrderOverviewDTO>>.Failure("L?i khi l?y danh sách ??n hi?n t?i", 500);
            }
        }

        public async Task<Result<List<OrderOverviewDTO>>> GetOrderHistory(Guid customerId)
        {
            try
            {
                var orders = await _customerOrderRepo.GetOrderHistory(customerId);
                if (orders == null || orders.Count == 0)
                {
                    return Result<List<OrderOverviewDTO>>.Success(new List<OrderOverviewDTO>(), 200);
                }
                return Result<List<OrderOverviewDTO>>.Success(orders, 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting order history for customer {CustomerId}", customerId);
                return Result<List<OrderOverviewDTO>>.Failure("L?i khi l?y l?ch s? ??n hàng", 500);
            }
        }

        public async Task<Result<List<OrderOverviewDTO>>> GetCancalledOrder(Guid customerId)
        {
            try
            {
                var orders = await _customerOrderRepo.GetCancalledOrder(customerId);
                if (orders == null || orders.Count == 0)
                {
                    return Result<List<OrderOverviewDTO>>.Success(new List<OrderOverviewDTO>(), 200);
                }
                return Result<List<OrderOverviewDTO>>.Success(orders, 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting cancelled orders for customer {CustomerId}", customerId);
                return Result<List<OrderOverviewDTO>>.Failure("L?i khi l?y danh sách ??n ?ã h?y", 500);
            }
        }

        public async Task<Result<List<OrderOverviewDTO>>> GetRejectedOrder(Guid customerId)
        {
            try
            {
                var orders = await _customerOrderRepo.GetRejectedOrder(customerId);
                if (orders == null || orders.Count == 0)
                {
                    return Result<List<OrderOverviewDTO>>.Success(new List<OrderOverviewDTO>(), 200);
                }
                return Result<List<OrderOverviewDTO>>.Success(orders, 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting rejected orders for customer {CustomerId}", customerId);
                return Result<List<OrderOverviewDTO>>.Failure("L?i khi l?y danh sách ??n b? t? ch?i", 500);
            }
        }

        public async Task<Result<string>> CancelOrder(OrderActionDTO orderActionDTO)
        {
            try
            {
                var result = await _customerOrderRepo.CancelOrder(orderActionDTO);
                if (result != null)
                {
                    // send notification to technician
                    var newNotification = new InsertNewNotificationDTO
                    {
                        SenderId = result.SenderId,
                        ReceiverId = result.ReceiverId,
                        Message = "Khách hàng ?ã h?y ??n hàng c?a b?n.",
                        CratedAt = result.CreatedAt
                    };

                    var isInsert = await _notificationRepo.InsertNewNotification(newNotification);
                    if (isInsert)
                    {
                        await _hubContext.Clients.User(result.ReceiverId.ToString()).SendAsync("ReceiveNotification", newNotification);
                        return Result<string>.Success("H?y ??n hàng thành công", 200);
                    }

                    return Result<string>.Failure("Không th? h?y ??n hàng. L?i h? th?ng", 400);
                }
                return Result<string>.Failure("Không th? h?y ??n hàng", 400);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cancelling order {OrderId}", orderActionDTO.OrderId);
                return Result<string>.Failure("L?i khi h?y ??n hàng", 500);
            }
        }

        public async Task<Result<string>> ConfirmCompletedOrder(OrderActionDTO orderActionDTO)
        {
            try
            {
                var result = await _customerOrderRepo.ConfirmCompletedOrder(orderActionDTO);
                if (result != null)
                {
                    var newNotification = new InsertNewNotificationDTO
                    {
                        SenderId = result.SenderId,
                        ReceiverId = result.ReceiverId,
                        Message = "Khách hàng ?ã xác nh?n hoàn thành ??n hàng.",
                        CratedAt = result.CreatedAt
                    };

                    var isInsert = await _notificationRepo.InsertNewNotification(newNotification);
                    if (isInsert)
                    {
                        await _hubContext.Clients.User(result.ReceiverId.ToString()).SendAsync("ReceiveNotification", newNotification);
                        return Result<string>.Success("Xác nh?n hoàn thành ??n hàng thành công", 200);
                    }

                    return Result<string>.Failure("Không th? xác nh?n ??n hàng. L?i h? th?ng", 400);
                }
                return Result<string>.Failure("Không th? xác nh?n ??n hàng", 400);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error confirming completed order {OrderId}", orderActionDTO.OrderId);
                return Result<string>.Failure("L?i khi xác nh?n hoàn thành ??n hàng", 500);
            }
        }

        public async Task<Result<bool>> InsertOrder(CreateOrderDTO createOrderDTO)
        {
            try
            {
                var dalDto = new CreateOrderDALDTO
                {
                    CustomerId = createOrderDTO.CustomerId,
                    TechnicianId = createOrderDTO.TechnicianId,
                    ServiceId = createOrderDTO.ServiceId,
                    Title = createOrderDTO.Title,
                    Description = createOrderDTO.Description,
                    Address = createOrderDTO.Address,
                    CityId = createOrderDTO.City,
                    Latitude = createOrderDTO.Latitude,
                    Longitude = createOrderDTO.Longitude,
                    videoUrl = createOrderDTO.VideoFileName,
                    ImageOrderUrl = createOrderDTO.ImageFileNames
                };

                var ok = await _customerOrderRepo.InsertOrder(dalDto);
                if (ok) return Result<bool>.Success(true, 200);
                return Result<bool>.Failure("??t ??n hàng th?t b?i", 400);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inserting order for customer {CustomerId}", createOrderDTO.CustomerId);
                return Result<bool>.Failure("L?i khi ??t ??n hàng", 500);
            }
        }

        public async Task<Result<bool>> InsertOrder(CreateOrderFormDTO form)
        {
            try
            {
                var dalDto = new CreateOrderDALDTO
                {
                    CustomerId = form.CustomerId,
                    TechnicianId = form.TechnicianId,
                    ServiceId = form.ServiceId,
                    Title = form.Title,
                    Description = form.Description,
                    Address = form.Address,
                    CityId = form.CityId,
                    Latitude = form.Latitude,
                    Longitude = form.Longitude,
                    ImageOrderUrl = new List<string>(),
                    videoUrl = string.Empty
                };

                // Upload video if present
                if (form.VideoFile != null)
                {
                    var videoKey = await _aws.UploadVideoOrder(form.VideoFile);
                    if (string.IsNullOrEmpty(videoKey))
                    {
                        return Result<bool>.Failure("Upload video th?t b?i", 400);
                    }
                    dalDto.videoUrl = videoKey;
                }

                // Upload images
                if (form.ImageFiles != null && form.ImageFiles.Count > 0)
                {
                    foreach (var file in form.ImageFiles)
                    {
                        var key = await _aws.UploadImageOrder(file);
                        if (!string.IsNullOrEmpty(key))
                        {
                            dalDto.ImageOrderUrl.Add(key);
                        }
                    }
                }

                var ok = await _customerOrderRepo.InsertOrder(dalDto);
                if (ok) return Result<bool>.Success(true, 200);
                return Result<bool>.Failure("??t ??n hàng th?t b?i", 400);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inserting order for customer {CustomerId}", form.CustomerId);
                return Result<bool>.Failure("L?i khi ??t ??n hàng", 500);
            }
        }

        public async Task<Result<OrderDetailDTO>> GetOrderDetail(Guid orderId)
        {
            try
            {
                var order = await _customerOrderRepo.GetOrderDetail(orderId);
                if (order.videoUrl != null)
                {
                    order.videoUrl = await _aws.ReadImage(order.videoUrl);
                }
                if (order.ImageUrls != null && order.ImageUrls.Count > 0)
                {
                    var imageUrls = new List<string>();
                    foreach (var url in order.ImageUrls)
                    {
                        var imageUrl = await _aws.ReadImage(url);
                        if (!string.IsNullOrEmpty(imageUrl))
                        {
                            imageUrls.Add(imageUrl);
                        }
                    }
                    order.ImageUrls = imageUrls;
                }
                if (order == null)
                {
                    return Result<OrderDetailDTO>.Failure("Không tìm thấy đơn hàng", 404);
                }
                return Result<OrderDetailDTO>.Success(order, 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting order detail for order {OrderId}", orderId);
                return Result<OrderDetailDTO>.Failure("Lỗi khi lấy chi tiết đơn hàng", 500);
            }
        }

        public async Task<Result<string>> UpdateOrder(OrderUpdateFormDTO OrderUpdateFormDTO)
        {

            try
            {
                UpdateOrderDALDTO updateDTO = new UpdateOrderDALDTO
                {   OrderId = OrderUpdateFormDTO.OrderId,
                    Title = OrderUpdateFormDTO.Title,
                    Description = OrderUpdateFormDTO.Description,
                    Address = OrderUpdateFormDTO.Address,
                    CityId = OrderUpdateFormDTO.CityId,
                    Latitude = OrderUpdateFormDTO.Latitude,
                    Longitude = OrderUpdateFormDTO.Longitude,
                    videoUrl = null,
                    ImageUrls = new List<string>()
                };
                // Upload song song ( chỗ when all là chạy nhiều task cùng lúc, có thêm await nên phải đợi hoàn thành hết rồi mới tiếp tục, nếu có task nào lỗi thì sẽ vào catch luôn)
                Task<string> videoTask = null; // “Một công việc bất đồng bộ (async) mà khi xong sẽ trả về string" 1 công việc sẽ có kq trong tương lai, 1 biến đặc biệt có trạng thái(fail, success) và khi có kq thì gán vào videoTask
                if (OrderUpdateFormDTO.videoUrl != null)
                {
                    videoTask = _aws.UploadVideoOrder(OrderUpdateFormDTO.videoUrl);
                }
                Task<string[]> imageTask = null;
                if (OrderUpdateFormDTO.ImageUrls != null && OrderUpdateFormDTO.ImageUrls.Count > 0)
                {
                    imageTask = Task.WhenAll(OrderUpdateFormDTO.ImageUrls.Select(img => _aws.UploadImageOrder(img))); // chạy tất cả các task upload ảnh cùng lúc, khi nào xong hết sẽ trả về mảng string chứa key của ảnh, nếu có task nào lỗi thì sẽ vào catch luôn
                }
                await Task.WhenAll(videoTask ?? Task.CompletedTask,imageTask ?? Task.CompletedTask); // đợi 2 công việc chạy xong ms chạy tiếp
                string? videoKey = videoTask?.Result;
                string[]? imageKeys = imageTask?.Result;
                if (videoTask != null && string.IsNullOrEmpty(videoKey))
                {
                    // cleanup images nếu có
                    if (imageKeys != null)
                    {
                        foreach (var key in imageKeys.Where(x => !string.IsNullOrEmpty(x)))
                        {
                            await _aws.DeleteImage(key);
                        }
                    }
                    return Result<string>.Failure("Upload video thất bại", 400);
                }
                if (imageKeys != null && imageKeys.Any(x => string.IsNullOrEmpty(x)))
                {
                    foreach (var key in imageKeys.Where(x => !string.IsNullOrEmpty(x)))
                    {
                        await _aws.DeleteImage(key);
                    }

                    if (!string.IsNullOrEmpty(videoKey))
                    {
                        await _aws.DeleteImage(videoKey);
                    }

                    return Result<string>.Failure("Upload ảnh thất bại", 400);
                }
                if(videoKey != null)
                {
                    updateDTO.videoUrl = videoKey;
                }

                if (imageKeys != null)
                {
                   foreach(var key in imageKeys)
                    {
                        if(!string.IsNullOrEmpty(key))
                        {
                            updateDTO.ImageUrls.Add(key);
                        }
                    }
                }
                var result = await _customerOrderRepo.updateOrder(updateDTO);
                if(result != null)
                {
                   Task<bool>? TDeleteOldVideo = null;
                   Task<bool[]>? TDeleteOldImages = null;
                   if (result.VideoUrl != null)
                   {
                        TDeleteOldVideo = _aws.DeleteImage(result.VideoUrl);
                   }
                   if (result.ImageUrls != null && result.ImageUrls.Count > 0)
                   {
                        TDeleteOldImages = Task.WhenAll(result.ImageUrls.Select(img => _aws.DeleteImage(img)));
                   }
                   await Task.WhenAll(TDeleteOldVideo ?? Task.CompletedTask, TDeleteOldImages ?? Task.CompletedTask);
                   bool isDeleteOldVideo = TDeleteOldVideo != null && await TDeleteOldVideo;
                   bool[] isDeleteOldImages = TDeleteOldImages != null
                        ? await TDeleteOldImages
                        : Array.Empty<bool>();
                   if (TDeleteOldVideo != null && !isDeleteOldVideo)
                   {
                        _logger.LogWarning("Delete old video failed: {Video}", result.VideoUrl);
                        return Result<string>.Failure("Cập nhật đơn hàng thất bại do lỗi xóa video cũ", 400);
                    }
                   if (isDeleteOldImages.Any(x => x == false))
                   {
                        _logger.LogWarning("Some old images failed to delete");
                        return Result<string>.Failure("Cập nhật đơn hàng thất bại do lỗi xóa ảnh cũ", 400);
                    }
                    return Result<string>.Success("Cập nhật đơn hàng thành công", 200);
                }
                else
                {
                    Task<bool>? deleteNewVideoTask = null;
                    Task<bool[]>? deleteNewImagesTask = null;
                    if (!string.IsNullOrEmpty(updateDTO.videoUrl))
                    {
                        deleteNewVideoTask = _aws.DeleteImage(updateDTO.videoUrl);
                    }
                    if (updateDTO.ImageUrls != null && updateDTO.ImageUrls.Count > 0)
                    {
                        deleteNewImagesTask = Task.WhenAll(
                            updateDTO.ImageUrls.Select(img => _aws.DeleteImage(img))
                        );
                    }
                    await Task.WhenAll(
                        deleteNewVideoTask ?? Task.CompletedTask,
                        deleteNewImagesTask ?? Task.CompletedTask
                    );
                    bool isDeleteVideo = deleteNewVideoTask != null && await deleteNewVideoTask;

                    bool[] isDeleteImages = deleteNewImagesTask != null
                        ? await deleteNewImagesTask
                        : Array.Empty<bool>(); 
                    if (deleteNewVideoTask != null && !isDeleteVideo)
                    {
                        _logger.LogWarning("Failed to delete new video: {Video}", updateDTO.videoUrl);
                    }
                    if (isDeleteImages.Any(x => x == false))
                    {
                        _logger.LogWarning("Some new images failed to delete");
                    }

                    return Result<string>.Failure("Cập nhật đơn hàng thất bại", 400);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating order for order {OrderId}", OrderUpdateFormDTO.OrderId);
                return Result<string>.Failure("Lỗi khi cập nhật", 500);
            }
        }
    }
}
