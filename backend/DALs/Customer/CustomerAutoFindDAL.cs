using Capstone_2_BE.DTOs.Customer.AutoFind;
using Capstone_2_BE.DTOs.Customer.Order;
using Capstone_2_BE.Models;
using Capstone_2_BE.Repositories.Customer;
using Microsoft.EntityFrameworkCore;

namespace Capstone_2_BE.DALs.Customer
{
    public class CustomerAutoFindDAL : ICustomerAutoFindRepo
    {
        private readonly AppDbContext _context;
        private readonly ILogger<CustomerAutoFindDAL> _logger;

        public CustomerAutoFindDAL(AppDbContext context, ILogger<CustomerAutoFindDAL> logger)
        {
            _context = context;
            _logger = logger;
        }
        public async Task<List<AutoFindFixerResDTO>> AutoFindCustomer(AutoFindFixerDTO autoFindFixerDTO)
        {
            try
            {
                var TechList = await (from a in _context.AccountsModel
                                                        join t in _context.TechnicianProfileModel on a.Id equals t.Id
                                                        join sp in _context.Service_ProfileModel on t.Id equals sp.TechnicianId
                                                        join sc in _context.ServiceCategoriesModel on sp.ServiceId equals sc.Id
                                                        where a.IsOnline == 1 && t.CityId == autoFindFixerDTO.CityId && sp.ServiceId == autoFindFixerDTO.ServiceId
                                                        select new
                                                        {
                                                            TechnicianId = t.Id,
                                                            FullName = t.FullName,
                                                            AvatarURL = t.AvatarURl,
                                                            ServiceName = sc.ServiceName,
                                                            Latitude = t.Latitude,
                                                            Longitude = t.Longitude,
                                                            OrderCount = t.OrderCount,
                                                        }).ToListAsync();
                var result =  new List<AutoFindFixerResDTO>();
                foreach (var tech in TechList)
                {
                    var score = await _context.RatingModel.Where(r => r.TechnicianId == tech.TechnicianId).AverageAsync(r => (decimal?)r.Score) ?? 0;
                    var RatingCount = await _context.RatingModel.Where(r => r.TechnicianId == tech.TechnicianId).CountAsync();
                    result.Add(new AutoFindFixerResDTO
                    {
                        TechnicianId = tech.TechnicianId,
                        FullName = tech.FullName,
                        avatarURL = tech.AvatarURL,
                        ServiceName = tech.ServiceName,
                        Latitude = tech.Latitude,
                        Longitude = tech.Longitude,
                        AvgScore = score,
                        Total = score,
                        OrderCount = tech.OrderCount,
                        RatingCount = RatingCount,
                    });
                }
                return result;
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        public async Task<bool> PlaceAutoOrder(CreateOrderDALDTO placeOrderDALDTO)
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
    }
}
