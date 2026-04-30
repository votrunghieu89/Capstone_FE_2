using Capstone_2_BE.DTOs.Authentication;
using Capstone_2_BE.Enums;

namespace Capstone_2_BE.Repositories
{
    public interface IAuthenticationRepo
    {
        Task<LoginResponseDTO> Login(string email, string password);
        Task<Guid?> isEmailExist(string email);
        Task<AuthenticationEnum.Register> RegisterCustomer(RegisterCustomerDTO authRegisterDTO);
        Task<AuthenticationEnum.Register> RegisterTechnician(RegisterFixerDTO authRegisterDTO);
        Task<bool> RegisterAccountAdmin(string email, string password);
        Task<bool> ChangePassword(ChangePasswordDTO changePasswordDTO);
        Task<bool> ForgetPassword(string Email, string password);
        Task<bool> UpdateOnlineStatus(Guid accountId, int isOnline);
        Task<LoginResponseDTO> LoginGoogleforCustomer(string email);
    }
}