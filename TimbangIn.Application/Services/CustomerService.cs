using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TimbangIn.Application.DTOs.Common;
using TimbangIn.Application.DTOs.Master;
using TimbangIn.Application.Interfaces;
using TimbangIn.Domain.Entities;
using TimbangIn.Domain.Interfaces;


namespace TimbangIn.Application.Services
{
    public class CustomerService : ICustomerService
    {
        private readonly IGenericRepository<Customer> _repository;
        private readonly IMapper _mapper;
        public CustomerService(IGenericRepository<Customer> repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        public async Task<PagedResult<CustomerDto>> GetCustomersAsync(PaginationFilter filter)
        {
            var query = _repository.GetQueryable();

            if (!string.IsNullOrEmpty(filter.SearchTerm))
            {
                var lowerSearch = filter.SearchTerm.ToLower();
                query = query.Where(c => c.Name.ToLower().Contains(lowerSearch) || 
                                         c.Phone.Contains(lowerSearch));
            }

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderByDescending(c => c.CreatedAt)
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return new PagedResult<CustomerDto>
            {
                Items = _mapper.Map<IEnumerable<CustomerDto>>(items),
                TotalCount = totalCount,
                Page = filter.PageNumber,
                PageSize = filter.PageSize
            };
        }

        public async Task<CustomerDto> GetCustomerByIdAsync(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id) 
                ?? throw new KeyNotFoundException("Customer not found.");
            return _mapper.Map<CustomerDto>(entity);
        }

        public async Task<CustomerDto> CreateCustomerAsync(CustomerCreateDto dto)
        {
            var entity = _mapper.Map<Customer>(dto);
            await _repository.AddAsync(entity);
            await _repository.SaveChangesAsync();
            return _mapper.Map<CustomerDto>(entity);
        }

        public async Task<CustomerDto> UpdateCustomerAsync(Guid id, CustomerUpdateDto dto)
        {
            var entity = await _repository.GetByIdAsync(id) 
                ?? throw new KeyNotFoundException("Customer not found.");

            _mapper.Map(dto, entity);
            _repository.Update(entity);
            await _repository.SaveChangesAsync();
            return _mapper.Map<CustomerDto>(entity);
        }

        public async Task DeleteCustomerAsync(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id) 
                ?? throw new KeyNotFoundException("Customer not found.");

            _repository.Remove(entity); // Handled as soft delete by repo/EF
            await _repository.SaveChangesAsync();
        }
    }
}
