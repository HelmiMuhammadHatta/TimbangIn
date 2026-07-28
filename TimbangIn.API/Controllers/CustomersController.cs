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
    public class CustomersController : ControllerBase
    {
        private readonly ICustomerService _service;

        public CustomersController(ICustomerService service)
        {
            _service = service;
        }

        [HttpGet]
        [RequirePermission("customer.read")]
        public async Task<IActionResult> Get([FromQuery] PaginationFilter filter)
        {
            var result = await _service.GetCustomersAsync(filter);
            return Ok(new ApiResponse<PagedResult<CustomerDto>> { Success = true, Data = result });
        }

        [HttpGet("{id}")]
        [RequirePermission("customer.read")]
        public async Task<IActionResult> Get(Guid id)
        {
            var result = await _service.GetCustomerByIdAsync(id);
            return Ok(new ApiResponse<CustomerDto> { Success = true, Data = result });
        }

        [HttpPost]
        [RequirePermission("customer.create")]
        public async Task<IActionResult> Post([FromBody] CustomerCreateDto dto)
        {
            var result = await _service.CreateCustomerAsync(dto);
            return CreatedAtAction(nameof(Get), new { id = result.Id }, new ApiResponse<CustomerDto> { Success = true, Data = result, Message = "Customer created successfully" });
        }

        [HttpPut("{id}")]
        [RequirePermission("customer.update")]
        public async Task<IActionResult> Put(Guid id, [FromBody] CustomerUpdateDto dto)
        {
            var result = await _service.UpdateCustomerAsync(id, dto);
            return Ok(new ApiResponse<CustomerDto> { Success = true, Data = result, Message = "Customer updated successfully" });
        }

        [HttpDelete("{id}")]
        [RequirePermission("customer.delete")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _service.DeleteCustomerAsync(id);
            return Ok(new ApiResponse<object> { Success = true, Message = "Customer deleted successfully" });
        }
    }
}
