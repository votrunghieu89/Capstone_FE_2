using Capstone_2_BE.Models;
using Capstone_2_BE.Repositories.Admin;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Capstone_2_BE.DALs.Admin
{
    public class AdminDAL : IAdminRepo
    {
        private readonly AppDbContext _context;

        public AdminDAL(AppDbContext context)
        {
            _context = context;
        }

        // ================= USERS =================
        public async Task<List<AccountsModel>> GetUsers()
        {
            return await _context.AccountsModel.ToListAsync();
        }

        public async Task<bool> UpdateUserStatus(Guid id, int isActive)
        {
            var user = await _context.AccountsModel.FindAsync(id);
            if (user == null) return false;

            user.IsActive = isActive;
            user.UpdateAt = DateTime.Now;

            await _context.SaveChangesAsync();
            return true;
        }

        // ================= STATS =================
        public async Task<List<object>> GetUserStats()
        {
            return await _context.AccountsModel
                .GroupBy(x => new { x.CreateAt.Year, x.CreateAt.Month })
                .Select(g => new
                {
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    Count = g.Count()
                })
                .ToListAsync<object>();
        }

        public async Task<List<object>> GetOrderStats()
        {
            return await _context.OrderrModel
                .GroupBy(x => new { x.CreateAt.Year, x.CreateAt.Month })
                .Select(g => new
                {
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    Count = g.Count()
                })
                .ToListAsync<object>();
        }

        // ================= FEEDBACK =================
        public async Task<List<object>> GetFeedback()
        {
            return await _context.RatingModel
                .Include(r => r.TechnicianProfile)
                .Include(r => r.CustomerProfile)
                .Include(r => r.Orders)
                .Select(r => new
                {
                    r.Id,
                    r.Score,
                    r.Feedback,
                    r.CreateAt,
                    Technician = r.TechnicianProfile.FullName,
                    Customer = r.CustomerProfile.FullName,
                    OrderTitle = r.Orders.Title
                })
                .ToListAsync<object>();
        }

        public async Task<bool> DeleteFeedback(Guid id)
        {
            var fb = await _context.RatingModel.FindAsync(id);
            if (fb == null) return false;

            _context.RatingModel.Remove(fb);
            await _context.SaveChangesAsync();
            return true;
        }

        // ================= TECHNICIAN =================
        public async Task<List<object>> GetTechnicians()
        {
            return await _context.TechnicianProfileModel
                .Include(t => t.CitiesModel)
                .Select(t => new
                {
                    t.Id,
                    t.FullName,
                    t.PhoneNumber,
                    t.Description,
                    t.Experiences,
                    t.OrderCount,
                    City = t.CitiesModel != null ? t.CitiesModel.CityName : null
                })
                .ToListAsync<object>();
        }
    }
}