using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Capstone_2_BE.Models
{
    [Table("Cities")]
    public class CitiesModel
    {
        [Key]
        [Column("Id")]
        public Guid Id { get; set; }
        [Column("CityName")]
        public string CityName { get; set; } = string.Empty;

        public ICollection<OrderrModel> orderrModels { get; set; }
        public ICollection<TechnicianProfileModel> technicianProfileModels { get; set; }
    }
}
