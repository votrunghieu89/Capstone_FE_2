using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Capstone_2_BE.Models
{
    [Table("ServiceCategories")]
    public class ServiceCategoriesModel
    {
        [Key]
        [Column("Id")]
        public Guid Id { get; set; }
        [Column("ServiceName")]
        public string ServiceName { get; set; } = string.Empty;
        [Column("Description")]
        public string Description { get; set; }
        [Column("CreateAt")]
        public DateTime CreateAt { get; set; }

        [Column("UpdateAt")]
        public DateTime UpdateAt { get; set; }

        public ICollection<Service_ProfileModel> Service_Profiles { get; set; }
    }
}
