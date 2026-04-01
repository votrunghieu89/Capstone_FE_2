namespace Capstone_2_BE.DTOs.Authentication
{
    public class GetNewAccessTokenDTO
    {
        public Guid Id { get; set; }
        public string Email { get; set; }
        public string Role { get; set; }
        public string RefressToken { get; set; }
    }
}
