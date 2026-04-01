using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Capstone_2_BE.Models
{
    [Table("Rating")]
    public class RatingModel
    {
        [Key]
        [Column("Id")]
        public Guid Id { get; set; }
        [Column("TechnicianId")]
        public Guid TechnicianId { get; set; }
        [Column("CustomerId")]
        public Guid CustomerId { get; set; }

        [Column("OrderId")]
        public Guid OrderId { get; set; }

        [Column("Score")]
        public decimal Score { get; set; }
        [Column("Feedback")]
        public string Feedback { get; set; } = string.Empty;

        [Column("CreateAt")]
        public DateTime CreateAt { get; set; }

        [Column("UpdateAt")]
        public DateTime UpdateAt { get; set; }
        public CustomerProfileModel CustomerProfile { get; set; }
        public TechnicianProfileModel TechnicianProfile { get; set; }
        public OrderrModel Orders { get; set; }
    }
}
