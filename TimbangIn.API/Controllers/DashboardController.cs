using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using TimbangIn.Application.DTOs.Common;
using TimbangIn.Application.DTOs.Dashboard;
using TimbangIn.Application.Interfaces;

namespace TimbangIn.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var summary = await _dashboardService.GetSummaryAsync();
            return Ok(new ApiResponse<DashboardSummaryDto>
            {
                Success = true,
                Data = summary
            });
        }
    }
}
