using TimbangIn.Application.DTOs.Common;
using TimbangIn.Application.DTOs.Master;

namespace TimbangIn.Application.Interfaces
{
    public interface IMaterialTypeService
    {
        Task<PagedResult<MaterialTypeDto>> GetMaterialTypesAsync(PaginationFilter filter);
        Task<MaterialTypeDto> GetMaterialTypeByIdAsync(Guid id);
        Task<MaterialTypeDto> CreateMaterialTypeAsync(MaterialTypeCreateDto dto);
        Task<MaterialTypeDto> UpdateMaterialTypeAsync(Guid id, MaterialTypeUpdateDto dto);
        Task DeleteMaterialTypeAsync(Guid id);
    }
}
