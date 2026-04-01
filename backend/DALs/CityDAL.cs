using Capstone_2_BE.DTOs.City;
using Capstone_2_BE.Models;
using Capstone_2_BE.Repositories.Administrator;
using Microsoft.EntityFrameworkCore;

namespace Capstone_2_BE.DALs
{
    public class CityDAL : ICityRepo
    {
        private readonly AppDbContext _context;
        private readonly ILogger<CityDAL> _logger;

        public CityDAL(AppDbContext context, ILogger<CityDAL> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<bool> CreateCity(string cityName)
        {
            try
            {
               CitiesModel newCity = new CitiesModel
                {
                    CityName = cityName,
                };
                await _context.CitiesModel.AddAsync(newCity);
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating city.");
                return false;
            }
        }

        public async Task<bool> DeleteCity(Guid cityId)
        {
            try
            {
                int isDelete = await _context.CitiesModel.Where(c => c.Id == cityId).ExecuteDeleteAsync();
                if(isDelete == 0) return false;
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting city.");
                return false;
            }
        }

        public async Task<bool> UpdateCity(Guid cityId, string cityName)
        {
            try
            {
               var isUpdade = await _context.CitiesModel.Where(c => c.Id == cityId).ExecuteUpdateAsync(c => c.SetProperty(c => c.CityName, cityName));
                if(isUpdade == 0) return false;
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating city.");
                return false;
            }
        }

        public async Task<List<ViewAllCities>> ViewAllCities()
        {
            try
            {
                var listCities = await _context.CitiesModel.Select(c => new ViewAllCities
                {
                    CityId = c.Id,
                    CityName = c.CityName
                }).ToListAsync();
                if(listCities == null) return new List<ViewAllCities>();
                return listCities;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting cities.");
                return new List<DTOs.City.ViewAllCities>();
            }
        }
    }
}
