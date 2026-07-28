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
    public class MaterialTypesController : ControllerBase
    {
        private readonly IMaterialTypeService _service;

        public MaterialTypesController(IMaterialTypeService service)
        {
            _service = service;
        }

        [HttpGet]
        [RequirePermission("material.read")]
        public async Task<IActionResult> Get([FromQuery] PaginationFilter filter)
        {
            var result = await _service.GetMaterialTypesAsync(filter);
            return Ok(new ApiResponse<PagedResult<MaterialTypeDto>> { Success = true, Data = result });
        }

        [HttpGet("{id}")]
        [RequirePermission("material.read")]
        public async Task<IActionResult> Get(Guid id)
        {
            var result = await _service.GetMaterialTypeByIdAsync(id);
            return Ok(new ApiResponse<MaterialTypeDto> { Success = true, Data = result });
        }

        [HttpPost]
        [RequirePermission("material.create")]
        public async Task<IActionResult> Post([FromBody] MaterialTypeCreateDto dto)
        {
            var result = await _service.CreateMaterialTypeAsync(dto);
            return CreatedAtAction(nameof(Get), new { id = result.Id }, new ApiResponse<MaterialTypeDto> { Success = true, Data = result, Message = "Material type created successfully" });
        }

        [HttpPut("{id}")]
        [RequirePermission("material.update")]
        public async Task<IActionResult> Put(Guid id, [FromBody] MaterialTypeUpdateDto dto)
        {
            var result = await _service.UpdateMaterialTypeAsync(id, dto);
            return Ok(new ApiResponse<MaterialTypeDto> { Success = true, Data = result, Message = "Material type updated successfully" });
        }

        [HttpDelete("{id}")]
        [RequirePermission("material.delete")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _service.DeleteMaterialTypeAsync(id);
            return Ok(new ApiResponse<object> { Success = true, Message = "Material type deleted successfully" });
        }
    }
}
