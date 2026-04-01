namespace FastFix.Core.Entities;

public enum BookingStatus
{
    Pending,
    Confirmed,
    InProgress,
    Completed,
    Cancelled,
    Disputed
}

public class Booking : BaseEntity
{
    public Guid RequestId { get; set; }
    public Guid TechnicianId { get; set; }
    public Guid CustomerId { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.Pending;
    public DateOnly ScheduledDate { get; set; }
    public TimeOnly ScheduledTimeStart { get; set; }
    public TimeOnly? ScheduledTimeEnd { get; set; }
    public DateTime? ActualStartTime { get; set; }
    public DateTime? ActualEndTime { get; set; }
    public decimal? QuotedPrice { get; set; }
    public decimal? FinalPrice { get; set; }
    public string? TechnicianNotes { get; set; }
    public string? CustomerNotes { get; set; }
    public string? CheckinPhotoUrl { get; set; }
    public string? CompletionPhotoUrl { get; set; }

    // Navigation Properties
    public RepairRequest Request { get; set; } = null!;
    public TechnicianProfile Technician { get; set; } = null!;
    public User Customer { get; set; } = null!;
    public Review? Review { get; set; }
    public EContract? EContract { get; set; }
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public ChatRoom? ChatRoom { get; set; }
}
