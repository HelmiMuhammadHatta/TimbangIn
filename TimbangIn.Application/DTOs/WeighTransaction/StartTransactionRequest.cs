using System;
using TimbangIn.Domain.Enums;

namespace TimbangIn.Application.DTOs.WeighTransaction
{
    public class StartTransactionRequest
    {
        public Guid TruckId { get; set; }
        public Guid CustomerId { get; set; }
        public Guid MaterialTypeId { get; set; }
        public TransactionType TransactionType { get; set; }
        public decimal WeighInKg { get; set; }
        public string WeighInPhotoPath { get; set; } = string.Empty;
    }
}
