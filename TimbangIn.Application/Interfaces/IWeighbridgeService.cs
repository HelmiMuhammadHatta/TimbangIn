using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using TimbangIn.Application.DTOs.Weighbridge;

namespace TimbangIn.Application.Interfaces
{
    public interface IWeighbridgeService
    {
        Task<WeighbridgeReading> GetCurrentWeightAsync();
        IAsyncEnumerable<WeighbridgeReading> StreamWeightAsync(CancellationToken ct);
        Task ResetAsync();
    }
}
