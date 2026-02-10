namespace FastFix.Core.Entities;

public class TechnicianProfile : BaseEntity
{
    public Guid UserId { get; set; }
    public string? Bio { get; set; }
    public int ExperienceYears { get; set; }
    public decimal? HourlyRate { get; set; }
    public bool IsAvailable { get; set; } = true;
    public decimal AverageRating { get; set; } = 0;
    public int TotalReviews { get; set; } = 0;
    public int TotalJobsCompleted { get; set; } = 0;
    public decimal ServiceRadiusKm { get; set; } = 10;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public DateTime? LastLocationUpdate { get; set; }
    public DateTime? VerifiedAt { get; set; }

    // Navigation Properties
    public User User { get; set; } = null!;
    public ICollection<TechnicianSkill> TechnicianSkills { get; set; } = new List<TechnicianSkill>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public ICollection<Schedule> Schedules { get; set; } = new List<Schedule>();
}
