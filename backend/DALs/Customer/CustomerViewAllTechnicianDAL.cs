using Capstone_2_BE.DTOs.Customer.FindTechnician;
using Capstone_2_BE.DTOs.Customer.Order;
using Capstone_2_BE.Models;
using Capstone_2_BE.Repositories.Customer;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Capstone_2_BE.DALs.Customer
{
    public class CustomerViewAllTechnicianDAL : ICustomerViewAllTechnicianRepo
    {
        public readonly AppDbContext _context;
        public readonly ILogger<CustomerViewAllTechnicianDAL> _logger;
        public readonly string?  _SQLconnection;

        public CustomerViewAllTechnicianDAL(AppDbContext context, ILogger<CustomerViewAllTechnicianDAL> logger, IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _SQLconnection = configuration.GetConnectionString("DefaultConnection");
        }

        public async Task<List<ViewAllTechnicianDTO>> FilterTechnicianbyArea(Guid CityId)
        {
            try
            {
                var result = await (
                                      from tp in _context.TechnicianProfileModel

                                      join sp in _context.Service_ProfileModel
                                          on tp.Id equals sp.TechnicianId into spGroup
                                      from sp in spGroup.DefaultIfEmpty()

                                      join s in _context.ServiceCategoriesModel
                                          on sp.ServiceId equals s.Id into sGroup
                                      from s in sGroup.DefaultIfEmpty()

                                      where tp.CityId == CityId

                                      select new ViewAllTechnicianDTO
                                      {
                                          TechnicianId = tp.Id,
                                          TechnicianName = tp.FullName,
                                          AvatarUrl = tp.AvatarURl,
                                          ServiceId = s != null ? s.Id : Guid.Empty,
                                          ServiceName = s != null ? s.ServiceName : "",
                                          OrderCount = tp.OrderCount,
                                          RatingCount = _context.RatingModel.Count(r => r.TechnicianId == tp.Id),
                                          AverageRating = _context.RatingModel
                                              .Where(r => r.TechnicianId == tp.Id)
                                              .Select(r => (decimal?)r.Score)
                                              .Average() ?? 0
                                      }
                                  ).ToListAsync();

                return result;
            }
            catch (Exception ex)
            {
                return new List<ViewAllTechnicianDTO>();
            }
        }

        public async Task<List<ViewAllTechnicianDTO>> FilterTechnicianbyRate(decimal startRate, decimal endRate)
        {
            try
            {
                var result = new List<ViewAllTechnicianDTO>();
                using (var connection = new SqlConnection(_SQLconnection))
                {
                    await connection.OpenAsync();
                    var query = @"
                                    SELECT 
                                        tp.Id As TechnicianId,
                                        tp.FullName,
                                        tp.AvatarURl,   
                                        s.Id AS ServiceId,
                                        s.ServiceName,
                                        tp.OrderCount,
                                        COUNT(r.Id) AS RatingCount,
                                        AVG(r.Score) AS AverageRating
                                    FROM TechnicianProfile tp
                                    JOIN Service_Profile sp ON tp.Id = sp.TechnicianId
                                    JOIN ServiceCategories s ON sp.ServiceId = s.Id
                                    LEFT JOIN Rating r ON tp.Id = r.TechnicianId
                                    GROUP BY tp.Id, tp.FullName, s.Id, s.ServiceName, tp.OrderCount, tp.AvatarURl
                                    HAVING AVG(r.Score) BETWEEN @startRate AND @endRate
                                ";
                    using (var command = new SqlCommand(query, connection))
                    {
                        command.Parameters.AddWithValue("@startRate", startRate);
                        command.Parameters.AddWithValue("@endRate", endRate);

                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                result.Add(new ViewAllTechnicianDTO
                                {
                                    TechnicianId = reader.GetGuid(reader.GetOrdinal("TechnicianId")),
                                    TechnicianName = reader.GetString(reader.GetOrdinal("FullName")),

                                    ServiceId = reader.GetGuid(reader.GetOrdinal("ServiceId")),
                                    ServiceName = reader.GetString(reader.GetOrdinal("ServiceName")),

                                    OrderCount = reader.GetInt32(reader.GetOrdinal("OrderCount")),
                                    RatingCount = reader.GetInt32(reader.GetOrdinal("RatingCount")),

                                    AverageRating = reader.IsDBNull(reader.GetOrdinal("AverageRating"))
                                                     ? 0
                                                     : reader.GetDecimal(reader.GetOrdinal("AverageRating")),

                                    AvatarUrl = reader.IsDBNull(reader.GetOrdinal("AvatarURl"))
                                                     ? null
                                                     : reader.GetString(reader.GetOrdinal("AvatarURl"))
                                });
                            }
                        }
                    }
                    return result;
                }
            }
            catch (Exception ex)
            {
                return new List<ViewAllTechnicianDTO>();
            }
        }

        public async Task<List<ViewAllTechnicianDTO>> FilterTechnicianbyService(Guid serviceId)
        {
            try
            {
                var result = await (
                                     from tp in _context.TechnicianProfileModel

                                     join sp in _context.Service_ProfileModel
                                         on tp.Id equals sp.TechnicianId into spGroup
                                     from sp in spGroup.DefaultIfEmpty()

                                     join s in _context.ServiceCategoriesModel
                                         on sp.ServiceId equals s.Id into sGroup
                                     from s in sGroup.DefaultIfEmpty()

                                     where sp != null && sp.ServiceId == serviceId

                                     select new ViewAllTechnicianDTO
                                     {
                                         TechnicianId = tp.Id,
                                         TechnicianName = tp.FullName,
                                         AvatarUrl = tp.AvatarURl,
                                         ServiceId = s != null ? s.Id : Guid.Empty,
                                         ServiceName = s != null ? s.ServiceName : "",
                                         OrderCount = tp.OrderCount,
                                         RatingCount = _context.RatingModel.Count(r => r.TechnicianId == tp.Id),
                                         AverageRating = _context.RatingModel
                                             .Where(r => r.TechnicianId == tp.Id)
                                             .Select(r => (decimal?)r.Score)
                                             .Average() ?? 0
                                     }
                                 ).ToListAsync();

                return result;
            }
            catch (Exception ex)
            {
                return new List<ViewAllTechnicianDTO>();
            }
        }

        public async Task<List<ViewAllTechnicianDTO>> FilterTechnicians(
      decimal? startRate,
      decimal? endRate,
      Guid? cityId,
      Guid? serviceId)
        {
            try
            {
                var baseQuery =
                    from tp in _context.TechnicianProfileModel
                    join sp in _context.Service_ProfileModel on tp.Id equals sp.TechnicianId
                    join s in _context.ServiceCategoriesModel on sp.ServiceId equals s.Id
                    select new
                    {
                        tp,
                        sp,
                        s
                    };

                if (cityId.HasValue)
                {
                    baseQuery = baseQuery.Where(x => x.tp.CityId == cityId.Value);
                }

                if (serviceId.HasValue)
                {
                    baseQuery = baseQuery.Where(x => x.sp.ServiceId == serviceId.Value);
                }

                var resultQuery = baseQuery
                    .Select(x => new ViewAllTechnicianDTO
                    {
                        TechnicianId = x.tp.Id,
                        TechnicianName = x.tp.FullName,
                        AvatarUrl = x.tp.AvatarURl,
                        ServiceId = x.s.Id,
                        ServiceName = x.s.ServiceName,
                        OrderCount = x.tp.OrderCount,
                        RatingCount = _context.RatingModel.Count(r => r.TechnicianId == x.tp.Id),
                        AverageRating = _context.RatingModel
                            .Where(r => r.TechnicianId == x.tp.Id)
                            .Select(r => (decimal?)r.Score)
                            .Average() ?? 0
                    });

                if (startRate.HasValue && endRate.HasValue)
                {
                    resultQuery = resultQuery.Where(x =>
                        x.AverageRating >= startRate.Value &&
                        x.AverageRating <= endRate.Value);
                }

                return await resultQuery.ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in FilterTechnicians");
                return new List<ViewAllTechnicianDTO>();
            }
        }

        public async Task<bool> PlaceOrderForTechnician(CreateOrderDALDTO placeOrderDALDTO)
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
                                CreateAt = DateTime.Now
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

        public async Task<List<ViewAllTechnicianDTO>> SearchTechnicianbyName(string FullName)
        {
            try
            {
                var result = await (
                                     from tp in _context.TechnicianProfileModel

                                     join sp in _context.Service_ProfileModel
                                         on tp.Id equals sp.TechnicianId into spGroup
                                     from sp in spGroup.DefaultIfEmpty()

                                     join s in _context.ServiceCategoriesModel
                                         on sp.ServiceId equals s.Id into sGroup
                                     from s in sGroup.DefaultIfEmpty()

                                     where tp.FullName.ToLower().Contains(FullName.ToLower())

                                     select new ViewAllTechnicianDTO
                                     {
                                         TechnicianId = tp.Id,
                                         TechnicianName = tp.FullName,
                                         AvatarUrl = tp.AvatarURl,
                                         ServiceId = s != null ? s.Id : Guid.Empty,
                                         ServiceName = s != null ? s.ServiceName : "",
                                         OrderCount = tp.OrderCount,
                                         RatingCount = _context.RatingModel.Count(r => r.TechnicianId == tp.Id),
                                         AverageRating = _context.RatingModel
                                             .Where(r => r.TechnicianId == tp.Id)
                                             .Select(r => (decimal?)r.Score)
                                             .Average() ?? 0
                                     }
                                 ).ToListAsync();

                return result;
            }
            catch (Exception ex)
            {
                return new List<ViewAllTechnicianDTO>();
            }
        }

        public async Task<List<ViewAllTechnicianDTO>> ViewALLTechnician()
        {
            try
            {
                var result = await (
                                     from tp in _context.TechnicianProfileModel

                                     join sp in _context.Service_ProfileModel
                                         on tp.Id equals sp.TechnicianId into spGroup
                                     from sp in spGroup.DefaultIfEmpty()

                                     join s in _context.ServiceCategoriesModel
                                         on sp.ServiceId equals s.Id into sGroup
                                     from s in sGroup.DefaultIfEmpty()

                                     select new ViewAllTechnicianDTO
                                     {
                                         TechnicianId = tp.Id,
                                         TechnicianName = tp.FullName,
                                         AvatarUrl = tp.AvatarURl,
                                         ServiceId = s != null ? s.Id : Guid.Empty,
                                         ServiceName = s != null ? s.ServiceName : "",
                                         OrderCount = tp.OrderCount,
                                         RatingCount = _context.RatingModel.Count(r => r.TechnicianId == tp.Id),
                                         AverageRating = _context.RatingModel
                                             .Where(r => r.TechnicianId == tp.Id)
                                             .Select(r => (decimal?)r.Score)
                                             .Average() ?? 0
                                     }
                                 ).ToListAsync();

                return result;
            }
            catch (Exception ex)
            {
                return new List<ViewAllTechnicianDTO>();
            }
        }
    }
}