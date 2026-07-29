using System;
using System.Collections.Generic;

namespace TimbangIn.Application.DTOs.Dashboard
{
    public class DashboardSummaryDto
    {
        public int TotalTransactionsToday { get; set; }
        public int TrucksOnSite { get; set; }
        public double AverageProcessingTimeMinutes { get; set; }
        
        public List<MaterialVolumeDto> TotalNettoTodayByMaterial { get; set; } = new();
        public List<TransactionPerHourDto> TransactionsPerHour { get; set; } = new();
        public List<TopCustomerDto> TopCustomersThisMonth { get; set; } = new();
    }

    public class MaterialVolumeDto
    {
        public string MaterialName { get; set; } = string.Empty;
        public decimal TotalNettoKg { get; set; }
    }

    public class TransactionPerHourDto
    {
        public int Hour { get; set; }
        public int Count { get; set; }
    }

    public class TopCustomerDto
    {
        public string CustomerName { get; set; } = string.Empty;
        public decimal TotalVolumeKg { get; set; }
    }
}
