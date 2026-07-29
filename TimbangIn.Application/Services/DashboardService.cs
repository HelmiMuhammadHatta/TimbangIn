using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TimbangIn.Application.DTOs.Dashboard;
using TimbangIn.Application.Interfaces;
using TimbangIn.Domain.Entities;
using TimbangIn.Domain.Enums;
using TimbangIn.Domain.Interfaces;

namespace TimbangIn.Application.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly IGenericRepository<WeighTransaction> _transactionRepository;

        public DashboardService(IGenericRepository<WeighTransaction> transactionRepository)
        {
            _transactionRepository = transactionRepository;
        }

        public async Task<DashboardSummaryDto> GetSummaryAsync()
        {
            var today = DateTime.UtcNow.Date;
            var tomorrow = today.AddDays(1);
            
            var firstDayOfMonth = new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var firstDayOfNextMonth = firstDayOfMonth.AddMonths(1);

            var query = _transactionRepository.GetQueryable();

            // Total Transactions Today (we count all transactions created or started today)
            var transactionsTodayQuery = query.Where(t => t.WeighInTimestamp >= today && t.WeighInTimestamp < tomorrow);
            var totalTransactionsToday = await transactionsTodayQuery.CountAsync();

            // Trucks On Site (Status = MenungguTimbangKeluar)
            var trucksOnSite = await query.CountAsync(t => t.Status == TransactionStatus.MenungguTimbangKeluar);

            // Total Netto Today by Material (only for Completed transactions today)
            var completedTodayQuery = transactionsTodayQuery.Where(t => t.Status == TransactionStatus.Selesai && t.NettoKg.HasValue);
            
            var nettoByMaterial = await completedTodayQuery
                .Include(t => t.MaterialType)
                .GroupBy(t => t.MaterialType.Name)
                .Select(g => new MaterialVolumeDto
                {
                    MaterialName = g.Key,
                    TotalNettoKg = g.Sum(t => t.NettoKg!.Value)
                })
                .ToListAsync();

            // Transactions per hour today (based on WeighInTimestamp)
            var hourlyData = await transactionsTodayQuery
                .GroupBy(t => t.WeighInTimestamp.Hour)
                .Select(g => new TransactionPerHourDto
                {
                    Hour = g.Key,
                    Count = g.Count()
                })
                .ToListAsync();
            
            // Fill missing hours
            var fullHourlyData = Enumerable.Range(0, 24).Select(h => new TransactionPerHourDto
            {
                Hour = h,
                Count = hourlyData.FirstOrDefault(x => x.Hour == h)?.Count ?? 0
            }).ToList();

            // Top Customers this month by Volume
            var completedThisMonthQuery = query.Where(t => 
                t.Status == TransactionStatus.Selesai && 
                t.NettoKg.HasValue && 
                t.WeighInTimestamp >= firstDayOfMonth && 
                t.WeighInTimestamp < firstDayOfNextMonth);

            var topCustomers = await completedThisMonthQuery
                .Include(t => t.Customer)
                .GroupBy(t => t.Customer.Name)
                .Select(g => new TopCustomerDto
                {
                    CustomerName = g.Key,
                    TotalVolumeKg = g.Sum(t => t.NettoKg!.Value)
                })
                .OrderByDescending(x => x.TotalVolumeKg)
                .Take(5)
                .ToListAsync();

            // Average Processing Time Today
            var processingTimes = await completedTodayQuery
                .Where(t => t.WeighOutTimestamp.HasValue)
                .Select(t => new { t.WeighInTimestamp, t.WeighOutTimestamp })
                .ToListAsync();

            var processingMinutes = processingTimes
                .Select(t => (t.WeighOutTimestamp!.Value - t.WeighInTimestamp).TotalMinutes)
                .ToList();

            double avgProcessingTime = processingMinutes.Any() ? processingMinutes.Average() : 0;

            return new DashboardSummaryDto
            {
                TotalTransactionsToday = totalTransactionsToday,
                TrucksOnSite = trucksOnSite,
                TotalNettoTodayByMaterial = nettoByMaterial,
                TransactionsPerHour = fullHourlyData,
                TopCustomersThisMonth = topCustomers,
                AverageProcessingTimeMinutes = Math.Round(avgProcessingTime, 1)
            };
        }
    }
}
