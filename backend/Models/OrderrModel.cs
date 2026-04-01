using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Capstone_2_BE.Models
{
    [Table("Orders")]
    public class OrderrModel
    {
        [Key]
        [Column("Id")]
        public Guid Id { get; set; }
        [ForeignKey("CustomerId")]
        public Guid CustomerId { get; set; }
        [ForeignKey("TechnicianId")]
        public Guid TechnicianId { get; set; }
        [ForeignKey("ServiceId")]
        public Guid ServiceId { get; set; }
        [Column("Title")]
        public string Title { get; set; } = string.Empty;
        [Column("Description")]
        public string Description { get; set; } = string.Empty;
        [Column("Address")]
        public string Address { get; set; } = string.Empty;
        [Column("CityId")]
        public Guid CityId { get; set; }
        [Column("Status")]
        public string Status { get; set; }
        //[Column("Price")]
        //public decimal Price { get; set; }
        [Column("Latitude")]
        public decimal Latitude { get; set; }
        [Column("Longtitude")]
        public decimal Longitude { get; set; }
        [Column("CreateAt")]
        public DateTime CreateAt { get; set; }

        [Column("CompleteAt")]
        public DateTime CompleteAt { get; set; }

        public CustomerProfileModel  CustomerProfile { get; set; }
        public TechnicianProfileModel TechnicianProfile { get; set; }
        public ServiceCategoriesModel ServiceCategories { get; set; }
        public RatingModel Rating { get; set; }
        public CitiesModel Cities { get; set; }
        public ICollection<OrderAttachmentsModel> OrderAttachments { get; set; }
        public ICollection<OrderStatusHistoryModel> OrderStatusHistory { get; set; } 

    }
}
