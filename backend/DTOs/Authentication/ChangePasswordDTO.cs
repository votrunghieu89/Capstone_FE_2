namespace Capstone_2_BE.DTOs.Authentication
{
    public class ChangePasswordDTO
    {
        public Guid Id { get; set; }
        public string OldPassword { get; set; }
        public string NewPassword { get; set; }
        public string ConfirmPassword { get; set; }
    }
}
