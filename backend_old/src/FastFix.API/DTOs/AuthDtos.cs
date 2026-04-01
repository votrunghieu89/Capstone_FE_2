namespace FastFix.API.DTOs;

// ── Register ──
public record RegisterRequest(
    string Email,
    string Password,
    string FullName,
    string? Phone
);

// ── Login ──
public record LoginRequest(
    string Email,
    string Password
);

// ── Auth Response ──
public record AuthResponse(
    Guid Id,
    string Email,
    string FullName,
    string? Phone,
    string? AvatarUrl,
    string Role,
    string Token
);
