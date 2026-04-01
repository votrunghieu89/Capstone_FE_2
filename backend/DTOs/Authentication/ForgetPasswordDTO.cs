namespace Capstone_2_BE.DTOs.Authentication
{
    public class ForgetPasswordDTO
    {
        public string Email { get; set; }
        public string NewPassword { get; set; }
        public string OTP { get; set; }
    }
}
