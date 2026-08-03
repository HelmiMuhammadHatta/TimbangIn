using TimbangIn.Application.DTOs.Common;
using TimbangIn.Application.DTOs.Master;

namespace TimbangIn.Application.Interfaces
{
    public interface ITruckMasterService
    {
        Task<PagedResult<TruckDto>> GetTrucksAsync(PaginationFilter filter, Guid? customerId);
        Task<TruckDto> GetTruckByIdAsync(Guid id);
        Task<TruckDto?> GetByPlateNumberAsync(string plateNumber);
        Task<TruckDto> CreateTruckAsync(TruckCreateDto dto);
        Task<TruckDto> UpdateTruckAsync(Guid id, TruckUpdateDto dto);
        Task DeleteTruckAsync(Guid id);
    }
}
