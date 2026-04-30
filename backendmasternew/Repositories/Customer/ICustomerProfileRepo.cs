using Capstone_2_BE.DTOs.Customer.Profile;
using Capstone_2_BE.DTOs.Technician.Profile;

namespace Capstone_2_BE.Repositories.Customer
{
    public interface ICustomerProfileRepo
    {
        Task<CustomerProfileViewDTO> GetCustomerProfile(Guid customerId);
        Task<bool> UpdateTechnicianProfile(CustomerProfileUpdateDALDTO customerProfileUpdateDALDTO);

        Task<string> GetOldAvatar(Guid customerId);
    }
}
