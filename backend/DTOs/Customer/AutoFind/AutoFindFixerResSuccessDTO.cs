namespace Capstone_2_BE.DTOs.Customer.AutoFind
{
    public class AutoFindFixerResSuccessDTO
    {
        public string FullName { get; set; } = string.Empty;
        public string avatarURL { get; set; } = string.Empty;
        public string ServiceName { get; set; } = string.Empty;
        public decimal Score { get; set; }
        public int OrderCount { get; set; }
        public int RatingCount { get; set; }
    }
}
