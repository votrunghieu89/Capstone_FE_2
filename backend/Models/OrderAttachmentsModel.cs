using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Capstone_2_BE.Models
{
    [Table("OrderAttachments")]
    public class OrderAttachmentsModel
    {
        [Key]
        [Column("Id")]
        public Guid Id { get; set; }
        [ForeignKey("OrderId")]
        public Guid OrderId { get; set; }
        [Column("FileType")]
        public string FileType { get; set; } = string.Empty;
        [Column("FileName")]
        public string FileName { get; set; } = string.Empty;

        [Column("CreateAt")]
        public DateTime CreateAt { get; set; }
        public OrderrModel Orders { get; set; }

    }
}
