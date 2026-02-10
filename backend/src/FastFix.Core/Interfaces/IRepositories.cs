using FastFix.Core.Entities;

namespace FastFix.Core.Interfaces;

public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(Guid id);
    Task<IEnumerable<T>> GetAllAsync();
    Task<T> AddAsync(T entity);
    Task UpdateAsync(T entity);
    Task DeleteAsync(T entity);
}

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByEmailAsync(string email);
    Task<bool> EmailExistsAsync(string email);
}

public interface ITechnicianRepository : IRepository<TechnicianProfile>
{
    Task<IEnumerable<TechnicianProfile>> GetNearbyAsync(double lat, double lng, double radiusKm);
    Task<IEnumerable<TechnicianProfile>> GetBySkillAsync(int skillId);
    Task<TechnicianProfile?> GetByUserIdAsync(Guid userId);
}

public interface IRepairRequestRepository : IRepository<RepairRequest>
{
    Task<IEnumerable<RepairRequest>> GetByCustomerIdAsync(Guid customerId);
    Task<IEnumerable<RepairRequest>> GetByStatusAsync(RequestStatus status);
}

public interface IBookingRepository : IRepository<Booking>
{
    Task<IEnumerable<Booking>> GetByTechnicianIdAsync(Guid technicianId);
    Task<IEnumerable<Booking>> GetByCustomerIdAsync(Guid customerId);
}

public interface IUnitOfWork : IDisposable
{
    IUserRepository Users { get; }
    ITechnicianRepository Technicians { get; }
    IRepairRequestRepository RepairRequests { get; }
    IBookingRepository Bookings { get; }
    Task<int> SaveChangesAsync();
}
