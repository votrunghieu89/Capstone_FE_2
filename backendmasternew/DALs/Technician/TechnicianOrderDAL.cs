using Capstone_2_BE.DTOs;
using Capstone_2_BE.DTOs.Customer.Order;
using Capstone_2_BE.DTOs.Technician.Orders;
using Capstone_2_BE.Models;
using Capstone_2_BE.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Client;
using System;

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
                        int isUpdated = await _context.OrderrModel.Where(o => o.Id == orderId && o.Status == "Confirmed" && o.TechnicianId == technicianId && !_context.OrderrModel.Any(x => x.TechnicianId == technicianId
                                                    && x.Status == "In Progress")).ExecuteUpdateAsync(s => s.SetProperty(o => o.Status, "In Progress"));
                        if (isUpdated == 0)
                        {
                            return null;
                        }

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
                List<ViewOrderDTO> InProgressOrder = await (from o in _context.OrderrModel
                                                            join s in _context.ServiceCategoriesModel on o.ServiceId equals s.Id
                                                            join c in _context.CustomerProfileModel on o.CustomerId equals c.Id
                                                            join ct in _context.CitiesModel on o.CityId equals ct.Id
                                                            where o.TechnicianId == technicianId && o.Status == "Confirmed"
                                                            select new ViewOrderDTO
                                                            {
                                                                OrderId = o.Id,
                                                                CustomerName = c.FullName,
                                                                ServiceName = s.ServiceName,
                                                                Address = o.Address,
                                                                City = ct.CityName,
                                                                PhoneNumber = c.PhoneNumber,
                                                                Title = o.Title,
                                                                Status = o.Status,
                                                                EstimatedTime = o.EstimatedTime,
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
                List<ViewOrderDTO> InProgressOrder = await (from o in _context.OrderrModel
                                                            join s in _context.ServiceCategoriesModel on o.ServiceId equals s.Id
                                                            join c in _context.CustomerProfileModel on o.CustomerId equals c.Id
                                                            join ct in _context.CitiesModel on o.CityId equals ct.Id
                                                            where o.TechnicianId == technicianId && o.Status == "Pending Confirmation"
                                                            select new ViewOrderDTO
                                                            {
                                                                OrderId = o.Id,
                                                                CustomerName = c.FullName,
                                                                ServiceName = s.ServiceName,
                                                                Address = o.Address,
                                                                City = ct.CityName,
                                                                PhoneNumber = c.PhoneNumber,
                                                                Title = o.Title,
                                                                Status = o.Status,
                                                                EstimatedTime = o.EstimatedTime,
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
                                                            join ct in _context.CitiesModel on o.CityId equals ct.Id
                                                            where o.TechnicianId == technicianId && o.Status == "Completed"
                                                            select new ViewOrderDTO
                                                            {
                                                                OrderId = o.Id,
                                                                CustomerName = c.FullName,
                                                                ServiceName = s.ServiceName,
                                                                Address = o.Address,
                                                                City = ct.CityName,
                                                                PhoneNumber = c.PhoneNumber,
                                                                Title = o.Title,
                                                                Status = o.Status,
                                                                EstimatedTime = o.EstimatedTime,
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
                                             join ct in _context.CitiesModel on o.CityId equals ct.Id
                                             where o.TechnicianId == technicianId && o.Status == "In Progress"
                                             select new ViewOrderDTO
                                             {
                                                 OrderId = o.Id,
                                                 CustomerName = c.FullName,
                                                 ServiceName = s.ServiceName,
                                                 Address = o.Address,
                                                 City = ct.CityName,
                                                 PhoneNumber = c.PhoneNumber,
                                                 Title = o.Title,
                                                 Status = o.Status,
                                                 EstimatedTime = o.EstimatedTime,
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
                List<ViewOrderDTO> InProgressOrder = await (from o in _context.OrderrModel
                                                            join s in _context.ServiceCategoriesModel on o.ServiceId equals s.Id
                                                            join c in _context.CustomerProfileModel on o.CustomerId equals c.Id
                                                            join ct in _context.CitiesModel on o.CityId equals ct.Id
                                                            where o.TechnicianId == technicianId && o.Status == "Cancelled"
                                                            select new ViewOrderDTO
                                                            {
                                                                OrderId = o.Id,
                                                                CustomerName = c.FullName,
                                                                ServiceName = s.ServiceName,
                                                                Address = o.Address,
                                                                City = ct.CityName,
                                                                PhoneNumber = c.PhoneNumber,
                                                                Title = o.Title,
                                                                Status = o.Status,
                                                                EstimatedTime = o.EstimatedTime,
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
                            await _context.AccountsModel.Where(a => a.Id == AccountId && a.IsOnline == 2).ExecuteUpdateAsync(e => e.SetProperty(sg => sg.IsOnline, 1));
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
                                                            join ct in _context.CitiesModel on o.CityId equals ct.Id
                                                            where o.TechnicianId == technicianId && o.Status == "Rejected"
                                                            select new ViewOrderDTO
                                                            {
                                                                OrderId = o.Id,
                                                                CustomerName = c.FullName,
                                                                ServiceName = s.ServiceName,
                                                                Address = o.Address,
                                                                City = ct.CityName,
                                                                PhoneNumber = c.PhoneNumber,
                                                                Title = o.Title,
                                                                Status = o.Status,
                                                                EstimatedTime = o.EstimatedTime,
                                                                OrderDate = o.CreateAt,
                                                            }).ToListAsync();
                return InProgressOrder;
            }
            catch (Exception ex)
            {
                return null;
            }
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

        public async Task<int> GetOrderInProgressToday(Guid technicianId)
        {
            try
            {
                var start = DateTime.Now.Date;
                var end = start.AddDays(1);

                var total = await _context.OrderrModel
                    .Where(o => o.TechnicianId == technicianId
                             && o.Status == "In Progress"
                             && o.CreateAt >= start
                             && o.CreateAt < end)
                    .CountAsync();
                return total;
            }
            catch (Exception ex)
            {
                return 0;
            }
        }

        public async Task<GoogleMapDTO> GetTechnicianLocation(Guid technicianId)
        {
            try
            {
                var location = await (from t in _context.TechnicianProfileModel
                                      join c in _context.CitiesModel on t.CityId equals c.Id
                                      where t.Id == technicianId
                                      select new GoogleMapDTO
                                      {
                                          Address = t.Address,
                                          CityName = c.CityName,
                                      }).FirstOrDefaultAsync();
                return location;

            }
            catch (Exception ex)
            {
                return null;
            }
        }

        public async Task<GoogleMapDTO> GetOrderLocation(Guid OrderId)
        {
            try
            {
                var location = await (from o in _context.OrderrModel
                                      join c in _context.CitiesModel on o.CityId equals c.Id
                                      where o.Id == OrderId
                                      select new GoogleMapDTO
                                      {
                                          Address = o.Address,
                                          CityName = c.CityName,
                                      }).FirstOrDefaultAsync();
                return location;

            }
            catch (Exception ex)
            {
                return null;
            }
        }

        public async Task<ViewOrderDetailDTO> viewOrderDetailDTO(Guid orderId)
        {
            try
            {
                var result = await (from o in _context.OrderrModel
                                    join s in _context.ServiceCategoriesModel on o.ServiceId equals s.Id
                                    join c in _context.CustomerProfileModel on o.CustomerId equals c.Id
                                    join a in _context.OrderAttachmentsModel on o.Id equals a.OrderId into attachments
                                    join ct in _context.CitiesModel on o.CityId equals ct.Id
                                    where o.Id == orderId
                                    select new ViewOrderDetailDTO
                                    {
                                        OrderId = o.Id,
                                        ServiceName = s.ServiceName,
                                        CustomerName = c.FullName,
                                        Title = o.Title,
                                        Description = o.Description,
                                        Address = o.Address,
                                        City = ct.CityName,
                                        PhoneNumgber = c.PhoneNumber,
                                        Status = o.Status,
                                        EstimatedTime = o.EstimatedTime,
                                        videoUrl = attachments.Where(att => att.FileType == "Video").Select(att => att.FileName).FirstOrDefault(),
                                        ImageUrls = attachments.Where(att => att.FileType == "Image").Select(att => att.FileName).ToList(),
                                        CreateAt = o.CreateAt,
                                    }).FirstOrDefaultAsync();
                if (result == null)
                {
                    _logger.LogWarning("Order with ID {OrderId} not found.", orderId);
                    return null;
                }
                return result;

            }
            catch(Exception ex)
            {
                return null;
            }
        }
    }
}
