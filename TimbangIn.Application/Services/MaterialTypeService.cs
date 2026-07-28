using AutoMapper;
using Microsoft.EntityFrameworkCore;
using TimbangIn.Application.DTOs.Common;
using TimbangIn.Application.DTOs.Master;
using TimbangIn.Application.Interfaces;
using TimbangIn.Domain.Entities;
using TimbangIn.Domain.Interfaces;


namespace TimbangIn.Application.Services
{
    public class MaterialTypeService : IMaterialTypeService
    {
        private readonly IGenericRepository<MaterialType> _repository;
        private readonly IMapper _mapper;
        public MaterialTypeService(IGenericRepository<MaterialType> repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        public async Task<PagedResult<MaterialTypeDto>> GetMaterialTypesAsync(PaginationFilter filter)
        {
            var query = _repository.GetQueryable();

            if (!string.IsNullOrEmpty(filter.SearchTerm))
            {
                var lowerSearch = filter.SearchTerm.ToLower();
                query = query.Where(m => m.Name.ToLower().Contains(lowerSearch));
            }

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderByDescending(m => m.CreatedAt)
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .ToListAsync();

            return new PagedResult<MaterialTypeDto>
            {
                Items = _mapper.Map<IEnumerable<MaterialTypeDto>>(items),
                TotalCount = totalCount,
                Page = filter.PageNumber,
                PageSize = filter.PageSize
            };
        }

        public async Task<MaterialTypeDto> GetMaterialTypeByIdAsync(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id) 
                ?? throw new KeyNotFoundException("Material type not found.");
            return _mapper.Map<MaterialTypeDto>(entity);
        }

        public async Task<MaterialTypeDto> CreateMaterialTypeAsync(MaterialTypeCreateDto dto)
        {
            var entity = _mapper.Map<MaterialType>(dto);
            await _repository.AddAsync(entity);
            await _repository.SaveChangesAsync();
            return _mapper.Map<MaterialTypeDto>(entity);
        }

        public async Task<MaterialTypeDto> UpdateMaterialTypeAsync(Guid id, MaterialTypeUpdateDto dto)
        {
            var entity = await _repository.GetByIdAsync(id) 
                ?? throw new KeyNotFoundException("Material type not found.");

            _mapper.Map(dto, entity);
            _repository.Update(entity);
            await _repository.SaveChangesAsync();
            return _mapper.Map<MaterialTypeDto>(entity);
        }

        public async Task DeleteMaterialTypeAsync(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id) 
                ?? throw new KeyNotFoundException("Material type not found.");

            _repository.Remove(entity);
            await _repository.SaveChangesAsync();
        }
    }
}
