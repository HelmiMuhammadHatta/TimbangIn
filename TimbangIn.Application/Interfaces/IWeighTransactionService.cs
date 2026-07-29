using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TimbangIn.Application.DTOs;
using TimbangIn.Application.DTOs.Common;
using TimbangIn.Application.DTOs.WeighTransaction;
using TimbangIn.Domain.Enums;

namespace TimbangIn.Application.Interfaces
{
    public interface IWeighTransactionService
    {
        Task<WeighTransactionResponse> StartTransactionAsync(StartTransactionRequest request, Guid operatorId);
        Task<WeighTransactionResponse> CompleteTransactionAsync(Guid transactionId, CompleteTransactionRequest request, Guid operatorId);
        Task<WeighTransactionResponse> CancelTransactionAsync(Guid transactionId, CancelTransactionRequest request);
        Task<WeighTransactionResponse> GetByIdAsync(Guid id);
        Task<PagedResult<WeighTransactionResponse>> GetTransactionsAsync(int pageNumber, int pageSize, TransactionStatus? status, DateTime? startDate, DateTime? endDate, Guid? customerId, string? search);
        Task<List<WeighTransactionResponse>> GetPendingTransactionsAsync();
    }
}
