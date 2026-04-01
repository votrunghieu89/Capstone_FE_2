namespace FastFix.Core.Entities;

public enum RequestStatus
{
    Pending,
    Diagnosed,
    Matched,
    Accepted,
    InProgress,
    Completed,
    Cancelled
}

public enum UrgencyLevel
{
    Low,
    Medium,
    High,
    Emergency
}

public enum MediaType
{
    Image,
    Audio,
    Video
}

public class RepairRequest : BaseEntity
{
    public Guid CustomerId { get; set; }
    public int? CategoryId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public RequestStatus Status { get; set; } = RequestStatus.Pending;
    public UrgencyLevel Urgency { get; set; } = UrgencyLevel.Medium;
    public string Address { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string? AiDiagnosis { get; set; }
    public decimal? AiEstimatedCost { get; set; }
    public decimal? AiSeverityScore { get; set; }
    public DateOnly? PreferredDate { get; set; }
    public TimeOnly? PreferredTimeStart { get; set; }
    public TimeOnly? PreferredTimeEnd { get; set; }

    // Navigation Properties
    public User Customer { get; set; } = null!;
    public Category? Category { get; set; }
    public ICollection<RequestMedia> Media { get; set; } = new List<RequestMedia>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}

public class RequestMedia : BaseEntity
{
    public Guid RequestId { get; set; }
    public MediaType MediaType { get; set; }
    public string FileUrl { get; set; } = string.Empty;
    public string? FileName { get; set; }
    public long? FileSizeBytes { get; set; }
    public string? MongoFileId { get; set; }

    public RepairRequest Request { get; set; } = null!;
}
