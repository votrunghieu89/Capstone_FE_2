using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Capstone_2_BE.Models
{
    [Table("Rooms")]
    public class RoomsModel
    {
        [Key]
        [Column("Id")]
        public Guid Id { get; set; }
        [Column("SenderId")]
        public Guid SenderId { get; set; }
        [Column("ReceiverId")]
        public Guid ReceiverId { get; set; }
        [Column("LastMessage")]
        public string? LastMessage { get; set; }
        [Column("LastMessageTime")]
        public DateTime LastMessageTime { get; set; }
        [Column("CreatedAt")]
        public DateTime CreateAt { get; set; }

        public AccountsModel Sender { get; set; }
        public AccountsModel Receiver { get; set; }

        public ICollection<MessengerModel> Messenger { get; set; }


    }
}
