using Capstone_2_BE.DTOs.Admin;
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
        public async Task<List<object>> GetUsers()
        {
            return await _context.AccountsModel
                .Select(u => new
                {
                    id = u.Id,
                    email = u.Email,
                    role = u.Role,
                    createdAt = u.CreateAt, // Đảm bảo khớp frontend
                    isActive = u.IsActive
                })
                .ToListAsync<object>();
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

        // ================= DASHBOARD STATS =================
        public async Task<object> GetDashboardStats()
        {
            var totalUsers = await _context.AccountsModel.CountAsync(x => x.Role == "Customer");
            var totalTechnicians = await _context.AccountsModel.CountAsync(x => x.Role == "Technician");

            var activeTechnicians = await _context.AccountsModel
                .CountAsync(x => x.Role == "Technician" && x.IsOnline == 1);

            var totalRequests = await _context.OrderrModel.CountAsync();

            var pendingRequests = await _context.OrderrModel
                .CountAsync(x => x.Status.Contains("Pending"));

            var completedRequests = await _context.OrderrModel
                .CountAsync(x => x.Status.Contains("Completed"));

            var cancelledRequests = await _context.OrderrModel
                .CountAsync(x => x.Status.Contains("Cancel"));

            return new
            {
                totalUsers,
                totalTechnicians,
                totalRequests,
                pendingRequests,
                completedRequests,
                cancelledRequests,
                activeTechnicians
            };
        }

        // ================= REQUESTS =================
        public async Task<List<object>> GetRequests()
        {
            return await _context.OrderrModel
                .Include(o => o.CustomerProfile)
                .Include(o => o.TechnicianProfile)
                .Include(o => o.ServiceCategories) // Đã sửa: dùng ServiceCategories (đúng với Model bạn gửi)
                .Select(o => new
                {
                    id = o.Id,
                    title = o.Title,
                    status = o.Status,
                    createdAt = o.CreateAt,
                    customer = o.CustomerProfile != null ? o.CustomerProfile.FullName : "N/A",
                    technician = o.TechnicianProfile != null ? o.TechnicianProfile.FullName : "N/A",
                    // Đã sửa: Truy xuất qua ServiceCategories
                    serviceName = o.ServiceCategories != null ? o.ServiceCategories.ServiceName : "Khác"
                })
                .Cast<object>()
                .ToListAsync();
        }        // ================= FEEDBACK =================
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

        // ================= TECHNICIAN ================
        public async Task<List<object>> GetTechniciansFull()
        {
            var data = await (
                from tech in _context.TechnicianProfileModel
                join acc in _context.AccountsModel on tech.Id equals acc.Id
                join city in _context.CitiesModel on tech.CityId equals city.Id into cityGroup
                from city in cityGroup.DefaultIfEmpty()
                join rating in _context.RatingModel on tech.Id equals rating.TechnicianId into ratingsGroup

                select new
                {

                    id = tech.Id,
                    name = tech.FullName,
                    phone = tech.PhoneNumber,
                    description = tech.Description,
                    email = acc.Email,
                    experiences = tech.YearOfExperience,
                    orderCount = tech.OrderCount,
                    address = tech.Address,
                    cityName = city != null ? city.CityName : "Chưa cập nhật",
                    status = acc.IsOnline == 1 ? "san-sang" : "nghi-phep",
                    rating = ratingsGroup.Any() ? Math.Round(ratingsGroup.Average(r => r.Score), 1) : 0,
                    reviews = ratingsGroup.Count(),

                    // Lấy danh sách dịch vụ
                    services = (from sp in _context.Service_ProfileModel
                                join sc in _context.ServiceCategoriesModel on sp.ServiceId equals sc.Id
                                where sp.TechnicianId == tech.Id
                                select sc.ServiceName).ToList()
                }
            ).ToListAsync();

            return data.Cast<object>().ToList();
        }
        public async Task<List<object>> GetTechnicianReviews(Guid technicianId)
        {
            var data = await (
                from r in _context.RatingModel
                join c in _context.CustomerProfileModel
                    on r.CustomerId equals c.Id
                where r.TechnicianId == technicianId
                orderby r.CreateAt descending
                select new
                {
                    ratingId = r.Id,
                    customerName = c.FullName,
                    score = r.Score,
                    feedback = r.Feedback,
                    createdAt = r.CreateAt
                }
            ).ToListAsync();

            return data.Cast<object>().ToList();
        }

        public async Task<object> CreateTechnician(CreateTechnicianDto dto)
{
    // 1. Kiểm tra email đã tồn tại chưa
    var existingAccount = await _context.AccountsModel.FirstOrDefaultAsync(a => a.Email == dto.Email);
    if (existingAccount != null)
    {
        throw new Exception("Email này đã được sử dụng!");
    }

    var accountId = Guid.NewGuid();

    // 2. Tạo Account
    var account = new AccountsModel
    {
        Id = accountId,
        Email = dto.Email,
        Password = "123456", // Nên mã hóa password ở bước thực tế
        Role = "Technician",
        IsActive = 1,
        IsOnline = 0,
        CreateAt = DateTime.Now,
        UpdateAt = DateTime.Now
    };

    // 3. Tạo Profile
    var technician = new TechnicianProfileModel
    {
        Id = accountId, // Id profile = Id account (1-1)
        FullName = dto.FullName,
        PhoneNumber = dto.PhoneNumber,
        Description = dto.Description ?? "Chưa có mô tả",
        YearOfExperience = 10,
        OrderCount = 0,
        AvatarURl = "",
        IdUnique = Guid.NewGuid().ToString(), // Tạo một mã định danh ngẫu nhiên
        CreateAt = DateTime.Now,
        UpdateAt = DateTime.Now
    };

    // 4. Lưu
    _context.AccountsModel.Add(account);
    _context.TechnicianProfileModel.Add(technician);
    await _context.SaveChangesAsync();

    return new { id = accountId, name = dto.FullName };
}
    }
}

