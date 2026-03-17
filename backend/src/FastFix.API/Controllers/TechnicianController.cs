using FastFix.API.DTOs;
using FastFix.Core.Entities;
using FastFix.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FastFix.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Technician")]
public class TechnicianController : ControllerBase
{
    private readonly FastFixDbContext _db;

    public TechnicianController(FastFixDbContext db)
    {
        _db = db;
    }

    // ── GET /api/technician/profile ──
    [HttpGet("profile")]
    public async Task<ActionResult<TechnicianProfileResponseDto>> GetProfile()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var user = await _db.Users
            .Include(u => u.TechnicianProfile)
            .ThenInclude(tp => tp!.TechnicianSkills)
            .ThenInclude(ts => ts.Skill)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null || user.TechnicianProfile == null)
            return NotFound(new { message = "Technician profile not found." });

        var profile = user.TechnicianProfile;
        
        var specialties = profile.TechnicianSkills
            .Select(ts => ts.Skill.Name)
            .ToArray();

        return Ok(new TechnicianProfileResponseDto(
            Id: user.Id,
            Email: user.Email,
            FullName: user.FullName,
            Phone: user.Phone,
            AvatarUrl: user.AvatarUrl,
            Bio: profile.Bio,
            ExperienceYears: profile.ExperienceYears,
            HourlyRate: profile.HourlyRate,
            IsAvailable: profile.IsAvailable,
            AverageRating: profile.AverageRating,
            TotalReviews: profile.TotalReviews,
            TotalJobsCompleted: profile.TotalJobsCompleted,
            ServiceRadiusKm: profile.ServiceRadiusKm,
            Specialties: specialties,
            Level: GetLevel(profile.TotalJobsCompleted),
            Since: profile.CreatedAt.ToString("MMMM, yyyy")
        ));
    }

    // ── PUT /api/technician/profile ──
    [HttpPut("profile")]
    public async Task<ActionResult> UpdateProfile([FromBody] TechnicianProfileUpdateDto req)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var user = await _db.Users
            .Include(u => u.TechnicianProfile)
            .ThenInclude(tp => tp!.TechnicianSkills)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null || user.TechnicianProfile == null)
            return NotFound(new { message = "Technician profile not found." });

        // Update User info
        user.FullName = req.FullName;
        user.Phone = req.Phone;
        user.UpdatedAt = DateTime.UtcNow;

        // Update Profile info
        var profile = user.TechnicianProfile;
        profile.Bio = req.Bio;
        profile.ExperienceYears = req.ExperienceYears;
        profile.HourlyRate = req.HourlyRate;
        profile.ServiceRadiusKm = req.ServiceRadiusKm;
        profile.UpdatedAt = DateTime.UtcNow;

        // Update Skills (Simplified replacement)
        if (req.Specialties != null)
        {
            // Remove old skills
            _db.TechnicianSkills.RemoveRange(profile.TechnicianSkills);
            
            // Add new skills (assuming skills already exist in the DB by name)
            foreach (var skillName in req.Specialties)
            {
                var skill = await _db.Skills.FirstOrDefaultAsync(s => s.Name.ToLower() == skillName.ToLower());
                if (skill != null)
                {
                    _db.TechnicianSkills.Add(new TechnicianSkill
                    {
                        TechnicianId = profile.Id,
                        SkillId = skill.Id
                    });
                }
            }
        }

        await _db.SaveChangesAsync();
        return Ok(new { message = "Profile updated successfully" });
    }

    private Guid? GetUserId()
    {
        var sid = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return sid != null ? Guid.Parse(sid) : null;
    }

    private string GetLevel(int jobs)
    {
        if (jobs >= 100) return "Chuyên Gia Vàng";
        if (jobs >= 50) return "Chuyên Gia Bạc";
        return "Thành Viên Mới";
    }
}
