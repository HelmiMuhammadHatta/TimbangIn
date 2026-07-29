using System.Collections.Generic;
using TimbangIn.Application.DTOs.WeighTransaction;

namespace TimbangIn.Application.DTOs.Report
{
    public class TransactionReportResponseDto
    {
        public TransactionReportSummaryDto Summary { get; set; } = new();
        public List<WeighTransactionResponse> Transactions { get; set; } = new();
    }
}
