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
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Role).HasConversion<string>();
        });

        // ---- TechnicianProfile ----
        modelBuilder.Entity<TechnicianProfile>(e =>
        {
            e.ToTable("technician_profiles");
            e.HasKey(t => t.Id);
            e.HasOne(t => t.User).WithOne(u => u.TechnicianProfile)
                .HasForeignKey<TechnicianProfile>(t => t.UserId);
            e.HasIndex(t => new { t.Latitude, t.Longitude });
        });

        // ---- Category ----
        modelBuilder.Entity<Category>(e =>
        {
            e.ToTable("categories");
            e.HasKey(c => c.Id);
            e.HasIndex(c => c.Name).IsUnique();
        });

        // ---- Skill ----
        modelBuilder.Entity<Skill>(e =>
        {
            e.ToTable("skills");
            e.HasKey(s => s.Id);
            e.HasOne(s => s.Category).WithMany(c => c.Skills)
                .HasForeignKey(s => s.CategoryId);
        });

        // ---- TechnicianSkill (Many-to-Many) ----
        modelBuilder.Entity<TechnicianSkill>(e =>
        {
            e.ToTable("technician_skills");
            e.HasKey(ts => new { ts.TechnicianId, ts.SkillId });
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
            e.HasOne(r => r.Customer).WithMany(u => u.RepairRequests)
                .HasForeignKey(r => r.CustomerId);
            e.HasOne(r => r.Category).WithMany()
                .HasForeignKey(r => r.CategoryId);
            e.Property(r => r.Status).HasConversion<string>();
            e.Property(r => r.Urgency).HasConversion<string>();
        });

        // ---- RequestMedia ----
        modelBuilder.Entity<RequestMedia>(e =>
        {
            e.ToTable("request_media");
            e.HasKey(m => m.Id);
            e.HasOne(m => m.Request).WithMany(r => r.Media)
                .HasForeignKey(m => m.RequestId);
            e.Property(m => m.MediaType).HasConversion<string>();
        });

        // ---- Booking ----
        modelBuilder.Entity<Booking>(e =>
        {
            e.ToTable("bookings");
            e.HasKey(b => b.Id);
            e.HasOne(b => b.Request).WithMany(r => r.Bookings)
                .HasForeignKey(b => b.RequestId);
            e.HasOne(b => b.Technician).WithMany(t => t.Bookings)
                .HasForeignKey(b => b.TechnicianId);
            e.HasOne(b => b.Customer).WithMany()
                .HasForeignKey(b => b.CustomerId).OnDelete(DeleteBehavior.NoAction);
            e.Property(b => b.Status).HasConversion<string>();
        });

        // ---- Review ----
        modelBuilder.Entity<Review>(e =>
        {
            e.ToTable("reviews");
            e.HasKey(r => r.Id);
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
            e.HasOne(c => c.Booking).WithOne(b => b.EContract)
                .HasForeignKey<EContract>(c => c.BookingId);
        });

        // ---- Payment ----
        modelBuilder.Entity<Payment>(e =>
        {
            e.ToTable("payments");
            e.HasKey(p => p.Id);
            e.HasOne(p => p.Booking).WithMany(b => b.Payments)
                .HasForeignKey(p => p.BookingId);
            e.Property(p => p.Status).HasConversion<string>();
        });

        // ---- Notification ----
        modelBuilder.Entity<Notification>(e =>
        {
            e.ToTable("notifications");
            e.HasKey(n => n.Id);
            e.HasOne(n => n.User).WithMany(u => u.Notifications)
                .HasForeignKey(n => n.UserId);
        });

        // ---- ChatRoom ----
        modelBuilder.Entity<ChatRoom>(e =>
        {
            e.ToTable("chat_rooms");
            e.HasKey(c => c.Id);
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
