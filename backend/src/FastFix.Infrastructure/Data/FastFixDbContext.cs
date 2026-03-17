using FastFix.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace FastFix.Infrastructure.Data;

public class FastFixDbContext : DbContext
{
    public FastFixDbContext(DbContextOptions<FastFixDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<TechnicianProfile> TechnicianProfiles => Set<TechnicianProfile>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Skill> Skills => Set<Skill>();
    public DbSet<TechnicianSkill> TechnicianSkills => Set<TechnicianSkill>();
    public DbSet<RepairRequest> RepairRequests => Set<RepairRequest>();
    public DbSet<RequestMedia> RequestMedia => Set<RequestMedia>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<EContract> EContracts => Set<EContract>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<ChatRoom> ChatRooms => Set<ChatRoom>();
    public DbSet<Schedule> Schedules => Set<Schedule>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ---- User ----
        modelBuilder.Entity<User>(e =>
        {
            e.ToTable("users");
            e.HasKey(u => u.Id);
            e.Property(u => u.Id).HasColumnName("id");
            e.Property(u => u.Email).HasColumnName("email");
            e.Property(u => u.PasswordHash).HasColumnName("password_hash");
            e.Property(u => u.FullName).HasColumnName("full_name");
            e.Property(u => u.Phone).HasColumnName("phone");
            e.Property(u => u.AvatarUrl).HasColumnName("avatar_url");
            e.Property(u => u.Role).HasColumnName("role")
                .HasConversion(v => v.ToString().ToLower(), v => Enum.Parse<UserRole>(v, true));
            e.Property(u => u.IsActive).HasColumnName("is_active");
            e.Property(u => u.IsVerified).HasColumnName("is_verified");
            e.Property(u => u.Address).HasColumnName("address");
            e.Property(u => u.Latitude).HasColumnName("latitude");
            e.Property(u => u.Longitude).HasColumnName("longitude");
            e.Property(u => u.CreatedAt).HasColumnName("created_at");
            e.Property(u => u.UpdatedAt).HasColumnName("updated_at");
            e.HasIndex(u => u.Email).IsUnique();
        });

        // ---- TechnicianProfile ----
        modelBuilder.Entity<TechnicianProfile>(e =>
        {
            e.ToTable("technician_profiles");
            e.HasKey(t => t.Id);
            e.Property(t => t.Id).HasColumnName("id");
            e.Property(t => t.UserId).HasColumnName("user_id");
            e.Property(t => t.Bio).HasColumnName("bio");
            e.Property(t => t.ExperienceYears).HasColumnName("experience_years");
            e.Property(t => t.HourlyRate).HasColumnName("hourly_rate");
            e.Property(t => t.IsAvailable).HasColumnName("is_available");
            e.Property(t => t.AverageRating).HasColumnName("average_rating");
            e.Property(t => t.TotalReviews).HasColumnName("total_reviews");
            e.Property(t => t.TotalJobsCompleted).HasColumnName("total_jobs_completed");
            e.Property(t => t.ServiceRadiusKm).HasColumnName("service_radius_km");
            e.Property(t => t.Latitude).HasColumnName("latitude");
            e.Property(t => t.Longitude).HasColumnName("longitude");
            e.Property(t => t.LastLocationUpdate).HasColumnName("last_location_update");
            e.Property(t => t.VerifiedAt).HasColumnName("verified_at");
            e.Property(t => t.CreatedAt).HasColumnName("created_at");
            e.Property(t => t.UpdatedAt).HasColumnName("updated_at");
            e.HasOne(t => t.User).WithOne(u => u.TechnicianProfile)
                .HasForeignKey<TechnicianProfile>(t => t.UserId);
            e.HasIndex(t => new { t.Latitude, t.Longitude });
        });

        // ---- Category ----
        modelBuilder.Entity<Category>(e =>
        {
            e.ToTable("categories");
            e.HasKey(c => c.Id);
            e.Property(c => c.Id).HasColumnName("id");
            e.Property(c => c.Name).HasColumnName("name");
            e.Property(c => c.Description).HasColumnName("description");
            e.Property(c => c.IconUrl).HasColumnName("icon_url");
            e.Property(c => c.IsActive).HasColumnName("is_active");
            e.Property(c => c.CreatedAt).HasColumnName("created_at");
            e.HasIndex(c => c.Name).IsUnique();
        });

        // ---- Skill ----
        modelBuilder.Entity<Skill>(e =>
        {
            e.ToTable("skills");
            e.HasKey(s => s.Id);
            e.Property(s => s.Id).HasColumnName("id");
            e.Property(s => s.CategoryId).HasColumnName("category_id");
            e.Property(s => s.Name).HasColumnName("name");
            e.Property(s => s.Description).HasColumnName("description");
            e.Property(s => s.CreatedAt).HasColumnName("created_at");
            e.HasOne(s => s.Category).WithMany(c => c.Skills)
                .HasForeignKey(s => s.CategoryId);
        });

        // ---- TechnicianSkill (Many-to-Many) ----
        modelBuilder.Entity<TechnicianSkill>(e =>
        {
            e.ToTable("technician_skills");
            e.HasKey(ts => new { ts.TechnicianId, ts.SkillId });
            e.Property(ts => ts.TechnicianId).HasColumnName("technician_id");
            e.Property(ts => ts.SkillId).HasColumnName("skill_id");
            e.Property(ts => ts.ProficiencyLevel).HasColumnName("proficiency_level");
            e.HasOne(ts => ts.Technician).WithMany(t => t.TechnicianSkills)
                .HasForeignKey(ts => ts.TechnicianId);
            e.HasOne(ts => ts.Skill).WithMany(s => s.TechnicianSkills)
                .HasForeignKey(ts => ts.SkillId);
        });

        // ---- RepairRequest ----
        modelBuilder.Entity<RepairRequest>(e =>
        {
            e.ToTable("repair_requests");
            e.HasKey(r => r.Id);
            e.Property(r => r.Id).HasColumnName("id");
            e.Property(r => r.CustomerId).HasColumnName("customer_id");
            e.Property(r => r.CategoryId).HasColumnName("category_id");
            e.Property(r => r.Title).HasColumnName("title");
            e.Property(r => r.Description).HasColumnName("description");
            e.Property(r => r.Status).HasColumnName("status")
                .HasConversion(v => v.ToString().ToLower(), v => Enum.Parse<RequestStatus>(v, true));
            e.Property(r => r.Urgency).HasColumnName("urgency")
                .HasConversion(v => v.ToString().ToLower(), v => Enum.Parse<UrgencyLevel>(v, true));
            e.Property(r => r.Address).HasColumnName("address");
            e.Property(r => r.Latitude).HasColumnName("latitude");
            e.Property(r => r.Longitude).HasColumnName("longitude");
            e.Property(r => r.AiDiagnosis).HasColumnName("ai_diagnosis");
            e.Property(r => r.AiEstimatedCost).HasColumnName("ai_estimated_cost");
            e.Property(r => r.AiSeverityScore).HasColumnName("ai_severity_score");
            e.Property(r => r.PreferredDate).HasColumnName("preferred_date");
            e.Property(r => r.PreferredTimeStart).HasColumnName("preferred_time_start");
            e.Property(r => r.PreferredTimeEnd).HasColumnName("preferred_time_end");
            e.Property(r => r.CreatedAt).HasColumnName("created_at");
            e.Property(r => r.UpdatedAt).HasColumnName("updated_at");
            e.HasOne(r => r.Customer).WithMany(u => u.RepairRequests)
                .HasForeignKey(r => r.CustomerId);
            e.HasOne(r => r.Category).WithMany()
                .HasForeignKey(r => r.CategoryId);
        });

        // ---- RequestMedia ----
        modelBuilder.Entity<RequestMedia>(e =>
        {
            e.ToTable("request_media");
            e.HasKey(m => m.Id);
            e.Property(m => m.Id).HasColumnName("id");
            e.Property(m => m.RequestId).HasColumnName("request_id");
            e.Property(m => m.MediaType).HasColumnName("media_type")
                .HasConversion(v => v.ToString().ToLower(), v => Enum.Parse<MediaType>(v, true));
            e.Property(m => m.FileUrl).HasColumnName("file_url");
            e.Property(m => m.FileName).HasColumnName("file_name");
            e.Property(m => m.FileSizeBytes).HasColumnName("file_size_bytes");
            e.Property(m => m.MongoFileId).HasColumnName("mongo_file_id");
            e.Property(m => m.CreatedAt).HasColumnName("created_at");
            e.HasOne(m => m.Request).WithMany(r => r.Media)
                .HasForeignKey(m => m.RequestId);
        });

        // ---- Booking ----
        modelBuilder.Entity<Booking>(e =>
        {
            e.ToTable("bookings");
            e.HasKey(b => b.Id);
            e.Property(b => b.Id).HasColumnName("id");
            e.Property(b => b.RequestId).HasColumnName("request_id");
            e.Property(b => b.TechnicianId).HasColumnName("technician_id");
            e.Property(b => b.CustomerId).HasColumnName("customer_id");
            e.Property(b => b.Status).HasColumnName("status")
                .HasConversion(v => v.ToString().ToLower(), v => Enum.Parse<BookingStatus>(v, true));
            e.Property(b => b.ScheduledDate).HasColumnName("scheduled_date");
            e.Property(b => b.ScheduledTimeStart).HasColumnName("scheduled_time_start");
            e.Property(b => b.ScheduledTimeEnd).HasColumnName("scheduled_time_end");
            e.Property(b => b.ActualStartTime).HasColumnName("actual_start_time");
            e.Property(b => b.ActualEndTime).HasColumnName("actual_end_time");
            e.Property(b => b.QuotedPrice).HasColumnName("quoted_price");
            e.Property(b => b.FinalPrice).HasColumnName("final_price");
            e.Property(b => b.TechnicianNotes).HasColumnName("technician_notes");
            e.Property(b => b.CustomerNotes).HasColumnName("customer_notes");
            e.Property(b => b.CheckinPhotoUrl).HasColumnName("checkin_photo_url");
            e.Property(b => b.CompletionPhotoUrl).HasColumnName("completion_photo_url");
            e.Property(b => b.CreatedAt).HasColumnName("created_at");
            e.Property(b => b.UpdatedAt).HasColumnName("updated_at");
            e.HasOne(b => b.Request).WithMany(r => r.Bookings)
                .HasForeignKey(b => b.RequestId);
            e.HasOne(b => b.Technician).WithMany(t => t.Bookings)
                .HasForeignKey(b => b.TechnicianId);
            e.HasOne(b => b.Customer).WithMany()
                .HasForeignKey(b => b.CustomerId).OnDelete(DeleteBehavior.NoAction);
        });

        // ---- Review ----
        modelBuilder.Entity<Review>(e =>
        {
            e.ToTable("reviews");
            e.HasKey(r => r.Id);
            e.Property(r => r.Id).HasColumnName("id");
            e.Property(r => r.BookingId).HasColumnName("booking_id");
            e.Property(r => r.ReviewerId).HasColumnName("reviewer_id");
            e.Property(r => r.TechnicianId).HasColumnName("technician_id");
            e.Property(r => r.Rating).HasColumnName("rating");
            e.Property(r => r.Comment).HasColumnName("comment");
            e.Property(r => r.IsVisible).HasColumnName("is_visible");
            e.Property(r => r.CreatedAt).HasColumnName("created_at");
            e.HasOne(r => r.Booking).WithOne(b => b.Review)
                .HasForeignKey<Review>(r => r.BookingId);
            e.HasOne(r => r.Reviewer).WithMany(u => u.Reviews)
                .HasForeignKey(r => r.ReviewerId).OnDelete(DeleteBehavior.NoAction);
            e.HasOne(r => r.Technician).WithMany()
                .HasForeignKey(r => r.TechnicianId).OnDelete(DeleteBehavior.NoAction);
        });

        // ---- EContract ----
        modelBuilder.Entity<EContract>(e =>
        {
            e.ToTable("e_contracts");
            e.HasKey(c => c.Id);
            e.Property(c => c.Id).HasColumnName("id");
            e.Property(c => c.BookingId).HasColumnName("booking_id");
            e.Property(c => c.ContractContent).HasColumnName("contract_content");
            e.Property(c => c.CustomerAccepted).HasColumnName("customer_accepted");
            e.Property(c => c.TechnicianAccepted).HasColumnName("technician_accepted");
            e.Property(c => c.CustomerAcceptedAt).HasColumnName("customer_accepted_at");
            e.Property(c => c.TechnicianAcceptedAt).HasColumnName("technician_accepted_at");
            e.Property(c => c.CreatedAt).HasColumnName("created_at");
            e.HasOne(c => c.Booking).WithOne(b => b.EContract)
                .HasForeignKey<EContract>(c => c.BookingId);
        });

        // ---- Payment ----
        modelBuilder.Entity<Payment>(e =>
        {
            e.ToTable("payments");
            e.HasKey(p => p.Id);
            e.Property(p => p.Id).HasColumnName("id");
            e.Property(p => p.BookingId).HasColumnName("booking_id");
            e.Property(p => p.Amount).HasColumnName("amount");
            e.Property(p => p.Status).HasColumnName("status")
                .HasConversion(v => v.ToString().ToLower(), v => Enum.Parse<PaymentStatus>(v, true));
            e.Property(p => p.PaymentMethod).HasColumnName("payment_method");
            e.Property(p => p.TransactionId).HasColumnName("transaction_id");
            e.Property(p => p.HeldAt).HasColumnName("held_at");
            e.Property(p => p.ReleasedAt).HasColumnName("released_at");
            e.Property(p => p.RefundedAt).HasColumnName("refunded_at");
            e.Property(p => p.CreatedAt).HasColumnName("created_at");
            e.HasOne(p => p.Booking).WithMany(b => b.Payments)
                .HasForeignKey(p => p.BookingId);
        });

        // ---- Notification ----
        modelBuilder.Entity<Notification>(e =>
        {
            e.ToTable("notifications");
            e.HasKey(n => n.Id);
            e.Property(n => n.Id).HasColumnName("id");
            e.Property(n => n.UserId).HasColumnName("user_id");
            e.Property(n => n.Title).HasColumnName("title");
            e.Property(n => n.Message).HasColumnName("message");
            e.Property(n => n.IsRead).HasColumnName("is_read");
            e.Property(n => n.NotificationType).HasColumnName("notification_type");
            e.Property(n => n.ReferenceId).HasColumnName("reference_id");
            e.Property(n => n.ReferenceType).HasColumnName("reference_type");
            e.Property(n => n.CreatedAt).HasColumnName("created_at");
            e.HasOne(n => n.User).WithMany(u => u.Notifications)
                .HasForeignKey(n => n.UserId);
        });

        // ---- ChatRoom ----
        modelBuilder.Entity<ChatRoom>(e =>
        {
            e.ToTable("chat_rooms");
            e.HasKey(c => c.Id);
            e.Property(c => c.Id).HasColumnName("id");
            e.Property(c => c.BookingId).HasColumnName("booking_id");
            e.Property(c => c.CustomerId).HasColumnName("customer_id");
            e.Property(c => c.TechnicianId).HasColumnName("technician_id");
            e.Property(c => c.IsActive).HasColumnName("is_active");
            e.Property(c => c.CreatedAt).HasColumnName("created_at");
            e.HasOne(c => c.Booking).WithOne(b => b.ChatRoom)
                .HasForeignKey<ChatRoom>(c => c.BookingId);
            e.HasOne(c => c.Customer).WithMany()
                .HasForeignKey(c => c.CustomerId).OnDelete(DeleteBehavior.NoAction);
            e.HasOne(c => c.TechnicianUser).WithMany()
                .HasForeignKey(c => c.TechnicianId).OnDelete(DeleteBehavior.NoAction);
        });

        // ---- Schedule ----
        modelBuilder.Entity<Schedule>(e =>
        {
            e.ToTable("schedules");
            e.HasKey(s => s.Id);
            e.Property(s => s.Id).HasColumnName("id");
            e.Property(s => s.TechnicianId).HasColumnName("technician_id");
            e.Property(s => s.DayOfWeek).HasColumnName("day_of_week");
            e.Property(s => s.StartTime).HasColumnName("start_time");
            e.Property(s => s.EndTime).HasColumnName("end_time");
            e.Property(s => s.IsAvailable).HasColumnName("is_available");
            e.Property(s => s.CreatedAt).HasColumnName("created_at");
            e.HasOne(s => s.Technician).WithMany(t => t.Schedules)
                .HasForeignKey(s => s.TechnicianId);
            e.HasIndex(s => new { s.TechnicianId, s.DayOfWeek }).IsUnique();
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var entries = ChangeTracker.Entries<BaseEntity>();
        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedAt = DateTime.UtcNow;
        }
        return base.SaveChangesAsync(cancellationToken);
    }
}
