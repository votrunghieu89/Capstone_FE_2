namespace FastFix.API.DTOs;

// ── Admin Stats ──
public record AdminStatsResponse(
    int TotalUsers,
    int TotalTechnicians,
    int TotalRequests,
    int PendingRequests,
    int CompletedRequests,
    int CancelledRequests,
    int ActiveTechnicians
);

// ── Technician List ──
public record TechnicianListItem(
    Guid Id,
    Guid UserId,
    string FullName,
    string Email,
    string? Phone,
    string? Address,
    bool IsAvailable,
    decimal AverageRating,
    int TotalReviews,
    int TotalJobsCompleted,
    int ExperienceYears,
    decimal? HourlyRate,
    bool IsActive,
    DateTime CreatedAt
);

// ── Technician Create/Update ──
public record CreateTechnicianRequest(
    string FullName,
    string Email,
    string Password,
    string? Phone,
    string? Address,
    int ExperienceYears,
    decimal? HourlyRate,
    string? Bio
);

// ── Request List ──
public record RepairRequestListItem(
    Guid Id,
    string CustomerName,
    string CustomerPhone,
    string Title,
    string Description,
    string Status,
    string Urgency,
    string Address,
    DateTime CreatedAt,
    string? CategoryName,
    decimal? AiEstimatedCost
);

// ── Update Request Status ──
public record UpdateRequestStatusDto(string Status);

// ── User List ──
public record UserListItem(
    Guid Id,
    string Email,
    string FullName,
    string? Phone,
    string Role,
    bool IsActive,
    DateTime CreatedAt
);

// ── Toggle User Active ──
public record ToggleUserActiveDto(bool IsActive);
