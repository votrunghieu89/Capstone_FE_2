using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Capstone_2_BE.Models
{
    [Table("TechnicianProfile")]
    public class TechnicianProfileModel
    {
        [Key]
        [Column("Id")]
        public Guid Id { get; set; }
        [Column("FullName")]
        public string FullName { get; set; } = string.Empty;
        [Column("AvatarURL")]
        public string AvatarURl { get; set; } = string.Empty;

        [Column("IdUnique")]
        public string IdUnique { get; set; }

        [Column("Description")]
        public string Description { get; set; } = string.Empty;
        [Column("Experiences")]
        public string Experiences { get; set; } = string.Empty;
        [Column("OrderCount")]
        public int OrderCount { get; set; }
        [Column("Address")]
        public string Address { get; set; } = string.Empty;
        [Column("CityId")]
        public Guid CityId { get; set; } 
        [Column("Latitude")]
        public decimal Latitude { get; set; } 
        [Column("Longtitude")]
        public decimal Longitude { get; set; }
        [Column("PhoneNumber")]
        public string PhoneNumber { get; set; } = string.Empty;
        [Column("CreateAt")]
        public DateTime CreateAt { get; set; }

        [Column("UpdateAt")]
        public DateTime UpdateAt { get; set; }
        public AccountsModel Accounts { get; set; }
        public CitiesModel CitiesModel { get; set; }
        public ICollection<Service_ProfileModel> Service_Profiles { get; set; }
        public ICollection<OrderrModel> Orders { get; set; }
        public ICollection<RatingModel> Rating { get; set; }
    }
}
