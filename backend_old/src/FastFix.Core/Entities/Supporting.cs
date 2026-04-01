namespace FastFix.Core.Entities;

public class Review : BaseEntity
{
    public Guid BookingId { get; set; }
    public Guid ReviewerId { get; set; }
    public Guid TechnicianId { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public bool IsVisible { get; set; } = true;

    public Booking Booking { get; set; } = null!;
    public User Reviewer { get; set; } = null!;
    public TechnicianProfile Technician { get; set; } = null!;
}

public enum PaymentStatus
{
    Pending,
    Held,
    Released,
    Refunded
}

public class Payment : BaseEntity
{
    public Guid BookingId { get; set; }
    public decimal Amount { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public string? PaymentMethod { get; set; }
    public string? TransactionId { get; set; }
    public DateTime? HeldAt { get; set; }
    public DateTime? ReleasedAt { get; set; }
    public DateTime? RefundedAt { get; set; }

    public Booking Booking { get; set; } = null!;
}

public class EContract : BaseEntity
{
    public Guid BookingId { get; set; }
    public string ContractContent { get; set; } = string.Empty;
    public bool CustomerAccepted { get; set; }
    public bool TechnicianAccepted { get; set; }
    public DateTime? CustomerAcceptedAt { get; set; }
    public DateTime? TechnicianAcceptedAt { get; set; }

    public Booking Booking { get; set; } = null!;
}

public class Notification : BaseEntity
{
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; } = false;
    public string? NotificationType { get; set; }
    public Guid? ReferenceId { get; set; }
    public string? ReferenceType { get; set; }

    public User User { get; set; } = null!;
}

public class ChatRoom : BaseEntity
{
    public Guid? BookingId { get; set; }
    public Guid CustomerId { get; set; }
    public Guid TechnicianId { get; set; }
    public bool IsActive { get; set; } = true;

    public Booking? Booking { get; set; }
    public User Customer { get; set; } = null!;
    public User TechnicianUser { get; set; } = null!;
}

public class Schedule : BaseEntity
{
    public Guid TechnicianId { get; set; }
    public int DayOfWeek { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public bool IsAvailable { get; set; } = true;

    public TechnicianProfile Technician { get; set; } = null!;
}
