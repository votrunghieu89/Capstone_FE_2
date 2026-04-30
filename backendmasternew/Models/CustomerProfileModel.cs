using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Capstone_2_BE.Models
{
    [Table("CustomerProfile")]
    public class CustomerProfileModel
    {
        [Key]
        [Column("Id")]
        public Guid Id { get; set; }
        [Column("FullName")]
        public string FullName { get; set; }
        [Column("AvatarURL")]
        public string AvatarURL { get; set; } = string.Empty;
        [Column("IdUnique")]
        public string IdUnique { get; set; }
        [Column("PhoneNumber")]
        public string PhoneNumber { get; set; }

        [Column("CreateAt")]
        public DateTime CreateAt { get; set; }

        [Column("UpdateAt")]
        public DateTime UpdateAt { get; set; }

        public AccountsModel Accounts { get; set; }

        public ICollection<OrderrModel> Orders { get; set; }

        public ICollection<RatingModel> Rating { get; set; }
    } 
}
