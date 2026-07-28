using TimbangIn.Application.DTOs.Common;
using TimbangIn.Application.DTOs.Master;

namespace TimbangIn.Application.Interfaces
{
    public interface ICustomerService
    {
        Task<PagedResult<CustomerDto>> GetCustomersAsync(PaginationFilter filter);
        Task<CustomerDto> GetCustomerByIdAsync(Guid id);
        Task<CustomerDto> CreateCustomerAsync(CustomerCreateDto dto);
        Task<CustomerDto> UpdateCustomerAsync(Guid id, CustomerUpdateDto dto);
        Task DeleteCustomerAsync(Guid id);
    }
}
