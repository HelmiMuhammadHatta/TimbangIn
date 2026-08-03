using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TimbangIn.Application.DTOs.Common;
using TimbangIn.Application.DTOs.Master;
using TimbangIn.Application.Interfaces;
using TimbangIn.Application.Utils;
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
                var search = filter.SearchTerm.Trim();
                var lowerSearch = search.ToLower();
                var normalizedSearch = search.NormalizePlateNumber();

                query = query.Where(t => 
                    t.PlateNumber.ToLower().Contains(lowerSearch) || 
                    (!string.IsNullOrEmpty(normalizedSearch) && (t.PlateNumberNormalized.Contains(normalizedSearch) || t.PlateNumber.Replace(" ", "").ToUpper().Contains(normalizedSearch))) ||
                    t.DriverName.ToLower().Contains(lowerSearch) ||
                    (t.Customer != null && t.Customer.Name.ToLower().Contains(lowerSearch)));
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

        public async Task<TruckDto?> GetByPlateNumberAsync(string plateNumber)
        {
            if (string.IsNullOrWhiteSpace(plateNumber)) return null;
            var normalized = plateNumber.NormalizePlateNumber();
            if (string.IsNullOrWhiteSpace(normalized)) return null;

            var entity = await _repository.GetQueryable()
                .Include(t => t.Customer)
                .FirstOrDefaultAsync(t => 
                    t.PlateNumberNormalized == normalized || 
                    t.PlateNumber.Replace(" ", "").ToUpper() == normalized);

            return entity != null ? _mapper.Map<TruckDto>(entity) : null;
        }

        public async Task<TruckDto> CreateTruckAsync(TruckCreateDto dto)
        {
            var normalizedPlate = dto.PlateNumber.NormalizePlateNumber();
            if (string.IsNullOrWhiteSpace(normalizedPlate))
                throw new ArgumentException("Nomor plat tidak valid.");

            var exists = await _repository.ExistsAsync(t => t.PlateNumberNormalized == normalizedPlate);
            if (exists)
                throw new ArgumentException("Nomor plat sudah terdaftar di sistem.");

            var entity = _mapper.Map<TruckMaster>(dto);
            entity.PlateNumber = dto.PlateNumber.FormatPlateNumber();
            entity.PlateNumberNormalized = normalizedPlate;

            await _repository.AddAsync(entity);
            await _repository.SaveChangesAsync();
            return await GetTruckByIdAsync(entity.Id);
        }

        public async Task<TruckDto> UpdateTruckAsync(Guid id, TruckUpdateDto dto)
        {
            var entity = await _repository.GetByIdAsync(id) 
                ?? throw new KeyNotFoundException("Truck not found.");

            var normalizedPlate = dto.PlateNumber.NormalizePlateNumber();
            if (string.IsNullOrWhiteSpace(normalizedPlate))
                throw new ArgumentException("Nomor plat tidak valid.");

            var duplicate = await _repository.ExistsAsync(t => t.PlateNumberNormalized == normalizedPlate && t.Id != id);
            if (duplicate)
                throw new ArgumentException("Nomor plat sudah digunakan oleh truk lain.");

            _mapper.Map(dto, entity);
            entity.PlateNumber = dto.PlateNumber.FormatPlateNumber();
            entity.PlateNumberNormalized = normalizedPlate;

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
