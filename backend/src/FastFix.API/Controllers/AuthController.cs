using FastFix.API.DTOs;
using FastFix.Core.Entities;
using FastFix.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace FastFix.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly FastFixDbContext _db;
    private readonly IConfiguration _config;

    public AuthController(FastFixDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    // ── POST /api/auth/register ──
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest req)
    {
        // Check duplicate email
        if (await _db.Users.AnyAsync(u => u.Email == req.Email.ToLower()))
            return Conflict(new { message = "Email đã được sử dụng." });

        // Create user
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = req.Email.ToLower().Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            FullName = req.FullName.Trim(),
            Phone = req.Phone?.Trim(),
            Role = UserRole.Customer,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var token = GenerateJwtToken(user);
        return Ok(ToAuthResponse(user, token));
    }

    // ── POST /api/auth/login ──
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest req)
    {
        Console.WriteLine($"[Login Attempt] Email='{req?.Email}' Password Length={req?.Password?.Length}");
        if (req == null || string.IsNullOrEmpty(req.Email) || string.IsNullOrEmpty(req.Password)) 
            return BadRequest(new { message = "Invalid request format." });

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == req.Email.ToLower());

        if (user == null) {
            Console.WriteLine($"[Login Failed] User not found for email: {req.Email.ToLower()}");
            return Unauthorized(new { message = "Email hoặc mật khẩu không đúng." });
        }

        if (!BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash)) {
            Console.WriteLine($"[Login Failed] Invalid password for: {req.Email}");
            return Unauthorized(new { message = "Email hoặc mật khẩu không đúng." });
        }

        if (!user.IsActive)
            return Unauthorized(new { message = "Tài khoản đã bị khóa." });

        var token = GenerateJwtToken(user);
        return Ok(ToAuthResponse(user, token));
    }

    // ── GET /api/auth/me ──
    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<AuthResponse>> GetMe()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var user = await _db.Users.FindAsync(Guid.Parse(userId));
        if (user == null) return NotFound();

        return Ok(ToAuthResponse(user, null));
    }

    // ── Helpers ──
    private string GenerateJwtToken(User user)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Jwt:Secret"] ?? "default-secret-key"));

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };

        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiryMinutes = int.Parse(_config["Jwt:ExpiryInMinutes"] ?? "60");

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    // ── POST /api/auth/seed-admin (Temporary endpoint) ──
    [HttpPost("seed-admin")]
    public async Task<ActionResult> SeedAdmin()
    {
        var adminEmail = "admin@fastfix.com";
        var exists = await _db.Users.AnyAsync(u => u.Email == adminEmail);
        
        if (exists)
            return Conflict(new { message = "Admin user already exists." });

        var adminUser = new User
        {
            Id = Guid.NewGuid(),
            Email = adminEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
            FullName = "Administrator",
            Role = UserRole.Admin,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Users.Add(adminUser);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Admin user created successfully", email = adminEmail, password = "Admin@123" });
    }

    // ── POST /api/auth/seed-technician (Temporary endpoint) ──
    [HttpPost("seed-technician")]
    public async Task<ActionResult> SeedTechnician()
    {
        var techEmail = "tech@fastfix.com";
        var exists = await _db.Users.AnyAsync(u => u.Email == techEmail);
        
        if (exists)
            return Conflict(new { message = "Technician user already exists." });

        var techUser = new User
        {
            Id = Guid.NewGuid(),
            Email = techEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Tech@123"),
            FullName = "Technician User",
            Role = UserRole.Technician,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Users.Add(techUser);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Technician user created successfully", email = techEmail, password = "Tech@123" });
    }

    private static AuthResponse ToAuthResponse(User user, string? token) => new(
        Id: user.Id,
        Email: user.Email,
        FullName: user.FullName,
        Phone: user.Phone,
        AvatarUrl: user.AvatarUrl,
        Role: user.Role.ToString(),
        Token: token ?? ""
    );
}
