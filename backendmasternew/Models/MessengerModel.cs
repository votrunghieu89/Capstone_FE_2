using Microsoft.EntityFrameworkCore.Metadata.Internal;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Capstone_2_BE.Models
{
    [Table("Messengers")]
    public class MessengerModel
    {
        [Key]
        [Column("Id")]
        public Guid Id { get; set; }
        [Column("RoomId")]
        public Guid RoomId { get; set; }
        [Column("SenderId")]
        public Guid SenderId { get; set; }
        [Column("Content")]
        public string? Content { get; set; }
        [Column("IsRead")]
        public bool IsRead { get; set; }
        [Column("CreatedAt")]
        public DateTime CreateAt { get; set; }
        [Column("ReadAt")]
        public DateTime? ReadAt { get; set; }

        public RoomsModel Rooms { get; set; }
        public AccountsModel Sender { get; set; }
        public List<MessAttachmentModel> MessAttachments { get; set; }
    }
}
