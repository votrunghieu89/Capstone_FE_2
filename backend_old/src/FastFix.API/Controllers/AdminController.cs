using FastFix.API.DTOs;
using FastFix.Core.Entities;
using FastFix.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FastFix.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly FastFixDbContext _db;

    public AdminController(FastFixDbContext db)
    {
        _db = db;
    }

    // ── GET /api/admin/stats ──
    [HttpGet("stats")]
    public async Task<ActionResult<AdminStatsResponse>> GetStats()
    {
        var totalUsers = await _db.Users.CountAsync(u => u.Role == UserRole.Customer);
        var totalTechnicians = await _db.Users.CountAsync(u => u.Role == UserRole.Technician);
        var activeTechnicians = await _db.TechnicianProfiles.CountAsync(t => t.IsAvailable);

        var totalRequests = await _db.RepairRequests.CountAsync();
        var pendingRequests = await _db.RepairRequests.CountAsync(r =>
            r.Status == RequestStatus.Pending || r.Status == RequestStatus.Diagnosed || r.Status == RequestStatus.Matched);
        var completedRequests = await _db.RepairRequests.CountAsync(r => r.Status == RequestStatus.Completed);
        var cancelledRequests = await _db.RepairRequests.CountAsync(r => r.Status == RequestStatus.Cancelled);

        return Ok(new AdminStatsResponse(
            TotalUsers: totalUsers,
            TotalTechnicians: totalTechnicians,
            TotalRequests: totalRequests,
            PendingRequests: pendingRequests,
            CompletedRequests: completedRequests,
            CancelledRequests: cancelledRequests,
            ActiveTechnicians: activeTechnicians
        ));
    }

    // ── GET /api/admin/users ──
    [HttpGet("users")]
    public async Task<ActionResult<List<UserListItem>>> GetUsers([FromQuery] string? role, [FromQuery] string? search)
    {
        var query = _db.Users.AsQueryable();

        if (!string.IsNullOrEmpty(role) && Enum.TryParse<UserRole>(role, true, out var roleEnum))
            query = query.Where(u => u.Role == roleEnum);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(u => u.FullName.Contains(search) || u.Email.Contains(search));

        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new UserListItem(
                u.Id, u.Email, u.FullName, u.Phone,
                u.Role.ToString(), u.IsActive, u.CreatedAt))
            .ToListAsync();

        return Ok(users);
    }

    // ── PUT /api/admin/users/{id}/toggle-active ──
    [HttpPut("users/{id:guid}/toggle-active")]
    public async Task<IActionResult> ToggleUserActive(Guid id, [FromBody] ToggleUserActiveDto dto)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound(new { message = "Không tìm thấy người dùng." });

        user.IsActive = dto.IsActive;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Cập nhật thành công." });
    }

    // ── GET /api/admin/technicians ──
    [HttpGet("technicians")]
    public async Task<ActionResult<List<TechnicianListItem>>> GetTechnicians([FromQuery] string? search)
    {
        var query = _db.Users
            .Where(u => u.Role == UserRole.Technician)
            .Include(u => u.TechnicianProfile)
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(u => u.FullName.Contains(search) || u.Email.Contains(search));

        var technicians = await query
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new TechnicianListItem(
                u.TechnicianProfile != null ? u.TechnicianProfile.Id : Guid.Empty,
                u.Id,
                u.FullName,
                u.Email,
                u.Phone,
                u.Address,
                u.TechnicianProfile != null ? u.TechnicianProfile.IsAvailable : false,
                u.TechnicianProfile != null ? u.TechnicianProfile.AverageRating : 0,
                u.TechnicianProfile != null ? u.TechnicianProfile.TotalReviews : 0,
                u.TechnicianProfile != null ? u.TechnicianProfile.TotalJobsCompleted : 0,
                u.TechnicianProfile != null ? u.TechnicianProfile.ExperienceYears : 0,
                u.TechnicianProfile != null ? u.TechnicianProfile.HourlyRate : null,
                u.IsActive,
                u.CreatedAt
            ))
            .ToListAsync();

        return Ok(technicians);
    }

    // ── POST /api/admin/technicians ──
    [HttpPost("technicians")]
    public async Task<IActionResult> CreateTechnician([FromBody] CreateTechnicianRequest req)
    {
        if (await _db.Users.AnyAsync(u => u.Email == req.Email.ToLower()))
            return Conflict(new { message = "Email đã được sử dụng." });

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = req.Email.ToLower().Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            FullName = req.FullName.Trim(),
            Phone = req.Phone?.Trim(),
            Address = req.Address?.Trim(),
            Role = UserRole.Technician,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Users.Add(user);

        var profile = new TechnicianProfile
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Bio = req.Bio,
            ExperienceYears = req.ExperienceYears,
            HourlyRate = req.HourlyRate,
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.TechnicianProfiles.Add(profile);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Thêm kỹ thuật viên thành công.", id = user.Id });
    }

    // ── PUT /api/admin/technicians/{id}/toggle-active ──
    [HttpPut("technicians/{id:guid}/toggle-active")]
    public async Task<IActionResult> ToggleTechnicianActive(Guid id, [FromBody] ToggleUserActiveDto dto)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null || user.Role != UserRole.Technician)
            return NotFound(new { message = "Không tìm thấy kỹ thuật viên." });

        user.IsActive = dto.IsActive;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Cập nhật thành công." });
    }

    // ── DELETE /api/admin/technicians/{id} ──
    [HttpDelete("technicians/{id:guid}")]
    public async Task<IActionResult> DeleteTechnician(Guid id)
    {
        var user = await _db.Users
            .Include(u => u.TechnicianProfile)
            .FirstOrDefaultAsync(u => u.Id == id && u.Role == UserRole.Technician);

        if (user == null)
            return NotFound(new { message = "Không tìm thấy kỹ thuật viên." });

        if (user.TechnicianProfile != null)
            _db.TechnicianProfiles.Remove(user.TechnicianProfile);

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Xoá kỹ thuật viên thành công." });
    }

    // ── GET /api/admin/requests ──
    [HttpGet("requests")]
    public async Task<ActionResult<List<RepairRequestListItem>>> GetRequests(
        [FromQuery] string? status, [FromQuery] string? search)
    {
        var query = _db.RepairRequests
            .Include(r => r.Customer)
            .Include(r => r.Category)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status))
        {
            // Normalize: "in_progress" → "InProgress" for enum parsing
            var normalized = string.Concat(
                status.Split('_', '-')
                      .Select(w => char.ToUpper(w[0]) + w.Substring(1).ToLower()));
            if (Enum.TryParse<RequestStatus>(normalized, true, out var statusEnum))
                query = query.Where(r => r.Status == statusEnum);
        }

        if (!string.IsNullOrEmpty(search))
            query = query.Where(r => r.Title.Contains(search) || r.Customer.FullName.Contains(search));

        var requests = await query
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new RepairRequestListItem(
                r.Id,
                r.Customer.FullName,
                r.Customer.Phone ?? "",
                r.Title,
                r.Description,
                r.Status.ToString().ToLower(),
                r.Urgency.ToString().ToLower(),
                r.Address,
                r.CreatedAt,
                r.Category != null ? r.Category.Name : null,
                r.AiEstimatedCost
            ))
            .ToListAsync();

        return Ok(requests);
    }

    // ── PUT /api/admin/requests/{id}/status ──
    [HttpPut("requests/{id:guid}/status")]
    public async Task<IActionResult> UpdateRequestStatus(Guid id, [FromBody] UpdateRequestStatusDto dto)
    {
        var request = await _db.RepairRequests.FindAsync(id);
        if (request == null) return NotFound(new { message = "Không tìm thấy yêu cầu." });

        // Normalize snake_case → PascalCase
        var normalized = string.Concat(
            dto.Status.Split('_', '-')
                      .Select(w => char.ToUpper(w[0]) + w.Substring(1).ToLower()));

        if (!Enum.TryParse<RequestStatus>(normalized, true, out var newStatus))
            return BadRequest(new { message = "Trạng thái không hợp lệ." });

        request.Status = newStatus;
        await _db.SaveChangesAsync();
        return Ok(new { message = "Cập nhật trạng thái thành công." });
    }
}
