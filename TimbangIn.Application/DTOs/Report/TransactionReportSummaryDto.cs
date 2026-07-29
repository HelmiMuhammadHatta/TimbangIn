namespace TimbangIn.Application.DTOs.Report
{
    public class TransactionReportSummaryDto
    {
        public int TotalTransactions { get; set; }
        public decimal TotalNettoKg { get; set; }
        public decimal AverageNettoKg { get; set; }
    }
}
