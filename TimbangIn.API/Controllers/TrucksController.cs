using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TimbangIn.API.Attributes;
using TimbangIn.Application.DTOs.Common;
using TimbangIn.Application.DTOs.Master;
using TimbangIn.Application.Interfaces;

namespace TimbangIn.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TrucksController : ControllerBase
    {
        private readonly ITruckMasterService _service;

        public TrucksController(ITruckMasterService service)
        {
            _service = service;
        }

        [HttpGet]
        [RequirePermission("truck.read")]
        public async Task<IActionResult> Get([FromQuery] PaginationFilter filter, [FromQuery] Guid? customerId)
        {
            var result = await _service.GetTrucksAsync(filter, customerId);
            return Ok(new ApiResponse<PagedResult<TruckDto>> { Success = true, Data = result });
        }

        [HttpGet("{id}")]
        [RequirePermission("truck.read")]
        public async Task<IActionResult> Get(Guid id)
        {
            var result = await _service.GetTruckByIdAsync(id);
            return Ok(new ApiResponse<TruckDto> { Success = true, Data = result });
        }

        [HttpGet("by-plate/{plateNumber}")]
        [RequirePermission("truck.read")]
        public async Task<IActionResult> GetByPlate(string plateNumber)
        {
            var result = await _service.GetByPlateNumberAsync(plateNumber);
            if (result == null)
                return Ok(new ApiResponse<TruckDto?> { Success = false, Message = "Truk tidak ditemukan di master data." });

            return Ok(new ApiResponse<TruckDto> { Success = true, Data = result });
        }

        [HttpPost]
        [RequirePermission("truck.create")]
        public async Task<IActionResult> Post([FromBody] TruckCreateDto dto)
        {
            var result = await _service.CreateTruckAsync(dto);
            return CreatedAtAction(nameof(Get), new { id = result.Id }, new ApiResponse<TruckDto> { Success = true, Data = result, Message = "Truck created successfully" });
        }

        [HttpPut("{id}")]
        [RequirePermission("truck.update")]
        public async Task<IActionResult> Put(Guid id, [FromBody] TruckUpdateDto dto)
        {
            var result = await _service.UpdateTruckAsync(id, dto);
            return Ok(new ApiResponse<TruckDto> { Success = true, Data = result, Message = "Truck updated successfully" });
        }

        [HttpDelete("{id}")]
        [RequirePermission("truck.delete")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _service.DeleteTruckAsync(id);
            return Ok(new ApiResponse<object> { Success = true, Message = "Truck deleted successfully" });
        }
    }
}
