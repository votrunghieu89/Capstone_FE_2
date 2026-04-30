using Capstone_2_BE.DTOs.Customer.AutoFind;
using Capstone_2_BE.DTOs.Customer.Order;

namespace Capstone_2_BE.Repositories.Customer
{
    public interface ICustomerAutoFindRepo
    {
        Task<List<AutoFindFixerResDTO>> AutoFindCustomer(AutoFindFixerDTO autoFindFixerDTO);
        Task<bool> PlaceAutoOrder(CreateOrderDALDTO createOrderDALDTO);
    }
}
