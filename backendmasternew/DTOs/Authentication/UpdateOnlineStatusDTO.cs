namespace Capstone_2_BE.DTOs.Authentication
{
    public class UpdateOnlineStatusDTO
    {
        public Guid AccountId { get; set; }
        public int IsOnline { get; set; } // 0 = Do Not Disturb, 1 = Online
    }
}
