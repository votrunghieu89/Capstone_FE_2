using System.ComponentModel.DataAnnotations.Schema;

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Capstone_2_BE.Models
{
    [Table("MessAttachments")]
    public class MessAttachmentModel
    {
        [Key]
        [Column("Id")]
        public Guid Id { get; set; }

        [ForeignKey("MessageId")]
        [Column("MessageId")]
        public Guid MessageId { get; set; }

        [Column("FileType")]
        public string FileType { get; set; } = string.Empty;

        [Column("FileName")]
        public string FileName { get; set; } = string.Empty;

        [Column("CreateAt")]
        public DateTime CreateAt { get; set; }

        public MessengerModel Messenger { get; set; }
    }
}
