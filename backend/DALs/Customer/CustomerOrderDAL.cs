using Capstone_2_BE.DTOs.Customer.Order;
using Capstone_2_BE.DTOs.Technician.Orders;
using Capstone_2_BE.Models;
using Capstone_2_BE.Repositories.Customer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client;
using StackExchange.Redis;

namespace Capstone_2_BE.DALs.Customer
{
    public class CustomerOrderDAL : ICustomerOrderRepo
    {
        private readonly AppDbContext _context;
        private readonly ILogger<CustomerOrderDAL> _logger;

        public CustomerOrderDAL(AppDbContext context, ILogger<CustomerOrderDAL> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<OrderActionResDTO> CancelOrder(OrderActionDTO orderActionDTO)
        {
            try
            {

                using (var transaction = await _context.Database.BeginTransactionAsync())
                {
                    try
                    {
                        int isUpdated = await _context.OrderrModel
                            .Where(o => o.Id == orderActionDTO.OrderId && (o.Status == "Pending Confirmation" || o.Status == "Confirmed"))
                            .ExecuteUpdateAsync(s => s.SetProperty(o => o.Status, "Cancelled"));

                        var OrderRes = await (from o in _context.OrderrModel
                                               join h in _context.OrderStatusHistoryModel on o.Id equals h.OrderId
                                               join c in _context.CustomerProfileModel on o.CustomerId equals c.Id
                                               where o.Id == orderActionDTO.OrderId
                                               select new OrderActionResDTO
                                               {
                                                   OrderId = o.Id,
                                                   SenderId = o.CustomerId,
                                                   ReceiverId = o.TechnicianId,
                                                   OrderName = o.Title,
                                                   CreatedAt = o.CreateAt,
                                               }).FirstOrDefaultAsync();

                        if (isUpdated > 0)
                        {
                            OrderStatusHistoryModel orderStatusHistory = new OrderStatusHistoryModel
                            {
                                OrderId = orderActionDTO.OrderId,
                                Status = "Cancelled",
                                ChangeBy = orderActionDTO.technicianId == Guid.Empty ? (OrderRes?.SenderId ?? Guid.Empty) : orderActionDTO.technicianId,
                                ChangeAt = DateTime.UtcNow,
                            };
                            await _context.OrderStatusHistoryModel.AddAsync(orderStatusHistory);
                            await _context.SaveChangesAsync();
                            await transaction.CommitAsync();
                        }
                        else
                        {
                            await transaction.RollbackAsync();
                        }
                        return OrderRes;
                    }
                    catch (Exception ex)
                    {
                        await transaction.RollbackAsync();
                        return null;
                    }
                }
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        public async Task<OrderActionResDTO> ConfirmCompletedOrder(OrderActionDTO orderActionDTO)
        {
            try
            {
                using (var transaction = await _context.Database.BeginTransactionAsync())
                {
                    try
                    {
                        var order = await _context.OrderrModel
                            .Where(o => o.Id == orderActionDTO.OrderId)
                            .Select(o => new
                            {
                                o.Id,
                                o.CustomerId,
                                o.TechnicianId,
                                o.Title,
                                o.CreateAt,
                                o.Status
                            })
                            .FirstOrDefaultAsync();

                        var normalizedStatus = (order?.Status ?? string.Empty)
                            .Trim()
                            .ToLowerInvariant()
                            .Replace(" ", string.Empty);

                        if (order == null || normalizedStatus != "inprogress")
                        {
                            _logger.LogWarning("ConfirmCompletedOrder rejected: Order {OrderId} current status is '{Status}'", orderActionDTO.OrderId, order?.Status);
                            await transaction.RollbackAsync();
                            return null;
                        }

                        int isUpdated = await _context.OrderrModel
                            .Where(o => o.Id == orderActionDTO.OrderId && (
                                o.Status == "In Progress" ||
                                o.Status == "In progress" ||
                                o.Status == "InProgress"))
                            .ExecuteUpdateAsync(s => s
                                .SetProperty(o => o.Status, "Completed")
                                .SetProperty(o => o.CompleteAt, DateTime.Now)
                            );

                        if (isUpdated == 0)
                        {
                            await transaction.RollbackAsync();
                            return null;
                        }

                        OrderStatusHistoryModel orderStatusHistory = new OrderStatusHistoryModel
                        {
                            OrderId = orderActionDTO.OrderId,
                            Status = "Completed",
                            ChangeBy = order.CustomerId,
                            ChangeAt = DateTime.UtcNow,
                        };
                        await _context.OrderStatusHistoryModel.AddAsync(orderStatusHistory);
                        await _context.SaveChangesAsync();

                        int isUpdateCount = await _context.TechnicianProfileModel
                            .Where(t => t.Id == order.TechnicianId)
                            .ExecuteUpdateAsync(t => t.SetProperty(tp => tp.OrderCount, tp => tp.OrderCount + 1));

                        if (isUpdateCount == 0)
                        {
                            _logger.LogWarning("Failed to update order count for technician ID: {TechnicianId}", order.TechnicianId);
                        }

                        await transaction.CommitAsync();

                        return new OrderActionResDTO
                        {
                            OrderId = order.Id,
                            SenderId = order.CustomerId,
                            ReceiverId = order.TechnicianId,
                            OrderName = order.Title,
                            CreatedAt = order.CreateAt,
                        };
                    }
                    catch (Exception)
                    {
                        await transaction.RollbackAsync();
                        return null;
                    }
                }
            }
            catch (Exception)
            {
                return null;
            }
        }

        public async Task<List<OrderOverviewDTO>> GetCancalledOrder(Guid customerId)
        {
            try
            {
                List<OrderOverviewDTO> InProgressOrder = await (
                    from o in _context.OrderrModel
                    join s in _context.ServiceCategoriesModel on o.ServiceId equals s.Id
                    join c in _context.TechnicianProfileModel on o.TechnicianId equals c.Id
                    where o.CustomerId == customerId && (o.Status == "Cancelled" || o.Status == "Canceled")
                    let latestStatusAt = _context.OrderStatusHistoryModel
                        .Where(h => h.OrderId == o.Id && (h.Status == "Cancelled" || h.Status == "Canceled"))
                        .OrderByDescending(h => h.ChangeAt)
                        .Select(h => (DateTime?)h.ChangeAt)
                        .FirstOrDefault()
                    orderby latestStatusAt descending, o.CreateAt descending
                    select new OrderOverviewDTO
                    {
                        OrderId = o.Id,
                        TechnicianId = c.Id,
                        TechnicianName = c.FullName,
                        ServiceName = s.ServiceName,
                        Title = o.Title,
                        Status = o.Status,
                        OrderDate = o.CreateAt,
                        LastUpdateAt = latestStatusAt
                    }
                ).ToListAsync();
                return InProgressOrder;
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        public async Task<List<OrderOverviewDTO>> GetCurrentOrders(Guid customerId)
        {
            try
            {
                List<OrderOverviewDTO> InProgressOrder = await (from o in _context.OrderrModel
                                                                join s in _context.ServiceCategoriesModel on o.ServiceId equals s.Id
                                                                join c in _context.TechnicianProfileModel on o.TechnicianId equals c.Id
                                                                where o.CustomerId == customerId &&
                                                                                                    (o.Status == "Pending Confirmation" ||
                                                                                                     o.Status == "Pending" ||
                                                                                                     o.Status == "Confirmed" ||
                                                                                                     o.Status == "In Progress")
                                                                let latestUpdatedAt = _context.OrderStatusHistoryModel
                                                                    .Where(h => h.OrderId == o.Id && h.Status == "Updated")
                                                                    .OrderByDescending(h => h.ChangeAt)
                                                                    .Select(h => (DateTime?)h.ChangeAt)
                                                                    .FirstOrDefault()
                                                                select new OrderOverviewDTO
                                                                {
                                                                    OrderId = o.Id,
                                                                    TechnicianId = c.Id,
                                                                    TechnicianName = c.FullName,
                                                                    ServiceName = s.ServiceName,
                                                                    Title = o.Title,
                                                                    Status = o.Status,
                                                                    OrderDate = o.CreateAt,
                                                                    LastUpdateAt = latestUpdatedAt,
                                                                }).ToListAsync();
                return InProgressOrder;
            }
            catch (Exception ex)
            {
                return null;
            }
        }
        public async Task<List<OrderOverviewDTO>> GetInProgressOrders(Guid customerId)
        {
            try
            {
                List<OrderOverviewDTO> InProgressOrder = await (from o in _context.OrderrModel
                                                                join s in _context.ServiceCategoriesModel on o.ServiceId equals s.Id
                                                                join c in _context.TechnicianProfileModel on o.TechnicianId equals c.Id
                                                                where o.CustomerId == customerId && o.Status == "In Progress"
                                                                let latestUpdatedAt = _context.OrderStatusHistoryModel
                                                                    .Where(h => h.OrderId == o.Id && h.Status == "Updated")
                                                                    .OrderByDescending(h => h.ChangeAt)
                                                                    .Select(h => (DateTime?)h.ChangeAt)
                                                                    .FirstOrDefault()
                                                                select new OrderOverviewDTO
                                                                {
                                                                    OrderId = o.Id,
                                                                    TechnicianId = c.Id,
                                                                    TechnicianName = c.FullName,
                                                                    ServiceName = s.ServiceName,
                                                                    Title = o.Title,
                                                                    Status = o.Status,
                                                                    OrderDate = o.CreateAt,
                                                                    LastUpdateAt = latestUpdatedAt,
                                                                }).ToListAsync();
                return InProgressOrder;
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        public async Task<OrderDetailDTO> GetOrderDetail(Guid orderId)
        {
            try
            {
                var result = await (from o in _context.OrderrModel
                                    join s in _context.ServiceCategoriesModel on o.ServiceId equals s.Id
                                    join c in _context.TechnicianProfileModel on o.TechnicianId equals c.Id
                                    join a in _context.OrderAttachmentsModel on o.Id equals a.OrderId into attachments
                                    join ct in _context.CitiesModel on o.CityId equals ct.Id
                                    where o.Id == orderId
                                    select new OrderDetailDTO
                                    {
                                        OrderId = o.Id,
                                        ServiceName = s.ServiceName,
                                        TechnicianName = c.FullName,
                                        Title = o.Title,
                                        Description = o.Description,
                                        Address = o.Address,
                                        City = ct.CityName,
                                        Status = o.Status,
                                        videoUrl = attachments.Where(att => att.FileType == "Video").Select(att => att.FileName).FirstOrDefault(),
                                        ImageUrls = attachments.Where(att => att.FileType == "Image").Select(att => att.FileName).ToList(),
                                        CreateAt = o.CreateAt,
                                        LastUpdateAt = _context.OrderStatusHistoryModel
                                            .Where(h => h.OrderId == o.Id && h.Status == "Updated")
                                            .OrderByDescending(h => h.ChangeAt)
                                            .Select(h => (DateTime?)h.ChangeAt)
                                            .FirstOrDefault(),
                                    }).FirstOrDefaultAsync();
                if (result == null)
                {
                    _logger.LogWarning("Order with ID {OrderId} not found.", orderId);
                    return null;
                }
                return result;
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        public async Task<List<OrderOverviewDTO>> GetOrderHistory(Guid customerId)
        {
            try
            {
                List<OrderOverviewDTO> InProgressOrder = await (from o in _context.OrderrModel
                                                                join s in _context.ServiceCategoriesModel on o.ServiceId equals s.Id
                                                                join c in _context.TechnicianProfileModel on o.TechnicianId equals c.Id
                                                                where o.CustomerId == customerId && o.Status == "Completed"
                                                                let latestUpdatedAt = _context.OrderStatusHistoryModel
                                                                    .Where(h => h.OrderId == o.Id && h.Status == "Updated")
                                                                    .OrderByDescending(h => h.ChangeAt)
                                                                    .Select(h => (DateTime?)h.ChangeAt)
                                                                    .FirstOrDefault()
                                                                select new OrderOverviewDTO
                                                                {
                                                                    OrderId = o.Id,
                                                                    TechnicianId = c.Id,
                                                                    TechnicianName = c.FullName,
                                                                    ServiceName = s.ServiceName,
                                                                    Title = o.Title,
                                                                    Status = o.Status,
                                                                    OrderDate = o.CreateAt,
                                                                    LastUpdateAt = latestUpdatedAt,
                                                                }).ToListAsync();
                return InProgressOrder;
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        public async Task<List<OrderOverviewDTO>> GetRejectedOrder(Guid customerId)
        {
            try
            {
                List<OrderOverviewDTO> InProgressOrder = await (
                    from o in _context.OrderrModel
                    join s in _context.ServiceCategoriesModel on o.ServiceId equals s.Id
                    join c in _context.TechnicianProfileModel on o.TechnicianId equals c.Id
                    where o.CustomerId == customerId && o.Status == "Rejected"
                    let latestStatusAt = _context.OrderStatusHistoryModel
                        .Where(h => h.OrderId == o.Id && h.Status == "Rejected")
                        .OrderByDescending(h => h.ChangeAt)
                        .Select(h => (DateTime?)h.ChangeAt)
                        .FirstOrDefault()
                    orderby latestStatusAt descending, o.CreateAt descending
                    select new OrderOverviewDTO
                    {
                        OrderId = o.Id,
                        TechnicianId = c.Id,
                        TechnicianName = c.FullName,
                        ServiceName = s.ServiceName,
                        Title = o.Title,
                        Status = o.Status,
                        OrderDate = o.CreateAt,
                        LastUpdateAt = latestStatusAt
                    }
                ).ToListAsync();
                return InProgressOrder;
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        public async Task<bool> InsertOrder(CreateOrderDALDTO placeOrderDALDTO)
        {
            try
            {
                using (var transaction = await _context.Database.BeginTransactionAsync())
                {
                    try
                    {
                        OrderrModel newOrder = new OrderrModel
                        {
                            CustomerId = placeOrderDALDTO.CustomerId,
                            TechnicianId = placeOrderDALDTO.TechnicianId,
                            ServiceId = placeOrderDALDTO.ServiceId,
                            Title = placeOrderDALDTO.Title,
                            Description = placeOrderDALDTO.Description,
                            Address = placeOrderDALDTO.Address,
                            CityId = placeOrderDALDTO.CityId,
                            Latitude = placeOrderDALDTO.Latitude,
                            Longitude = placeOrderDALDTO.Longitude,
                            CreateAt = DateTime.Now,
                            Status = "Pending Confirmation",
                        };
                        await _context.OrderrModel.AddAsync(newOrder);
                        await _context.SaveChangesAsync();
                        OrderStatusHistoryModel orderStatusHistory = new OrderStatusHistoryModel
                        {
                            OrderId = newOrder.Id,
                            Status = "Pending Confirmation",
                            ChangeBy = placeOrderDALDTO.CustomerId,
                            ChangeAt = DateTime.Now,
                        };
                        await _context.OrderStatusHistoryModel.AddAsync(orderStatusHistory);
                        await _context.SaveChangesAsync();
                        // Video
                        if (!string.IsNullOrEmpty(placeOrderDALDTO.videoUrl))
                        {
                            OrderAttachmentsModel videoAttachment = new OrderAttachmentsModel
                            {
                                OrderId = newOrder.Id,
                                FileType = "Video",
                                FileName = placeOrderDALDTO.videoUrl,
                                CreateAt = DateTime.Now,
                            };
                            await _context.OrderAttachmentsModel.AddAsync(videoAttachment);
                            await _context.SaveChangesAsync();
                        }
                        // Images
                        if (placeOrderDALDTO.ImageOrderUrl != null && placeOrderDALDTO.ImageOrderUrl.Count > 0)
                        {
                            List<OrderAttachmentsModel> imageAttachments = placeOrderDALDTO.ImageOrderUrl.Select(imageUrl => new OrderAttachmentsModel
                            {
                                OrderId = newOrder.Id,
                                FileType = "Image",
                                FileName = imageUrl,
                                CreateAt = DateTime.Now,
                            }).ToList();
                            await _context.OrderAttachmentsModel.AddRangeAsync(imageAttachments);
                            await _context.SaveChangesAsync();
                        }
                        await transaction.CommitAsync();
                        return true;
                    }
                    catch (Exception ex)
                    {
                        await transaction.RollbackAsync();
                        return false;
                    }
                }
            }
            catch (Exception ex)
            {
                return false;
            }
        }
        public async Task<OrderOldImageVideo> updateOrder(UpdateOrderDALDTO updateOrderDTO)
        {
            // nếu Video null thì xoá hết video cũ, nếu có video mới thì thêm vào
            // Nếu ImageUrls null hoặc rỗng thì xoá hết ảnh cũ, nếu có ảnh mới thì thêm vào
            try
            {
                using (var transaction = await _context.Database.BeginTransactionAsync())
                {
                    try
                    {
                        var videoUrl = await _context.OrderAttachmentsModel.Where(o => o.OrderId == updateOrderDTO.OrderId && o.FileType == "Video").Select(o => o.FileName).FirstOrDefaultAsync();
                        var imgUrls = await _context.OrderAttachmentsModel.Where(o => o.OrderId == updateOrderDTO.OrderId && o.FileType == "Image").Select(o => o.FileName).ToListAsync();
                        OrderOldImageVideo oldImageVideo = new OrderOldImageVideo
                        {
                            ImageUrls = imgUrls,
                            VideoUrl = videoUrl,
                        };
                        var order = await _context.OrderrModel.FirstOrDefaultAsync(o =>
                            o.Id == updateOrderDTO.OrderId &&
                            (o.Status == "Pending Confirmation" || o.Status == "Rejected" || o.Status == "Cancelled"));

                        if (order != null)
                        {
                            if (updateOrderDTO.Title != null) order.Title = updateOrderDTO.Title;
                            if (updateOrderDTO.Description != null) order.Description = updateOrderDTO.Description;
                            if (updateOrderDTO.Address != null) order.Address = updateOrderDTO.Address;
                            if (updateOrderDTO.CityId.HasValue) order.CityId = updateOrderDTO.CityId.Value;
                            if (updateOrderDTO.Latitude.HasValue) order.Latitude = updateOrderDTO.Latitude.Value;
                            if (updateOrderDTO.Longitude.HasValue) order.Longitude = updateOrderDTO.Longitude.Value;

                            OrderStatusHistoryModel updatedHistory = new OrderStatusHistoryModel
                            {
                                Id = Guid.NewGuid(),
                                OrderId = order.Id,
                                Status = "Updated",
                                ChangeBy = order.CustomerId,
                                ChangeAt = DateTime.Now
                            };
                            await _context.OrderStatusHistoryModel.AddAsync(updatedHistory);

                            await _context.SaveChangesAsync();

                            int isDelete = await _context.OrderAttachmentsModel.Where(o => o.OrderId == updateOrderDTO.OrderId).ExecuteDeleteAsync();
                            if (updateOrderDTO.videoUrl != null)
                            {
                                OrderAttachmentsModel videoAttachment = new OrderAttachmentsModel
                                {
                                    OrderId = updateOrderDTO.OrderId,
                                    FileType = "Video",
                                    FileName = updateOrderDTO.videoUrl,
                                    CreateAt = DateTime.Now,
                                };
                                await _context.OrderAttachmentsModel.AddAsync(videoAttachment);
                                await _context.SaveChangesAsync();
                            }
                            if (updateOrderDTO.ImageUrls != null && updateOrderDTO.ImageUrls.Count > 0)
                            {
                                List<OrderAttachmentsModel> imageAttachments = updateOrderDTO.ImageUrls.Select(imageUrl => new OrderAttachmentsModel
                                {
                                    OrderId = updateOrderDTO.OrderId,
                                    FileType = "Image",
                                    FileName = imageUrl,
                                    CreateAt = DateTime.Now,
                                }).ToList();
                                await _context.OrderAttachmentsModel.AddRangeAsync(imageAttachments);
                                await _context.SaveChangesAsync();
                            }
                            await transaction.CommitAsync();
                            return oldImageVideo;
                        }
                        else
                        {
                            _logger.LogWarning("Failed to update order with ID: {OrderId}. Order may not be in an updatable state.", updateOrderDTO.OrderId);
                            await transaction.RollbackAsync();
                            return null;
                        }
                    }
                    catch(Exception ex)
                    {
                        await transaction.RollbackAsync();
                        return null;
                    }
                }
            }
            catch (Exception ex)
            {
                return null;
            }
        }

    }
}