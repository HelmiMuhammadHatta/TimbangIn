using Microsoft.AspNetCore.SignalR;
using System.Threading;
using System.Threading.Tasks;
using TimbangIn.Application.Interfaces;

namespace TimbangIn.API.Hubs
{
    public class WeighbridgeHub : Hub
    {
        private readonly IWeighbridgeService _weighbridgeService;

        public WeighbridgeHub(IWeighbridgeService weighbridgeService)
        {
            _weighbridgeService = weighbridgeService;
        }

        public async Task SubscribeToWeight()
        {
            var cancellationToken = Context.ConnectionAborted;
            
            try
            {
                await foreach (var reading in _weighbridgeService.StreamWeightAsync(cancellationToken))
                {
                    await Clients.Caller.SendAsync("WeightUpdate", reading, cancellationToken);
                }
            }
            catch (TaskCanceledException)
            {
                // Client disconnected
            }
        }
    }
}
