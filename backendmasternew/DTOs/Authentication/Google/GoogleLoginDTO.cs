namespace Capstone_2_BE.DTOs.Authentication.Google
{
    public class GoogleLoginDTO
    {
        public string IdToken { get; set; } = string.Empty;
        public string AccessToken { get; set; } = string.Empty;
    }
}
