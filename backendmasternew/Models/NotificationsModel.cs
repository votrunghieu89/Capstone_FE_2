using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Capstone_2_BE.Models
{
    [Table("Notifications")]
    public class NotificationsModel
    {
        [Key]
        [Column("Id")]
        public Guid Id { get; set; }
        [Column("SenderId")]
        public Guid SenderId { get; set; }
        [Column("ReceiverId")]
        public Guid ReceiverId { get; set; }
        [Column("Message")]
        public string Message { get; set; }
        [Column("IsRead")]
        public int IsRead { get; set; }
        [Column("CreateAt")]
        public DateTime CreateAt { get; set; }
    }
}
