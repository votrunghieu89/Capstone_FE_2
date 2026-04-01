using Capstone_2_BE.Enums;

namespace Capstone_2_BE.DTOs.Authentication
{
    public class LoginResponseDTO
    {
        public Guid Id { get; set; }
        public string Role { get; set; }
        public string Email { get; set; }
        public AuthenticationEnum.Login LoginStatus { get; set; }
    }
}
