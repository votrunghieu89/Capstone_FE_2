namespace Capstone_2_BE.DTOs.Authentication.Google
{
    public class GoogleLoginResDTO
    {
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string AvartarURL { get; set; } = string.Empty;
        public string Sub { get; set; } = string.Empty;
    }
}
