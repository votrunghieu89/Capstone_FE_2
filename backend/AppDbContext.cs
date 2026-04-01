using Capstone_2_BE.Models;
using Microsoft.EntityFrameworkCore;

namespace Capstone_2_BE
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // AccountsModel Configuration
            modelBuilder.Entity<AccountsModel>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Role)
                    .HasMaxLength(50)
                    .HasComment("Admin, Customer, Technician");
                entity.Property(e => e.IsActive)
                    .HasComment("0, 1");
                entity.Property(e => e.IsOnline)
                  .HasComment("0, 1");

                // One-to-One với CustomerProfile
                entity.HasOne(e => e.CustomerProfile)
                    .WithOne(c => c.Accounts)
                    .HasForeignKey<CustomerProfileModel>(c => c.Id)
                    .OnDelete(DeleteBehavior.Cascade);
                
                // One-to-One với TechnicianProfile
                entity.HasOne(e => e.TechnicianProfile)
                    .WithOne(t => t.Accounts)
                    .HasForeignKey<TechnicianProfileModel>(t => t.Id)
                    .OnDelete(DeleteBehavior.Cascade);

                // One-to-Many: Accounts -> SentRooms / ReceivedRooms
                entity.HasMany(e => e.SentRooms)
                    .WithOne(r => r.Sender)
                    .HasForeignKey(r => r.SenderId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(e => e.ReceivedRooms)
                    .WithOne(r => r.Receiver)
                    .HasForeignKey(r => r.ReceiverId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // CustomerProfileModel Configuration
            modelBuilder.Entity<CustomerProfileModel>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.FullName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.IdUnique).IsRequired().HasMaxLength(50);
                entity.Property(e => e.PhoneNumber).HasMaxLength(11);
            });
            // CitiesModel Configuration
            modelBuilder.Entity<CitiesModel>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.CityName).IsRequired().HasMaxLength(100);
            });
            // TechnicianProfileModel Configuration
            modelBuilder.Entity<TechnicianProfileModel>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.FullName).IsRequired().HasMaxLength(200);
                entity.Property(e => e.IdUnique).IsRequired().HasMaxLength(50);
                entity.Property(e => e.PhoneNumber).HasMaxLength(11);
                entity.Property(e => e.Address);
                entity.Property(e => e.Description);
                entity.Property(e => e.Experiences);
                entity.Property(e => e.OrderCount);
                entity.Property(e => e.Latitude).HasPrecision(10, 7);
                entity.Property(e => e.Longitude).HasPrecision(10, 7);

                // FK với CitiesModel
                entity.HasOne(e => e.CitiesModel)
                    .WithMany(c => c.technicianProfileModels)
                    .HasForeignKey(e => e.CityId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // ServiceCategoriesModel Configuration
            modelBuilder.Entity<ServiceCategoriesModel>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.ServiceName).IsRequired().HasMaxLength(255);
                
            });

            // Service_ProfileModel Configuration
            modelBuilder.Entity<Service_ProfileModel>(entity =>
            {
                entity.HasKey(e => e.Id);
                
                // FK với ServiceCategories
                entity.HasOne(e => e.ServiceCategories)
                    .WithMany(s => s.Service_Profiles)
                    .HasForeignKey(e => e.ServiceId)
                    .OnDelete(DeleteBehavior.Restrict);
                
                // FK với TechnicianProfile
                entity.HasOne(e => e.TechnicianProfile)
                    .WithMany(t => t.Service_Profiles)
                    .HasForeignKey(e => e.TechnicianId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // OrderrModel Configuration
            modelBuilder.Entity<OrderrModel>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(500);
                entity.Property(e => e.Status)
                     .HasMaxLength(30)
                    .HasComment("Rejected, Cancelled, Pending Confirmation, Confirmed, In Progress, Completed");
                //entity.Property(e => e.Price).HasPrecision(18, 2);
                entity.Property(e => e.Latitude).HasPrecision(10, 7);
                entity.Property(e => e.Longitude).HasPrecision(10, 7);

                // FK với CustomerProfile
                entity.HasOne(e => e.CustomerProfile)
                    .WithMany(c => c.Orders)
                    .HasForeignKey(e => e.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict);
                
                // FK với TechnicianProfile
                entity.HasOne(e => e.TechnicianProfile)
                    .WithMany(t => t.Orders)
                    .HasForeignKey(e => e.TechnicianId)
                    .OnDelete(DeleteBehavior.Restrict);
                
                // FK với ServiceCategories
                entity.HasOne(e => e.ServiceCategories)
                    .WithMany()
                    .HasForeignKey(e => e.ServiceId)
                    .OnDelete(DeleteBehavior.Restrict);

                // FK với CitiesModel
                entity.HasOne(e => e.Cities)
                    .WithMany(c => c.orderrModels)
                    .HasForeignKey(e => e.CityId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // OrderAttachmentsModel Configuration
            modelBuilder.Entity<OrderAttachmentsModel>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.FileType).HasMaxLength(50);
                entity.Property(e => e.FileName).IsRequired();
                
                // FK với Orders
                entity.HasOne(e => e.Orders)
                    .WithMany(o => o.OrderAttachments)
                    .HasForeignKey(e => e.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // OrderStatusHistoryModel Configuration
            modelBuilder.Entity<OrderStatusHistoryModel>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Status)
                    .HasMaxLength(30)
                    .HasComment("Rejected, Cancelled, Pending Confirmation, Confirmed, In Progress, Completed");

                // FK với Orders
                entity.HasOne(e => e.Orders)
                    .WithMany(o => o.OrderStatusHistory)
                    .HasForeignKey(e => e.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);
                
                // FK với Accounts (ChangeBy)
                entity.HasOne(e => e.Accounts)
                    .WithMany(a => a.OrderStatusHistory)
                    .HasForeignKey(e => e.ChangeBy)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // RatingModel Configuration
            modelBuilder.Entity<RatingModel>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Score).HasPrecision(3, 2);
                entity.ToTable(t =>
                {
                    t.HasCheckConstraint("CK_Rating_Score", "[Score] BETWEEN 1 AND 5");
                });

                // FK với CustomerProfile
                entity.HasOne(e => e.CustomerProfile)
                    .WithMany(c => c.Rating)
                    .HasForeignKey(e => e.CustomerId)
                    .OnDelete(DeleteBehavior.Restrict);
                
                // FK với TechnicianProfile
                entity.HasOne(e => e.TechnicianProfile)
                    .WithMany(t => t.Rating)
                    .HasForeignKey(e => e.TechnicianId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Quan hệ 1-1 với OrderrModel
                entity.HasOne(e => e.Orders)
                    .WithOne(o => o.Rating)
                    .HasForeignKey<RatingModel>(e => e.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // NotificationsModel Configuration
            modelBuilder.Entity<NotificationsModel>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Message).IsRequired();
                entity.Property(e => e.IsRead)
                    .HasComment("0, 1");
            });

            // RoomsModel Configuration
            modelBuilder.Entity<RoomsModel>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.CreateAt);

                // Sender relationship (Account -> SentRooms)
                entity.HasOne(e => e.Sender)
                    .WithMany(a => a.SentRooms)
                    .HasForeignKey(e => e.SenderId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Receiver relationship (Account -> ReceivedRooms)
                entity.HasOne(e => e.Receiver)
                    .WithMany(a => a.ReceivedRooms)
                    .HasForeignKey(e => e.ReceiverId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Messages in room
                entity.HasMany(e => e.Messenger)
                    .WithOne(m => m.Rooms)
                    .HasForeignKey(m => m.RoomId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // MessengerModel Configuration
            modelBuilder.Entity<MessengerModel>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Content).IsRequired();
                entity.Property(e => e.IsRead).HasDefaultValue(false);
                entity.Property(e => e.CreateAt);

                // Sender relationship (Message -> Account)
                entity.HasOne(e => e.Sender)
                    .WithMany()
                    .HasForeignKey(e => e.SenderId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }
        public DbSet<AccountsModel> AccountsModel { get; set; }
        public DbSet<CitiesModel> CitiesModel { get; set; }
        public DbSet<CustomerProfileModel> CustomerProfileModel { get; set; }
        public DbSet<TechnicianProfileModel> TechnicianProfileModel { get; set; }
        public DbSet<ServiceCategoriesModel> ServiceCategoriesModel { get; set; }
        public DbSet<Service_ProfileModel> Service_ProfileModel { get; set; }
        public DbSet<OrderrModel> OrderrModel { get; set; }
        public DbSet<OrderAttachmentsModel> OrderAttachmentsModel { get; set; }
        public DbSet<OrderStatusHistoryModel> OrderStatusHistoryModel { get; set; }
        public DbSet<RatingModel> RatingModel { get; set; }
        public DbSet<NotificationsModel> NotificationsModel { get; set; }
        public DbSet<RoomsModel> RoomsModel { get; set; }
        public DbSet<MessengerModel> MessengerModel { get; set; }

    }
}
