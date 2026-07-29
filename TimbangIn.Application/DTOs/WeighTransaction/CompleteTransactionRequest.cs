using System;

namespace TimbangIn.Application.DTOs.WeighTransaction
{
    public class CompleteTransactionRequest
    {
        public decimal WeighOutKg { get; set; }
        public string WeighOutPhotoPath { get; set; } = string.Empty;
    }
}
