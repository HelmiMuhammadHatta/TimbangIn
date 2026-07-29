using System.ComponentModel.DataAnnotations.Schema;
using TimbangIn.Domain.Enums;

namespace TimbangIn.Domain.Entities
{
    public class WeighTransaction : BaseEntity
    {
        public string TicketNumber { get; set; } = null!;
        
        public Guid TruckId { get; set; }
        public virtual TruckMaster Truck { get; set; } = null!;
        
        public Guid CustomerId { get; set; }
        public virtual Customer Customer { get; set; } = null!;
        
        public Guid MaterialTypeId { get; set; }
        public virtual MaterialType MaterialType { get; set; } = null!;
        
        public TransactionType TransactionType { get; set; }
        public TransactionStatus Status { get; set; }
        
        // Weigh-In
        [Column(TypeName = "decimal(18,2)")]
        public decimal WeighInKg { get; set; }
        public DateTime WeighInTimestamp { get; set; }
        public Guid WeighInOperatorId { get; set; }
        public string WeighInPhotoPath { get; set; } = string.Empty;
        
        // Weigh-Out
        [Column(TypeName = "decimal(18,2)")]
        public decimal? WeighOutKg { get; set; }
        public DateTime? WeighOutTimestamp { get; set; }
        public Guid? WeighOutOperatorId { get; set; }
        public string? WeighOutPhotoPath { get; set; }
        
        // Netto
        [Column(TypeName = "decimal(18,2)")]
        public decimal? NettoKg { get; set; }
        
        public string? Notes { get; set; }
    }
}
