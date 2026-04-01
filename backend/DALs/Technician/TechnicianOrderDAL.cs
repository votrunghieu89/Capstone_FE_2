using Capstone_2_BE.DTOs.Technician.Orders;
using Capstone_2_BE.Models;
using Capstone_2_BE.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client;

namespace Capstone_2_BE.DALs.Technician
{
    public class TechnicianOrderDAL : ITechnicianOrderRepo
    {
        public readonly AppDbContext _context;
        public readonly ILogger<TechnicianOrderDAL> _logger;

        public TechnicianOrderDAL(AppDbContext context, ILogger<TechnicianOrderDAL> logger)
        {
            _context = context;
            _logger = logger;
        }
        
        //// Thợ xác nhận đơn hàng
        public async Task<OrderActionResDTO> ConfirmOrder(Guid orderId, Guid technicianId)
        {
            try
            {

                using (var transaction = await _context.Database.BeginTransactionAsync())
                {
                    try
                    {
                        int isUpdated = await _context.OrderrModel.Where(o => o.Id == orderId && o.Status == "Pending Confirmation").ExecuteUpdateAsync(s => s.SetProperty(o => o.Status, "Confirmed"));
                        if (isUpdated > 0)
                        {
                            OrderStatusHistoryModel orderStatusHistory = new OrderStatusHistoryModel
                            {
                                OrderId = orderId,
                                Status = "Confirmed",
                                ChangeBy = technicianId,
                                ChangeAt = DateTime.UtcNow,
                            };
                            await _context.OrderStatusHistoryModel.AddAsync(orderStatusHistory);
                            await _context.SaveChangesAsync();
                            await transaction.CommitAsync();
                        }
                        var OrderRes = await (from o in _context.OrderrModel
                                              join h in _context.OrderStatusHistoryModel on o.Id equals h.OrderId
                                              join c in _context.CustomerProfileModel on o.CustomerId equals c.Id
                                              where o.Id == orderId
                                              select new OrderActionResDTO
                                              {
                                                  OrderId = o.Id,
                                                  SenderId = o.TechnicianId,
                                                  ReceiverId = o.CustomerId,
                                                  OrderName = o.Title,
                                                  CreatedAt = o.CreateAt,
                                              }).FirstOrDefaultAsync();
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
        // Bắt đầy làm đơn hàng đã xác nhận
        public async Task<OrderActionResDTO> StartOrder(Guid orderId, Guid technicianId)
        {
            try
            {

                using (var transaction = await _context.Database.BeginTransactionAsync())
                {
                    try
                    {
                        int isUpdated = await _context.OrderrModel.Where(o => o.Id == orderId && o.Status == "Confirmed").ExecuteUpdateAsync(s => s.SetProperty(o => o.Status, "In Progress"));
                        if (isUpdated > 0)
                        {
                            OrderStatusHistoryModel orderStatusHistory = new OrderStatusHistoryModel
                            {
                                OrderId = orderId,
                                Status = "In Progress",
                                ChangeBy = technicianId,
                                ChangeAt = DateTime.UtcNow,
                            };
                            await _context.OrderStatusHistoryModel.AddAsync(orderStatusHistory);
                            await _context.SaveChangesAsync();
                            await transaction.CommitAsync();
                            
                        }
                        var OrderRes = await (from o in _context.OrderrModel
                                              join h in _context.OrderStatusHistoryModel on o.Id equals h.OrderId
                                              join c in _context.CustomerProfileModel on o.CustomerId equals c.Id
                                              where o.Id == orderId
                                              select new OrderActionResDTO
                                              {
                                                  OrderId = o.Id,
                                                  SenderId = o.TechnicianId,
                                                  ReceiverId = o.CustomerId,
                                                  OrderName = o.Title,
                                                  CreatedAt = o.CreateAt,
                                              }).FirstOrDefaultAsync();
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
        // Lấy ds đơn đã xác nhận
        public async Task<List<ViewOrderDTO>> GetConfirmedOrders(Guid technicianId)
        {
            try
            {
                List<ViewOrderDTO> InProgressOrder = await(from o in _context.OrderrModel
                                                           join s in _context.ServiceCategoriesModel on o.ServiceId equals s.Id
                                                           join c in _context.CustomerProfileModel on o.CustomerId equals c.Id
                                                           where o.TechnicianId == technicianId && o.Status == "Confirmed"
                                                           select new ViewOrderDTO
                                                           {
                                                               OrderId = o.Id,
                                                               CustomerName = c.FullName,
                                                               ServiceName = s.ServiceName,
                                                               Title = o.Title,
                                                               Status = o.Status,
                                                               OrderDate = o.CreateAt,
                                                           }).ToListAsync();
                return InProgressOrder;
            }
            catch (Exception ex)
            {
                return null;
            }
        }
        // Lấy ds đơn đang chờ xác nhận
        public async Task<List<ViewOrderDTO>> GetConfirmingOrders(Guid technicianId)
        {
            try
            {
                List<ViewOrderDTO> InProgressOrder = await(from o in _context.OrderrModel
                                                           join s in _context.ServiceCategoriesModel on o.ServiceId equals s.Id
                                                           join c in _context.CustomerProfileModel on o.CustomerId equals c.Id
                                                           where o.TechnicianId == technicianId && o.Status == "Pending Confirmation"
                                                           select new ViewOrderDTO
                                                           {
                                                               OrderId = o.Id,
                                                               CustomerName = c.FullName,
                                                               ServiceName = s.ServiceName,
                                                               Title = o.Title,
                                                               Status = o.Status,
                                                               OrderDate = o.CreateAt,
                                                           }).ToListAsync();
                return InProgressOrder;
            }
            catch (Exception ex)
            {
                return null;
            }
        }
        // Lấy toàn bộ đơn đã hoàn thành 
        public async Task<List<ViewOrderDTO>> GetHistoryOrders(Guid technicianId)
        {
            try
            {
                List<ViewOrderDTO> InProgressOrder = await (from o in _context.OrderrModel
                                            join s in _context.ServiceCategoriesModel on o.ServiceId equals s.Id
                                            join c in _context.CustomerProfileModel on o.CustomerId equals c.Id
                                            where o.TechnicianId == technicianId && o.Status == "Completed"
                                            select new ViewOrderDTO
                                            {
                                                OrderId = o.Id,
                                                CustomerName = c.FullName,
                                                ServiceName = s.ServiceName,
                                                Title = o.Title,
                                                Status = o.Status,
                                                OrderDate = o.CreateAt,
                                            }).ToListAsync();
                return InProgressOrder;
            }
            catch (Exception ex)
            {
                return null;
            }
        }
        // Lây toàn bộ đơn đang thực hiện
        public async Task<ViewOrderDTO> GetInProgressOrders(Guid technicianId)
        {
            try
            {
                var InProgressOrder = await (from o in _context.OrderrModel
                                        join s in _context.ServiceCategoriesModel on o.ServiceId equals s.Id
                                        join c in _context.CustomerProfileModel on o.CustomerId equals c.Id
                                        where o.TechnicianId == technicianId && o.Status == "In Progress"
                                        select new ViewOrderDTO
                                        {
                                            OrderId = o.Id,
                                            CustomerName = c.FullName,
                                            ServiceName = s.ServiceName,
                                            Title = o.Title,
                                            Status = o.Status,
                                            OrderDate = o.CreateAt,
                                        }).FirstOrDefaultAsync();
                return InProgressOrder;
            }
            catch (Exception ex)
            {
               return null;
            }   
        }
        // đơn hàng bị huỷ do khách hàng
        public async Task<List<ViewOrderDTO>> GetCanceledOrders(Guid technicianId)
        {
            try
            {
                List<ViewOrderDTO> InProgressOrder = await(from o in _context.OrderrModel
                                                           join s in _context.ServiceCategoriesModel on o.ServiceId equals s.Id
                                                           join c in _context.CustomerProfileModel on o.CustomerId equals c.Id
                                                           where o.TechnicianId == technicianId && o.Status == "Cancelled"
                                                           select new ViewOrderDTO
                                                           {
                                                               OrderId = o.Id,
                                                               CustomerName = c.FullName,
                                                               ServiceName = s.ServiceName,
                                                               Title = o.Title,
                                                               Status = o.Status,
                                                               OrderDate = o.CreateAt,
                                                           }).ToListAsync();
                return InProgressOrder;
            }
            catch (Exception ex)
            {
                return null;
            }
        }
        // Thợ từ chối đơn hàng
        public async Task<OrderActionResDTO> RejectedOrder(Guid orderId, Guid AccountId)
        {
            try
            {

                using (var transaction = await _context.Database.BeginTransactionAsync())
                {
                    try
                    {
                        int isUpdated = await _context.OrderrModel.Where(o => o.Id == orderId && o.Status == "Pending Confirmation").ExecuteUpdateAsync(s => s.SetProperty(o => o.Status, "Rejected"));
                        if (isUpdated > 0)
                        {
                            OrderStatusHistoryModel orderStatusHistory = new OrderStatusHistoryModel
                            {
                                OrderId = orderId,
                                Status = "Rejected",
                                ChangeBy = AccountId,
                                ChangeAt = DateTime.UtcNow,
                            };
                            await _context.OrderStatusHistoryModel.AddAsync(orderStatusHistory);
                            await _context.SaveChangesAsync();
                            await transaction.CommitAsync();
                            
                        }
                        var OrderRes = await (from o in _context.OrderrModel
                                              join h in _context.OrderStatusHistoryModel on o.Id equals h.OrderId
                                              join c in _context.CustomerProfileModel on o.CustomerId equals c.Id
                                              where o.Id == orderId
                                              select new OrderActionResDTO
                                              {
                                                  OrderId = o.Id,
                                                  SenderId = o.TechnicianId,
                                                  ReceiverId = o.CustomerId,
                                                  OrderName = o.Title,
                                                  CreatedAt = o.CreateAt,
                                              }).FirstOrDefaultAsync();
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
        // Lấy toàn bộ đơn bị từ chối ( do thợ từ chối)
        public async Task<List<ViewOrderDTO>> GetRejectedOrders(Guid technicianId)
        {
            try
            {
                List<ViewOrderDTO> InProgressOrder = await (from o in _context.OrderrModel
                                                            join s in _context.ServiceCategoriesModel on o.ServiceId equals s.Id
                                                            join c in _context.CustomerProfileModel on o.CustomerId equals c.Id
                                                            where o.TechnicianId == technicianId && o.Status == "Rejected"
                                                            select new ViewOrderDTO
                                                            {
                                                                OrderId = o.Id,
                                                                CustomerName = c.FullName,
                                                                ServiceName = s.ServiceName,
                                                                Title = o.Title,
                                                                Status = o.Status,
                                                                OrderDate = o.CreateAt,
                                                            }).ToListAsync();
                return InProgressOrder;
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        public Task<ViewOrderDetailDTO> GetOrderDetails(Guid orderId, Guid technicianId)
        {
            throw new NotImplementedException();
        }
        public async Task<OrderActionResDTO> CompletedOrder(Guid orderId)
        {
            try
            {
                var order = await _context.OrderrModel.Where(o => o.Id == orderId && o.Status == "In Progress").Select(
                    o => new OrderActionResDTO
                    {
                        OrderId = o.Id,
                        SenderId = o.TechnicianId,
                        ReceiverId = o.CustomerId,
                        OrderName = o.Title,
                        CreatedAt = o.CreateAt,
                    }).FirstOrDefaultAsync();
                if (order == null)
                {
                    return null;
                }
                return order;
            }
            catch (Exception ex)
            {
                return null;
            }
        }
    }
}
