using AutoMapper;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TimbangIn.Application.DTOs;
using TimbangIn.Application.DTOs.Common;
using TimbangIn.Application.DTOs.WeighTransaction;
using TimbangIn.Application.Interfaces;
using TimbangIn.Domain.Entities;
using TimbangIn.Domain.Enums;
using TimbangIn.Domain.Interfaces;

namespace TimbangIn.Application.Services
{
    public class WeighTransactionService : IWeighTransactionService
    {
        private readonly IGenericRepository<WeighTransaction> _transactionRepository;
        private readonly ITruckMasterService _truckService;
        private readonly IMapper _mapper;
        private readonly IDashboardNotifier _dashboardNotifier;

        public WeighTransactionService(
            IGenericRepository<WeighTransaction> transactionRepository,
            ITruckMasterService truckService,
            IMapper mapper,
            IDashboardNotifier dashboardNotifier)
        {
            _transactionRepository = transactionRepository;
            _truckService = truckService;
            _mapper = mapper;
            _dashboardNotifier = dashboardNotifier;
        }

        public async Task<WeighTransactionResponse> StartTransactionAsync(StartTransactionRequest request, Guid operatorId)
        {
            // Validate: check if there is any pending transaction for this truck
            var pendingTransactions = await _transactionRepository.FindAsync(t => 
                t.TruckId == request.TruckId && 
                t.Status == TransactionStatus.MenungguTimbangKeluar);

            if (pendingTransactions.Any())
            {
                throw new InvalidOperationException("Truk ini masih memiliki transaksi yang belum selesai (menunggu timbang keluar). Selesaikan atau batalkan transaksi tersebut terlebih dahulu.");
            }

            // Generate Ticket Number (Format: TB-YYYYMMDD-XXXX)
            var today = DateTime.UtcNow.Date;
            var startOfDay = today;
            var endOfDay = today.AddDays(1);
            
            var todayTransactions = await _transactionRepository.FindAsync(t => t.CreatedAt >= startOfDay && t.CreatedAt < endOfDay);
            int nextNumber = todayTransactions.Count() + 1;
            string ticketNumber = $"TB-{today:yyyyMMdd}-{nextNumber:D4}";

            var transaction = new WeighTransaction
            {
                TicketNumber = ticketNumber,
                TruckId = request.TruckId,
                CustomerId = request.CustomerId,
                MaterialTypeId = request.MaterialTypeId,
                TransactionType = request.TransactionType,
                Status = TransactionStatus.MenungguTimbangKeluar,
                WeighInKg = request.WeighInKg,
                WeighInTimestamp = DateTime.UtcNow,
                WeighInOperatorId = operatorId,
                WeighInPhotoPath = request.WeighInPhotoPath
            };

            await _transactionRepository.AddAsync(transaction);
            await _transactionRepository.SaveChangesAsync();

            var response = await GetByIdAsync(transaction.Id);
            
            // Notify clients
            if (response != null)
            {
                await _dashboardNotifier.NotifyNewTransactionAsync(response);
            }

            return response!;
        }

        public async Task<WeighTransactionResponse> CompleteTransactionAsync(Guid transactionId, CompleteTransactionRequest request, Guid operatorId)
        {
            var transaction = await _transactionRepository.GetByIdAsync(transactionId);
            if (transaction == null)
            {
                throw new KeyNotFoundException("Transaksi tidak ditemukan.");
            }

            if (transaction.Status != TransactionStatus.MenungguTimbangKeluar)
            {
                throw new InvalidOperationException($"Transaksi tidak dapat diselesaikan karena status saat ini adalah {transaction.Status}.");
            }

            transaction.WeighOutKg = request.WeighOutKg;
            transaction.WeighOutTimestamp = DateTime.UtcNow;
            transaction.WeighOutOperatorId = operatorId;
            transaction.WeighOutPhotoPath = request.WeighOutPhotoPath;
            
            // Calculate Netto
            transaction.NettoKg = Math.Abs(transaction.WeighInKg - request.WeighOutKg);
            
            transaction.Status = TransactionStatus.Selesai;

            _transactionRepository.Update(transaction);
            await _transactionRepository.SaveChangesAsync();

            var response = await GetByIdAsync(transaction.Id);
            
            // Notify clients
            if (response != null)
            {
                await _dashboardNotifier.NotifyNewTransactionAsync(response);
            }

            return response!;
        }

        public async Task<WeighTransactionResponse> CancelTransactionAsync(Guid transactionId, CancelTransactionRequest request)
        {
            var transaction = await _transactionRepository.GetByIdAsync(transactionId);
            if (transaction == null)
            {
                throw new KeyNotFoundException("Transaksi tidak ditemukan.");
            }

            if (transaction.Status != TransactionStatus.MenungguTimbangKeluar)
            {
                throw new InvalidOperationException("Hanya transaksi yang masih menunggu timbang keluar yang dapat dibatalkan.");
            }

            if (string.IsNullOrWhiteSpace(request.Notes))
            {
                throw new ArgumentException("Alasan pembatalan harus diisi.");
            }

            transaction.Status = TransactionStatus.Dibatalkan;
            transaction.Notes = request.Notes;

            _transactionRepository.Update(transaction);
            await _transactionRepository.SaveChangesAsync();

            return await GetByIdAsync(transaction.Id);
        }

        public async Task<WeighTransactionResponse> GetByIdAsync(Guid id)
        {
            var transaction = await _transactionRepository.GetQueryable()
                .Include(t => t.Truck)
                .Include(t => t.Customer)
                .Include(t => t.MaterialType)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (transaction == null)
                throw new KeyNotFoundException("Transaksi tidak ditemukan.");

            return MapToResponse(transaction);
        }

        public async Task<PagedResult<WeighTransactionResponse>> GetTransactionsAsync(int pageNumber, int pageSize, TransactionStatus? status, DateTime? startDate, DateTime? endDate, Guid? customerId, string? search)
        {
            var query = _transactionRepository.GetQueryable()
                .Include(t => t.Truck)
                .Include(t => t.Customer)
                .Include(t => t.MaterialType)
                .AsQueryable();

            if (status.HasValue)
                query = query.Where(t => t.Status == status.Value);

            if (startDate.HasValue)
                query = query.Where(t => t.CreatedAt >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(t => t.CreatedAt <= endDate.Value);

            if (customerId.HasValue)
                query = query.Where(t => t.CustomerId == customerId.Value);

            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.ToLower();
                query = query.Where(t => 
                    t.TicketNumber.ToLower().Contains(search) || 
                    t.Truck.PlateNumber.ToLower().Contains(search));
            }

            var totalItems = await query.CountAsync();
            
            var items = await query
                .OrderByDescending(t => t.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var responses = items.Select(MapToResponse).ToList();

            return new PagedResult<WeighTransactionResponse>
            {
                Items = responses,
                TotalCount = totalItems,
                Page = pageNumber,
                PageSize = pageSize
            };
        }

        public async Task<List<WeighTransactionResponse>> GetPendingTransactionsAsync()
        {
            var items = await _transactionRepository.GetQueryable()
                .Include(t => t.Truck)
                .Include(t => t.Customer)
                .Include(t => t.MaterialType)
                .Where(t => t.Status == TransactionStatus.MenungguTimbangKeluar)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            return items.Select(MapToResponse).ToList();
        }

        private static WeighTransactionResponse MapToResponse(WeighTransaction transaction)
        {
            return new WeighTransactionResponse
            {
                Id = transaction.Id,
                TicketNumber = transaction.TicketNumber,
                TruckId = transaction.TruckId,
                TruckPlateNumber = transaction.Truck?.PlateNumber ?? "",
                CustomerId = transaction.CustomerId,
                CustomerName = transaction.Customer?.Name ?? "",
                MaterialTypeId = transaction.MaterialTypeId,
                MaterialTypeName = transaction.MaterialType?.Name ?? "",
                TransactionType = transaction.TransactionType.ToString(),
                Status = transaction.Status.ToString(),
                WeighInKg = transaction.WeighInKg,
                WeighInTimestamp = transaction.WeighInTimestamp,
                WeighInPhotoPath = transaction.WeighInPhotoPath,
                WeighOutKg = transaction.WeighOutKg,
                WeighOutTimestamp = transaction.WeighOutTimestamp,
                WeighOutPhotoPath = transaction.WeighOutPhotoPath,
                NettoKg = transaction.NettoKg,
                Notes = transaction.Notes
            };
        }
    }
}
