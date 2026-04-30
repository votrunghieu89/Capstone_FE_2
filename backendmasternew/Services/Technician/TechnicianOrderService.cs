using Capstone_2_BE.DTOs;
using Capstone_2_BE.DTOs.Customer.Order;
using Capstone_2_BE.DTOs.Notification;
using Capstone_2_BE.DTOs.Technician.Orders;
using Capstone_2_BE.Repositories;
using Capstone_2_BE.Repositories.Customer;
using Capstone_2_BE.Settings;
using Capstone_2_BE.Socket;
using Microsoft.AspNetCore.SignalR;

namespace Capstone_2_BE.Services.Technician
{
    public class TechnicianOrderService
    {
        private readonly ITechnicianOrderRepo _technicianOrderRepo;
        private readonly ILogger<TechnicianOrderService> _logger;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly INotificationRepo _notificationRepo;
        private readonly AWS _aws;

        public TechnicianOrderService(ITechnicianOrderRepo technicianOrderRepo, ILogger<TechnicianOrderService> logger, IHubContext<NotificationHub> hubContext, INotificationRepo notificationRepo, AWS aws)
        {
            _technicianOrderRepo = technicianOrderRepo;
            _logger = logger;
            _hubContext = hubContext;
            _notificationRepo = notificationRepo;
            _aws = aws;
        }
        /// <summary>
        /// Lấy đơn hàng đang thực hiện
        /// </summary>
        public async Task<Result<ViewOrderDTO>> GetInProgressOrder(Guid technicianId)
        {
            try
            {
                var order = await _technicianOrderRepo.GetInProgressOrders(technicianId);
                
                if (order == null)
                {
                    return Result<ViewOrderDTO>.Failure("Không có đơn hàng đang thực hiện", 404);
                }

                return Result<ViewOrderDTO>.Success(order, 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting in-progress order for technician ID: {TechnicianId}", technicianId);
                return Result<ViewOrderDTO>.Failure("Lỗi khi lấy đơn hàng đang thực hiện", 500);
            }
        }

        /// <summary>
        /// Lấy danh sách đơn hàng chờ xác nhận
        /// </summary>
        public async Task<Result<List<ViewOrderDTO>>> GetConfirmingOrders(Guid technicianId)
        {
            try
            {
                var orders = await _technicianOrderRepo.GetConfirmingOrders(technicianId);
                if (orders == null || orders.Count == 0)
                {
                    return Result<List<ViewOrderDTO>>.Success(new List<ViewOrderDTO>(), 200);
                }
                return Result<List<ViewOrderDTO>>.Success(orders, 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting confirming orders for technician ID: {TechnicianId}", technicianId);
                return Result<List<ViewOrderDTO>>.Failure("Lỗi khi lấy danh sách đơn hàng chờ xác nhận", 500);
            }
        }

        /// <summary>
        /// Lấy danh sách đơn hàng đã xác nhận
        /// </summary>
        public async Task<Result<List<ViewOrderDTO>>> GetConfirmedOrders(Guid technicianId)
        {
            try
            {
                var orders = await _technicianOrderRepo.GetConfirmedOrders(technicianId);
                if (orders == null || orders.Count == 0)
                {
                    return Result<List<ViewOrderDTO>>.Success(new List<ViewOrderDTO>(), 200);
                }
                return Result<List<ViewOrderDTO>>.Success(orders, 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting confirmed orders for technician ID: {TechnicianId}", technicianId);
                return Result<List<ViewOrderDTO>>.Failure("Lỗi khi lấy danh sách đơn hàng đã xác nhận", 500);
            }
        }

        /// <summary>
        /// Lấy lịch sử đơn hàng đã hoàn thành
        /// </summary>
        public async Task<Result<List<ViewOrderDTO>>> GetHistoryOrders(Guid technicianId)
        {
            try
            {
                var orders = await _technicianOrderRepo.GetHistoryOrders(technicianId);
                if (orders == null || orders.Count == 0)
                {
                    return Result<List<ViewOrderDTO>>.Success(new List<ViewOrderDTO>(), 200);
                }
                return Result<List<ViewOrderDTO>>.Success(orders, 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting history orders for technician ID: {TechnicianId}", technicianId);
                return Result<List<ViewOrderDTO>>.Failure("Lỗi khi lấy lịch sử đơn hàng", 500);
            }
        }

        /// <summary>
        /// Lấy danh sách đơn hàng đã hủy
        /// </summary>
        public async Task<Result<List<ViewOrderDTO>>> GetCanceledOrders(Guid technicianId)
        {
            try
            {
                var orders = await _technicianOrderRepo.GetCanceledOrders(technicianId);
                if (orders == null || orders.Count == 0)
                {
                    return Result<List<ViewOrderDTO>>.Success(new List<ViewOrderDTO>(), 200);
                }
                return Result<List<ViewOrderDTO>>.Success(orders, 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting canceled orders for technician ID: {TechnicianId}", technicianId);
                return Result<List<ViewOrderDTO>>.Failure("Lỗi khi lấy danh sách đơn hàng đã hủy", 500);
            }
        }

        /// <summary>
        /// Lấy danh sách đơn bị từ chối (do kỹ thuật viên từ chối)
        /// </summary>
        public async Task<Result<List<ViewOrderDTO>>> GetRejectedOrders(Guid technicianId)
        {
            try
            {
                var orders = await _technicianOrderRepo.GetRejectedOrders(technicianId);

                if (orders == null || orders.Count == 0)
                {
                    return Result<List<ViewOrderDTO>>.Success(new List<ViewOrderDTO>(), 200);
                }

                return Result<List<ViewOrderDTO>>.Success(orders, 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting rejected orders for technician ID: {TechnicianId}", technicianId);
                return Result<List<ViewOrderDTO>>.Failure("Lỗi khi lấy danh sách đơn bị từ chối", 500);
            }
        }

        /// <summary>
        /// Xác nhận đơn hàng (Pending Confirmation -> Confirmed)
        /// </summary>
        public async Task<Result<OrderActionResDTO>> ConfirmOrder(OrderActionDTO orderActionDTO)
        {
            try
            {
                OrderActionResDTO result = await _technicianOrderRepo.ConfirmOrder(orderActionDTO.OrderId, orderActionDTO.technicianId);

                if (result != null)
                {
                    InsertNewNotificationDTO newNotification = new InsertNewNotificationDTO
                    {
                        SenderId = result.SenderId,
                        ReceiverId = result.ReceiverId,
                        Message = $"Đơn hàng của bạn đã được kỹ thuật viên xác nhận và đang chờ bắt đầu thực hiện.",
                        CratedAt = result.CreatedAt
                    };
                    var isInsert =  await _notificationRepo.InsertNewNotification(newNotification);
                    if(isInsert)
                    {
                        await _hubContext.Clients.User(result.ReceiverId.ToString()).SendAsync("ReceiveNotification", newNotification);
                        return Result<OrderActionResDTO>.Success(result, 200);
                    }
                    return Result<OrderActionResDTO>.Failure("Không thể xác nhận đơn hàng. Lỗi hệ thống", 400);
                }
                else
                {
                    return Result<OrderActionResDTO>.Failure("Không thể xác nhận đơn hàng. Đơn hàng không tồn tại hoặc không ở trạng thái chờ xác nhận", 400);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error confirming order ID: {OrderId}", orderActionDTO.OrderId);
                return Result<OrderActionResDTO>.Failure("Lỗi khi xác nhận đơn hàng", 500);
            }
        }

        /// <summary>
        /// Bắt đầu thực hiện đơn hàng (Confirmed -> In Progress)
        /// </summary>
        public async Task<Result<OrderActionResDTO>> StartOrder(OrderActionDTO orderActionDTO)
        {
            try
            {
                // Kiểm tra xem có đơn hàng đang thực hiện không
                var inProgressOrder = await _technicianOrderRepo.GetInProgressOrders(orderActionDTO.technicianId);
                if (inProgressOrder != null)
                {
                    return Result<OrderActionResDTO>.Failure("Bạn đang có một đơn hàng đang thực hiện. Vui lòng hoàn thành đơn hàng hiện tại trước", 400);
                }

                OrderActionResDTO result = await _technicianOrderRepo.StartOrder(orderActionDTO.OrderId, orderActionDTO.technicianId);
                
                if (result != null)
                {
                    InsertNewNotificationDTO newNotification = new InsertNewNotificationDTO
                    {
                        SenderId = result.SenderId,
                        ReceiverId = result.ReceiverId,
                        Message = $"Kỹ thuật viên đã bắt đầu thực hiện đơn hàng của bạn.",
                        CratedAt = result.CreatedAt
                    };
                    var isInsert = await _notificationRepo.InsertNewNotification(newNotification);
                    if (isInsert)
                    {
                        await _hubContext.Clients.User(result.ReceiverId.ToString()).SendAsync("ReceiveNotification", newNotification);
                        return Result<OrderActionResDTO>.Success(result, 200);
                    }
                    return Result<OrderActionResDTO>.Failure("Không thể bắt đầu đơn hàng. Lỗi hệ thống", 400);
                }
                else
                {
                    return Result<OrderActionResDTO>.Failure("Không thể bắt đầu đơn hàng. Đơn hàng không tồn tại hoặc không ở trạng thái đã xác nhận", 400);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error starting order ID: {OrderId}", orderActionDTO.OrderId);
                return Result<OrderActionResDTO>.Failure("Lỗi khi bắt đầu thực hiện đơn hàng", 500);
            }
        }

        
        /// <summary>
        /// Hoàn thành đơn hàng (In Progress -> Completed)
        /// NOTE: CompleteOrder is commented in DAL. Keep commented here for consistency.
        /// </summary>
        public async Task<Result<string>> CompleteOrder(Guid orderId)
        {
            try
            {
                var result = await _technicianOrderRepo.CompletedOrder(orderId);
                
                if (result != null)
                {
                    InsertNewNotificationDTO newNotification = new InsertNewNotificationDTO
                    {
                        SenderId = result.SenderId,
                        ReceiverId = result.ReceiverId,
                        Message = $"Đơn hàng {result.OrderName} đã được hoàn thành. Vui lòng xác nhận.",
                        CratedAt = result.CreatedAt
                    };
                    var isInsert = await _notificationRepo.InsertNewNotification(newNotification);
                    if (isInsert)
                    {
                        await _hubContext.Clients.User(result.ReceiverId.ToString()).SendAsync("ReceiveNotification", newNotification);
                        return Result<string>.Success("Hoàn thành đơn hàng thành công", 200);
                    }
                    return Result<string>.Failure("Không thể hoàn thành đơn hàng. Lỗi hệ thống", 400);
                }
                else
                {
                    return Result<string>.Failure("Không thể hoàn thành đơn hàng. Đơn hàng không tồn tại hoặc không ở trạng thái đang thực hiện", 400);
                }
            }
            catch (Exception ex)
            {
                return Result<string>.Failure("Lỗi khi hoàn thành đơn hàng", 500);
            }
        }

        /// <summary>
        /// Hủy đơn hàng (Pending Confirmation -> Refuse)
        /// </summary>
        public async Task<Result<OrderActionResDTO>> RejectedOrder(OrderActionDTO orderActionDTO)
        {
            try
            {
                OrderActionResDTO result = await _technicianOrderRepo.RejectedOrder(orderActionDTO.OrderId, orderActionDTO.technicianId);

                if (result != null)
                {
                    InsertNewNotificationDTO newNotification = new InsertNewNotificationDTO
                    {
                        SenderId = result.SenderId,
                        ReceiverId = result.ReceiverId,
                        Message = $"Đơn hàng của bạn đã bị kỹ thuật viên từ chối.",
                        CratedAt = result.CreatedAt
                    };
                    var isInsert = await _notificationRepo.InsertNewNotification(newNotification);
                    if (isInsert)
                    {
                        await _hubContext.Clients.User(result.ReceiverId.ToString()).SendAsync("ReceiveNotification", newNotification);
                        return Result<OrderActionResDTO>.Success(result, 200);
                    }
                    return Result<OrderActionResDTO>.Failure("Không thể hủy đơn hàng. Lỗi hệ thống", 400);
                }
                else
                {
                    return Result<OrderActionResDTO>.Failure("Không thể hủy đơn hàng. Đơn hàng không tồn tại hoặc không ở trạng thái chờ xác nhận", 400);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error canceling order ID: {OrderId}", orderActionDTO.OrderId);
                return Result<OrderActionResDTO>.Failure("Lỗi khi hủy đơn hàng", 500);
            }
        }

        /// <summary>
        /// Lấy số lượng đơn hàng đang thực hiện trong hôm nay
        /// </summary>
        public async Task<Result<int>> GetOrderInProgressToday(Guid technicianId)
        {
            try
            {
                var total = await _technicianOrderRepo.GetOrderInProgressToday(technicianId);
                return Result<int>.Success(total, 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting in-progress order count for technician ID: {TechnicianId}", technicianId);
                return Result<int>.Failure("Lỗi khi lấy số lượng đơn đang thực hiện hôm nay", 500);
            }
        }

        /// <summary>
        /// Lấy vị trí (địa chỉ, thành phố) của kỹ thuật viên
        /// </summary>
        public async Task<Result<Capstone_2_BE.DTOs.GoogleMapDTO>> GetTechnicianLocation(Guid technicianId)
        {
            try
            {
                var location = await _technicianOrderRepo.GetTechnicianLocation(technicianId);
                if (location == null)
                {
                    return Result<Capstone_2_BE.DTOs.GoogleMapDTO>.Failure("Không tìm thấy vị trí kỹ thuật viên", 404);
                }
                return Result<Capstone_2_BE.DTOs.GoogleMapDTO>.Success(location, 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting technician location for ID: {TechnicianId}", technicianId);
                return Result<Capstone_2_BE.DTOs.GoogleMapDTO>.Failure("Lỗi khi lấy vị trí kỹ thuật viên", 500);
            }
        }

        /// <summary>
        /// Lấy vị trí (địa chỉ, thành phố) của đơn hàng
        /// </summary>
        public async Task<Result<Capstone_2_BE.DTOs.GoogleMapDTO>> GetOrderLocation(Guid orderId)
        {
            try
            {
                var location = await _technicianOrderRepo.GetOrderLocation(orderId);
                if (location == null)
                {
                    return Result<Capstone_2_BE.DTOs.GoogleMapDTO>.Failure("Không tìm thấy vị trí đơn hàng", 404);
                }
                return Result<Capstone_2_BE.DTOs.GoogleMapDTO>.Success(location, 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting order location for ID: {OrderId}", orderId);
                return Result<Capstone_2_BE.DTOs.GoogleMapDTO>.Failure("Lỗi khi lấy vị trí đơn hàng", 500);
            }
        }

        public async Task<Result<ViewOrderDetailDTO>> GetOrderDetail(Guid orderId)
        {
            try
            {
                var order = await _technicianOrderRepo.viewOrderDetailDTO(orderId);
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
                    return Result<ViewOrderDetailDTO>.Failure("Không tìm thấy đơn hàng", 404);
                }
                return Result<ViewOrderDetailDTO>.Success(order, 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting order detail for order {OrderId}", orderId);
                return Result<ViewOrderDetailDTO>.Failure("Lỗi khi lấy chi tiết đơn hàng", 500);
            }
        }
    }
}
