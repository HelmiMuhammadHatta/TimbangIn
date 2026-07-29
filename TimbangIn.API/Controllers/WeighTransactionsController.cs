using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using TimbangIn.API.Attributes;
using TimbangIn.Application.DTOs.WeighTransaction;
using TimbangIn.Application.Interfaces;
using TimbangIn.Domain.Enums;
using TimbangIn.Infrastructure.Identity;

namespace TimbangIn.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class WeighTransactionsController : ControllerBase
    {
        private readonly IWeighTransactionService _transactionService;

        public WeighTransactionsController(IWeighTransactionService transactionService)
        {
            _transactionService = transactionService;
        }

        private Guid GetCurrentUserId()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(userIdStr, out var userId) ? userId : Guid.Empty;
        }

        [HttpPost("start")]
        [RequirePermission("transaction.create")]
        public async Task<IActionResult> StartTransaction([FromBody] StartTransactionRequest request)
        {
            try
            {
                var operatorId = GetCurrentUserId();
                var result = await _transactionService.StartTransactionAsync(request, operatorId);
                return Ok(new { success = true, data = result });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("{id}/complete")]
        [RequirePermission("transaction.create")]
        public async Task<IActionResult> CompleteTransaction(Guid id, [FromBody] CompleteTransactionRequest request)
        {
            try
            {
                var operatorId = GetCurrentUserId();
                var result = await _transactionService.CompleteTransactionAsync(id, request, operatorId);
                return Ok(new { success = true, data = result });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("{id}/cancel")]
        [RequirePermission("transaction.cancel")]
        public async Task<IActionResult> CancelTransaction(Guid id, [FromBody] CancelTransactionRequest request)
        {
            try
            {
                var result = await _transactionService.CancelTransactionAsync(id, request);
                return Ok(new { success = true, data = result });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        [RequirePermission("transaction.read")]
        public async Task<IActionResult> GetTransactions([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, [FromQuery] TransactionStatus? status = null, [FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null, [FromQuery] Guid? customerId = null, [FromQuery] string? search = null)
        {
            var result = await _transactionService.GetTransactionsAsync(pageNumber, pageSize, status, startDate, endDate, customerId, search);
            return Ok(new { success = true, data = result });
        }

        [HttpGet("pending")]
        [RequirePermission("transaction.read")]
        public async Task<IActionResult> GetPendingTransactions()
        {
            var result = await _transactionService.GetPendingTransactionsAsync();
            return Ok(new { success = true, data = result });
        }

        [HttpGet("{id}")]
        [RequirePermission("transaction.read")]
        public async Task<IActionResult> GetTransactionById(Guid id)
        {
            try
            {
                var result = await _transactionService.GetByIdAsync(id);
                return Ok(new { success = true, data = result });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
        }
        
        [HttpGet("{id}/print")]
        [RequirePermission("transaction.read")]
        public async Task<IActionResult> GetTransactionForPrint(Guid id)
        {
            try
            {
                var result = await _transactionService.GetByIdAsync(id);
                // Return same data for print, frontend will format it
                return Ok(new { success = true, data = result });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { success = false, message = ex.Message });
            }
        }
    }
}
