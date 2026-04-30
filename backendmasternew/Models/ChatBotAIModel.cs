using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Capstone_2_BE.Models
{
    [Table("ChatBotAI")]
    public class ChatBotAIModel
    {
        [Key]
        public Guid Id { get; set; }

        public Guid AccountId { get; set; }

        public string Message { get; set; } = string.Empty;

        public string Role { get; set; } = "user"; // 🔥 THÊM

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public AccountsModel Account { get; set; }
    }
}