using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Capstone_2_BE.Models
{
    [Table("Service_Profile")]
    public class Service_ProfileModel
    {
        [Key]
        [Column("Id")]
        public Guid Id { get; set; }
        [ForeignKey("ServiceId")]
        public Guid ServiceId { get; set; }
        [ForeignKey("TechnicianId")]
        public Guid TechnicianId { get; set; }
        [Column("CreateAt")]
        public DateTime CreateAt { get; set; }

        [Column("UpdateAt")]
        public DateTime UpdateAt { get; set; }

        public ServiceCategoriesModel ServiceCategories { get; set; }
        public TechnicianProfileModel TechnicianProfile { get; set; }
    }
}
