using Capstone_2_BE.DTOs.Technician.Profile;
using Capstone_2_BE.Models;
using Capstone_2_BE.Repositories.Technician;
using Microsoft.EntityFrameworkCore;

namespace Capstone_2_BE.DALs.Technician
{
    public class TechnicianProfileDAL : ITechnicianProfileRepo
    {
        private readonly AppDbContext _context;
        private readonly ILogger _logger;

        public TechnicianProfileDAL(AppDbContext context, ILogger<TechnicianProfileDAL> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<string> GetOldAvatar(Guid technicianId)
        {
            try
            {
                string? oldAvatar = await _context.TechnicianProfileModel
                    .Where(t => t.Id == technicianId)
                    .Select(t => t.AvatarURl)
                    .FirstOrDefaultAsync();
                return oldAvatar;
            }
            catch(Exception ex)
            {
                Console.WriteLine("Error retrieving old avatar: " + ex.Message);
                return null;
            }
             
        }

        public async Task<TechnicianProfileViewDTO> GetTechnicianProfile(Guid technicianId)
        {
            try
            {
                var avgScore = await _context.RatingModel
                    .Where(r => r.TechnicianId == technicianId)
                    .AverageAsync(r => (double?)r.Score) ?? 0.0;
                var totalRatings = await _context.RatingModel
                    .Where(r => r.TechnicianId == technicianId)
                    .CountAsync();
                var result = await (
                                      from t in _context.TechnicianProfileModel

                                      join sp in _context.Service_ProfileModel
                                          on t.Id equals sp.TechnicianId into spGroup
                                      from sp in spGroup.DefaultIfEmpty()

                                      join s in _context.ServiceCategoriesModel
                                          on sp.ServiceId equals s.Id into sGroup
                                      from s in sGroup.DefaultIfEmpty()

                                      join a in _context.AccountsModel
                                          on t.Id equals a.Id into aGroup
                                      from a in aGroup.DefaultIfEmpty()

                                      join ct in _context.CitiesModel
                                          on t.CityId equals ct.Id into cGroup
                                      from ct in cGroup.DefaultIfEmpty()
                                      where t.Id == technicianId
                                      select new TechnicianProfileViewDTO
                                      {
                                          Email = a.Email,
                                          FullName = t.FullName,
                                          AvatarURL = t.AvatarURl,
                                          PhoneNumber = t.PhoneNumber,
                                          Address = t.Address,
                                          City = ct.CityName,
                                          AverageRating = (decimal)avgScore,
                                          TotalRating = totalRatings,
                                          TotalOrders = t.OrderCount,
                                          CreateAt = t.CreateAt,
                                          ServiceName = s != null ? s.ServiceName : null,
                                          Description = t.Description,
                                          Experiences = t.Experiences
                                      }
                                      ).FirstOrDefaultAsync();

                return result;
            }
            catch(Exception ex)
            {
                Console.WriteLine("Error retrieving technician profile: " + ex.Message);
                return null;
            }
        }

        public async Task<bool> UpdateTechnicianProfile(TechnicianProfileUpdateDALDTO technicianProfileUpdateDTO)
        {
            try
            {
                using (var transaction = await _context.Database.BeginTransactionAsync())
                {
                   int isUpdateInfor = await _context.TechnicianProfileModel.Where(t => t.Id == technicianProfileUpdateDTO.Id).ExecuteUpdateAsync(t => t
                        .SetProperty(p => p.FullName, technicianProfileUpdateDTO.FullName)
                        .SetProperty(p => p.PhoneNumber, technicianProfileUpdateDTO.PhoneNumber)
                        .SetProperty(p => p.Address, technicianProfileUpdateDTO.Address)
                        .SetProperty(p => p.CityId, technicianProfileUpdateDTO.CityId)
                        .SetProperty(p => p.Latitude, technicianProfileUpdateDTO.Latitude)
                        .SetProperty(p => p.Longitude, technicianProfileUpdateDTO.Longitude)
                        .SetProperty(p => p.Description, technicianProfileUpdateDTO.Description)
                        .SetProperty(p => p.Experiences, technicianProfileUpdateDTO.Experiences)
                    );
                    if (isUpdateInfor == 0)
                    {
                        _logger.LogWarning("No technician profile found with ID: {TechnicianId}", technicianProfileUpdateDTO.Id);
                        return false;
                    }
                    if(technicianProfileUpdateDTO.AvatarURl != null)
                    {
                        int isUpdateAvatar = await _context.TechnicianProfileModel.Where(a => a.Id == technicianProfileUpdateDTO.Id).ExecuteUpdateAsync(a => a
                            .SetProperty(p => p.AvatarURl, technicianProfileUpdateDTO.AvatarURl)
                        );
                        if (isUpdateAvatar == 0)
                        {
                            _logger.LogWarning("No account found with ID: {TechnicianId} for avatar update", technicianProfileUpdateDTO.Id);
                            return false;
                        }
                    }
                    var serviceProfile = await _context.Service_ProfileModel.FirstOrDefaultAsync(s => s.TechnicianId == technicianProfileUpdateDTO.Id);

                    if (serviceProfile != null)
                    {
                        serviceProfile.ServiceId = technicianProfileUpdateDTO.ServiceId;
                    }
                    else
                    {
                        _context.Service_ProfileModel.Add(new Service_ProfileModel
                        {
                            TechnicianId = technicianProfileUpdateDTO.Id,
                            ServiceId = technicianProfileUpdateDTO.ServiceId,
                            CreateAt = DateTime.Now,
                        });
                    }

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();
                    return true;

                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error updating technician profile: " + ex.Message);
                return false;
            }
        }
    }
}
