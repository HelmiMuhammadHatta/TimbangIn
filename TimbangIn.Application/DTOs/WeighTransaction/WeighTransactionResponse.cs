using System;
using TimbangIn.Domain.Enums;

namespace TimbangIn.Application.DTOs.WeighTransaction
{
    public class WeighTransactionResponse
    {
        public Guid Id { get; set; }
        public string TicketNumber { get; set; } = null!;
        
        public Guid TruckId { get; set; }
        public string TruckPlateNumber { get; set; } = null!;
        
        public Guid CustomerId { get; set; }
        public string CustomerName { get; set; } = null!;
        
        public Guid MaterialTypeId { get; set; }
        public string MaterialTypeName { get; set; } = null!;
        
        public string TransactionType { get; set; } = null!;
        public string Status { get; set; } = null!;
        
        public decimal WeighInKg { get; set; }
        public DateTime WeighInTimestamp { get; set; }
        public string WeighInPhotoPath { get; set; } = string.Empty;
        
        public decimal? WeighOutKg { get; set; }
        public DateTime? WeighOutTimestamp { get; set; }
        public string? WeighOutPhotoPath { get; set; }
        
        public decimal? NettoKg { get; set; }
        
        public string? Notes { get; set; }
    }
}
