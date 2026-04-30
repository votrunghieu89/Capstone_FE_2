using Capstone_2_BE.DTOs.Customer.Profile;
using Capstone_2_BE.Repositories.Customer;
using Microsoft.EntityFrameworkCore;

namespace Capstone_2_BE.DALs.Customer
{
    public class CustomerProfileDAL : ICustomerProfileRepo
    {
        private readonly AppDbContext _context;
        private readonly ILogger<CustomerProfileDAL> _logger;

        public CustomerProfileDAL(AppDbContext context, ILogger<CustomerProfileDAL> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<string> GetOldAvatar(Guid customerId)
        {
            try
            {
                string? oldAvatar = await _context.CustomerProfileModel
                    .Where(c => c.Id == customerId)
                    .Select(c => c.AvatarURL)
                    .FirstOrDefaultAsync();
                return oldAvatar;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving old avatar for customer ID: {CustomerId}", customerId);
                return null;
            }
        }

        public async Task<CustomerProfileViewDTO> GetCustomerProfile(Guid customerId)
        {
            try
            {
                var customerProfile = await (from c in _context.CustomerProfileModel
                                            join a in _context.AccountsModel on c.Id equals a.Id
                                            where c.Id == customerId
                                            select new CustomerProfileViewDTO
                                            {
                                                Email = a.Email,
                                                FullName = c.FullName,
                                                AvatarURL = c.AvatarURL,
                                                PhoneNumber = c.PhoneNumber,
                                                CreateAt = c.CreateAt
                                            }).FirstOrDefaultAsync();

                return customerProfile;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving customer profile for ID: {CustomerId}", customerId);
                return null;
            }
        }

        public async Task<bool> UpdateTechnicianProfile(CustomerProfileUpdateDALDTO customerProfileUpdateDALDTO)
        {
            try
            {
                using (var transaction = await _context.Database.BeginTransactionAsync())
                {
                    int isUpdateInfo = await _context.CustomerProfileModel
                        .Where(c => c.Id == customerProfileUpdateDALDTO.Id)
                        .ExecuteUpdateAsync(c => c
                            .SetProperty(p => p.FullName, customerProfileUpdateDALDTO.FullName)
                            .SetProperty(p => p.PhoneNumber, customerProfileUpdateDALDTO.PhoneNumber)
                        );

                    if (isUpdateInfo == 0)
                    {
                        _logger.LogWarning("No customer profile found with ID: {CustomerId}", customerProfileUpdateDALDTO.Id);
                        await transaction.RollbackAsync();
                        return false;
                    }

                    if (!string.IsNullOrEmpty(customerProfileUpdateDALDTO.AvatarURl))
                    {
                        int isUpdateAvatar = await _context.CustomerProfileModel
                            .Where(c => c.Id == customerProfileUpdateDALDTO.Id)
                            .ExecuteUpdateAsync(c => c
                                .SetProperty(p => p.AvatarURL, customerProfileUpdateDALDTO.AvatarURl)
                            );

                        if (isUpdateAvatar == 0)
                        {
                            _logger.LogWarning("Failed to update avatar for customer ID: {CustomerId}", customerProfileUpdateDALDTO.Id);
                            await transaction.RollbackAsync();
                            return false;
                        }
                    }

                    await transaction.CommitAsync();
                    return true;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating customer profile for ID: {CustomerId}", customerProfileUpdateDALDTO.Id);
                return false;
            }
        }
    }
}
