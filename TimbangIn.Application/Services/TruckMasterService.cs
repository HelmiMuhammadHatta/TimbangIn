using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TimbangIn.Application.DTOs.Common;
using TimbangIn.Application.DTOs.Master;
using TimbangIn.Application.Interfaces;
using TimbangIn.Domain.Entities;
using TimbangIn.Domain.Interfaces;


namespace TimbangIn.Application.Services
{
    public class TruckMasterService : ITruckMasterService
    {
        private readonly IGenericRepository<TruckMaster> _repository;
        private readonly IMapper _mapper;
        public TruckMasterService(IGenericRepository<TruckMaster> repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        public async Task<PagedResult<TruckDto>> GetTrucksAsync(PaginationFilter filter, Guid? customerId)
        {
            var query = _repository.GetQueryable().Include(t => t.Customer).AsQueryable();

            if (customerId.HasValue && customerId.Value != Guid.Empty)
            {
                query = query.Where(t => t.CustomerId == customerId.Value);
            }

            if (!string.IsNullOrEmpty(filter.SearchTerm))
            {
                var lowerSearch = filter.SearchTerm.ToLower();
                query = query.Where(t => t.PlateNumber.ToLower().Contains(lowerSearch) || 
                                         t.DriverName.ToLower().Contains(lowerSearch));
            }

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderByDescending(t => t.CreatedAt)
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return new PagedResult<TruckDto>
            {
                Items = _mapper.Map<IEnumerable<TruckDto>>(items),
                TotalCount = totalCount,
                Page = filter.PageNumber,
                PageSize = filter.PageSize
            };
        }

        public async Task<TruckDto> GetTruckByIdAsync(Guid id)
        {
            var entity = await _repository.GetQueryable()
                .Include(t => t.Customer)
                .FirstOrDefaultAsync(t => t.Id == id) 
                ?? throw new KeyNotFoundException("Truck not found.");
            return _mapper.Map<TruckDto>(entity);
        }

        public async Task<TruckDto> CreateTruckAsync(TruckCreateDto dto)
        {
            var entity = _mapper.Map<TruckMaster>(dto);
            await _repository.AddAsync(entity);
            await _repository.SaveChangesAsync();
            return await GetTruckByIdAsync(entity.Id);
        }

        public async Task<TruckDto> UpdateTruckAsync(Guid id, TruckUpdateDto dto)
        {
            var entity = await _repository.GetByIdAsync(id) 
                ?? throw new KeyNotFoundException("Truck not found.");

            _mapper.Map(dto, entity);
            _repository.Update(entity);
            await _repository.SaveChangesAsync();
            return await GetTruckByIdAsync(entity.Id);
        }

        public async Task DeleteTruckAsync(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id) 
                ?? throw new KeyNotFoundException("Truck not found.");

            _repository.Remove(entity);
            await _repository.SaveChangesAsync();
        }
    }
}
