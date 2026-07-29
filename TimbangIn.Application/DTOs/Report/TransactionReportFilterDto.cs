using System;
using TimbangIn.Domain.Enums;

namespace TimbangIn.Application.DTOs.Report
{
    public class TransactionReportFilterDto
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public Guid? CustomerId { get; set; }
        public Guid? MaterialTypeId { get; set; }
        public TransactionStatus? Status { get; set; }
    }
}
