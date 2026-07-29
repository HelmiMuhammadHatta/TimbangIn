using System.Threading.Tasks;
using TimbangIn.Application.DTOs.Dashboard;

namespace TimbangIn.Application.Interfaces
{
    public interface IDashboardService
    {
        Task<DashboardSummaryDto> GetSummaryAsync();
    }
}
