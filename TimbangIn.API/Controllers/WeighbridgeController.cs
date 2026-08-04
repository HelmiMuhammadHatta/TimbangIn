using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using TimbangIn.Application.Interfaces;

namespace TimbangIn.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    // [Authorize] // Commented out for easier testing of standalone monitor, uncomment in production if needed
    public class WeighbridgeController : ControllerBase
    {
        private readonly IWeighbridgeService _weighbridgeService;

        public WeighbridgeController(IWeighbridgeService weighbridgeService)
        {
            _weighbridgeService = weighbridgeService;
        }

        [HttpGet("current")]
        public async Task<IActionResult> GetCurrentWeight()
        {
            var reading = await _weighbridgeService.GetCurrentWeightAsync();
            return Ok(new { success = true, data = reading });
        }

        [HttpPost("reset")]
        public async Task<IActionResult> ResetWeighbridge()
        {
            await _weighbridgeService.ResetAsync();
            return Ok(new { success = true, message = "Weighbridge reset successfully" });
        }

        [HttpGet("connection-status")]
        public async Task<IActionResult> GetConnectionStatus()
        {
            var status = await _weighbridgeService.GetConnectionStatusAsync();
            return Ok(status);
        }
    }
}
