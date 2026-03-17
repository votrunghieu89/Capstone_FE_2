namespace FastFix.API.DTOs;

public record TechnicianProfileUpdateDto(
    string FullName,
    string? Phone,
    string? Bio,
    int ExperienceYears,
    decimal? HourlyRate,
    decimal ServiceRadiusKm,
    string[] Specialties
);

public record TechnicianProfileResponseDto(
    Guid Id,
    string Email,
    string FullName,
    string? Phone,
    string? AvatarUrl,
    string? Bio,
    int ExperienceYears,
    decimal? HourlyRate,
    bool IsAvailable,
    decimal AverageRating,
    int TotalReviews,
    int TotalJobsCompleted,
    decimal ServiceRadiusKm,
    string[] Specialties,
    string Level,
    string Since
);
