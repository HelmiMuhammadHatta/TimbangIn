using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using TimbangIn.Application.DTOs.Report;
using TimbangIn.Application.DTOs.WeighTransaction;
using TimbangIn.Application.Interfaces;
using TimbangIn.Domain.Entities;
using TimbangIn.Domain.Interfaces;

namespace TimbangIn.Infrastructure.Services
{
    public class ReportService : IReportService
    {
        private readonly IGenericRepository<WeighTransaction> _transactionRepository;

        public ReportService(IGenericRepository<WeighTransaction> transactionRepository)
        {
            _transactionRepository = transactionRepository;
        }

        public async Task<TransactionReportResponseDto> GetReportDataAsync(TransactionReportFilterDto filter)
        {
            var query = _transactionRepository.GetQueryable()
                .Include(t => t.Truck)
                .Include(t => t.Customer)
                .Include(t => t.MaterialType)
                .AsQueryable();

            // Apply Filters
            // Include EndDate boundary properly (assuming user selected a date range)
            var endOfDay = filter.EndDate.Date.AddDays(1).AddTicks(-1);
            
            query = query.Where(t => t.CreatedAt >= filter.StartDate.Date && t.CreatedAt <= endOfDay);

            if (filter.CustomerId.HasValue)
                query = query.Where(t => t.CustomerId == filter.CustomerId.Value);

            if (filter.MaterialTypeId.HasValue)
                query = query.Where(t => t.MaterialTypeId == filter.MaterialTypeId.Value);

            if (filter.Status.HasValue)
                query = query.Where(t => t.Status == filter.Status.Value);

            var transactions = await query.OrderBy(t => t.CreatedAt).ToListAsync();

            // Calculate Summaries
            var completedTransactions = transactions.Where(t => t.Status == TimbangIn.Domain.Enums.TransactionStatus.Selesai).ToList();
            var totalNetto = completedTransactions.Sum(t => t.NettoKg ?? 0);
            var avgNetto = completedTransactions.Any() ? completedTransactions.Average(t => t.NettoKg ?? 0) : 0;

            var responseDto = new TransactionReportResponseDto
            {
                Summary = new TransactionReportSummaryDto
                {
                    TotalTransactions = transactions.Count,
                    TotalNettoKg = totalNetto,
                    AverageNettoKg = (decimal)avgNetto
                },
                Transactions = transactions.Select(t => new WeighTransactionResponse
                {
                    Id = t.Id,
                    TicketNumber = t.TicketNumber,
                    TruckId = t.TruckId,
                    TruckPlateNumber = t.Truck?.PlateNumber ?? "",
                    CustomerId = t.CustomerId,
                    CustomerName = t.Customer?.Name ?? "",
                    MaterialTypeId = t.MaterialTypeId,
                    MaterialTypeName = t.MaterialType?.Name ?? "",
                    TransactionType = t.TransactionType.ToString(),
                    Status = t.Status.ToString(),
                    WeighInKg = t.WeighInKg,
                    WeighInTimestamp = t.WeighInTimestamp,
                    WeighOutKg = t.WeighOutKg,
                    WeighOutTimestamp = t.WeighOutTimestamp,
                    NettoKg = t.NettoKg
                }).ToList()
            };

            return responseDto;
        }

        public async Task<byte[]> GenerateExcelReportAsync(TransactionReportFilterDto filter)
        {
            var data = await GetReportDataAsync(filter);

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Transactions Report");

            // Headers
            var headers = new[] { "No", "Ticket Number", "Tanggal", "Plat Nomor", "Customer", "Material", "Bruto (Kg)", "Tara (Kg)", "Netto (Kg)", "Status" };
            for (int i = 0; i < headers.Length; i++)
            {
                var cell = worksheet.Cell(1, i + 1);
                cell.Value = headers[i];
                cell.Style.Font.Bold = true;
                cell.Style.Fill.BackgroundColor = XLColor.LightGray;
                cell.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            }

            // Data rows
            int row = 2;
            int index = 1;
            foreach (var t in data.Transactions)
            {
                worksheet.Cell(row, 1).Value = index++;
                worksheet.Cell(row, 2).Value = t.TicketNumber;
                worksheet.Cell(row, 3).Value = t.WeighInTimestamp.ToString("yyyy-MM-dd HH:mm");
                worksheet.Cell(row, 4).Value = t.TruckPlateNumber;
                worksheet.Cell(row, 5).Value = t.CustomerName;
                worksheet.Cell(row, 6).Value = t.MaterialTypeName;
                worksheet.Cell(row, 7).Value = t.WeighInKg;
                worksheet.Cell(row, 8).Value = t.WeighOutKg ?? 0;
                worksheet.Cell(row, 9).Value = t.NettoKg ?? 0;
                worksheet.Cell(row, 10).Value = t.Status;

                for (int i = 1; i <= 10; i++)
                {
                    worksheet.Cell(row, i).Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
                }
                row++;
            }

            // Summary Section
            row += 2;
            worksheet.Cell(row, 1).Value = "Summary";
            worksheet.Cell(row, 1).Style.Font.Bold = true;
            row++;
            
            worksheet.Cell(row, 1).Value = "Total Transaksi";
            worksheet.Cell(row, 2).Value = data.Summary.TotalTransactions;
            row++;
            worksheet.Cell(row, 1).Value = "Total Netto (Kg)";
            worksheet.Cell(row, 2).Value = data.Summary.TotalNettoKg;
            row++;
            worksheet.Cell(row, 1).Value = "Rata-rata Netto (Kg)";
            worksheet.Cell(row, 2).Value = data.Summary.AverageNettoKg;

            worksheet.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return stream.ToArray();
        }

        public async Task<byte[]> GeneratePdfReportAsync(TransactionReportFilterDto filter)
        {
            var data = await GetReportDataAsync(filter);

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4.Landscape());
                    page.Margin(2, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(10));

                    page.Header().Element(ComposeHeader);
                    page.Content().Element(x => ComposeContent(x, data));
                    page.Footer().Element(ComposeFooter);
                });
            });

            return document.GeneratePdf();
        }

        private void ComposeHeader(IContainer container)
        {
            container.Row(row =>
            {
                row.RelativeItem().Column(column =>
                {
                    column.Item().Text("TimbangIn").FontSize(20).SemiBold().FontColor(Colors.Blue.Darken2);
                    column.Item().Text("Laporan Transaksi Timbang").FontSize(14).SemiBold();
                    column.Item().Text($"Tanggal Cetak: {DateTime.Now:yyyy-MM-dd HH:mm}");
                });
            });
        }

        private void ComposeContent(IContainer container, TransactionReportResponseDto data)
        {
            container.PaddingVertical(1, Unit.Centimetre).Column(column =>
            {
                column.Spacing(10);
                
                // Summary block
                column.Item().Row(row =>
                {
                    row.RelativeItem().Text($"Total Transaksi: {data.Summary.TotalTransactions}").SemiBold();
                    row.RelativeItem().Text($"Total Netto: {data.Summary.TotalNettoKg:N2} Kg").SemiBold();
                    row.RelativeItem().Text($"Avg Netto: {data.Summary.AverageNettoKg:N2} Kg").SemiBold();
                });

                // Table
                column.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(30);  // No
                        columns.RelativeColumn(3);   // Ticket
                        columns.RelativeColumn(3);   // Date
                        columns.RelativeColumn(2);   // Plate
                        columns.RelativeColumn(3);   // Customer
                        columns.RelativeColumn(3);   // Material
                        columns.RelativeColumn(2);   // Bruto
                        columns.RelativeColumn(2);   // Tara
                        columns.RelativeColumn(2);   // Netto
                        columns.RelativeColumn(2);   // Status
                    });

                    table.Header(header =>
                    {
                        header.Cell().Element(CellStyle).Text("No");
                        header.Cell().Element(CellStyle).Text("Ticket");
                        header.Cell().Element(CellStyle).Text("Tanggal");
                        header.Cell().Element(CellStyle).Text("Plat");
                        header.Cell().Element(CellStyle).Text("Customer");
                        header.Cell().Element(CellStyle).Text("Material");
                        header.Cell().Element(CellStyle).AlignRight().Text("Bruto");
                        header.Cell().Element(CellStyle).AlignRight().Text("Tara");
                        header.Cell().Element(CellStyle).AlignRight().Text("Netto");
                        header.Cell().Element(CellStyle).Text("Status");

                        static IContainer CellStyle(IContainer container)
                        {
                            return container.DefaultTextStyle(x => x.SemiBold()).PaddingVertical(5).BorderBottom(1).BorderColor(Colors.Black);
                        }
                    });

                    int index = 1;
                    foreach (var t in data.Transactions)
                    {
                        table.Cell().Element(CellStyle).Text(index++.ToString());
                        table.Cell().Element(CellStyle).Text(t.TicketNumber);
                        table.Cell().Element(CellStyle).Text(t.WeighInTimestamp.ToString("yyyy-MM-dd HH:mm"));
                        table.Cell().Element(CellStyle).Text(t.TruckPlateNumber);
                        table.Cell().Element(CellStyle).Text(t.CustomerName);
                        table.Cell().Element(CellStyle).Text(t.MaterialTypeName);
                        table.Cell().Element(CellStyle).AlignRight().Text(t.WeighInKg.ToString("N0"));
                        table.Cell().Element(CellStyle).AlignRight().Text((t.WeighOutKg ?? 0).ToString("N0"));
                        table.Cell().Element(CellStyle).AlignRight().Text((t.NettoKg ?? 0).ToString("N0"));
                        table.Cell().Element(CellStyle).Text(t.Status);

                        static IContainer CellStyle(IContainer container)
                        {
                            return container.BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(5);
                        }
                    }
                });
            });
        }

        private void ComposeFooter(IContainer container)
        {
            container.AlignCenter().Text(x =>
            {
                x.Span("Page ");
                x.CurrentPageNumber();
                x.Span(" of ");
                x.TotalPages();
            });
        }
    }
}
