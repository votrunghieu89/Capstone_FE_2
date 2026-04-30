using Microsoft.EntityFrameworkCore.Metadata.Internal;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Capstone_2_BE.Models
{
    [Table("OrderStatusHistory")]
    public class OrderStatusHistoryModel
    {
        [Key]
        [Column("Id")]
        public Guid Id { get; set; }
        [ForeignKey("OrderId")]
        public Guid OrderId { get; set; }
        [Column("Status")]
        public string Status { get; set; }
        [ForeignKey("ChangeBy")]
        public Guid ChangeBy { get; set; }
        [Column("ChangeAt")]
        public DateTime ChangeAt { get; set; }

        public OrderrModel Orders { get; set; }

        public AccountsModel Accounts { get; set; }
    }
}
