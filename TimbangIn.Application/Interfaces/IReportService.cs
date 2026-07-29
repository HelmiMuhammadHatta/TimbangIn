using System.Threading.Tasks;
using TimbangIn.Application.DTOs.Report;

namespace TimbangIn.Application.Interfaces
{
    public interface IReportService
    {
        Task<TransactionReportResponseDto> GetReportDataAsync(TransactionReportFilterDto filter);
        Task<byte[]> GenerateExcelReportAsync(TransactionReportFilterDto filter);
        Task<byte[]> GeneratePdfReportAsync(TransactionReportFilterDto filter);
    }
}
