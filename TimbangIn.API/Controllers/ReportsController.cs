using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using TimbangIn.Application.DTOs.Common;
using TimbangIn.Application.DTOs.Report;
using TimbangIn.Application.Interfaces;

namespace TimbangIn.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReportsController : ControllerBase
    {
        private readonly IReportService _reportService;

        public ReportsController(IReportService reportService)
        {
            _reportService = reportService;
        }

        [HttpGet("transactions")]
        public async Task<IActionResult> GetTransactionReport([FromQuery] TransactionReportFilterDto filter)
        {
            // Validate minimum filter (StartDate and EndDate should be present)
            if (filter.StartDate == default || filter.EndDate == default)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "StartDate and EndDate are required."
                });
            }

            var data = await _reportService.GetReportDataAsync(filter);
            return Ok(new ApiResponse<TransactionReportResponseDto>
            {
                Success = true,
                Data = data
            });
        }

        [HttpGet("transactions/export-excel")]
        public async Task<IActionResult> ExportTransactionsExcel([FromQuery] TransactionReportFilterDto filter)
        {
            if (filter.StartDate == default || filter.EndDate == default)
            {
                return BadRequest("StartDate and EndDate are required.");
            }

            var fileBytes = await _reportService.GenerateExcelReportAsync(filter);
            return File(fileBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"Laporan_Transaksi_{System.DateTime.Now:yyyyMMdd}.xlsx");
        }

        [HttpGet("transactions/export-pdf")]
        public async Task<IActionResult> ExportTransactionsPdf([FromQuery] TransactionReportFilterDto filter)
        {
            if (filter.StartDate == default || filter.EndDate == default)
            {
                return BadRequest("StartDate and EndDate are required.");
            }

            var fileBytes = await _reportService.GeneratePdfReportAsync(filter);
            return File(fileBytes, "application/pdf", $"Laporan_Transaksi_{System.DateTime.Now:yyyyMMdd}.pdf");
        }
    }
}
