using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;
using TimbangIn.API.Hubs;
using TimbangIn.Application.DTOs.WeighTransaction;
using TimbangIn.Application.Interfaces;

namespace TimbangIn.API.Services
{
    public class DashboardNotifier : IDashboardNotifier
    {
        private readonly IHubContext<DashboardHub> _hubContext;

        public DashboardNotifier(IHubContext<DashboardHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public async Task NotifyNewTransactionAsync(WeighTransactionResponse transaction)
        {
            await _hubContext.Clients.All.SendAsync("NewTransactionEvent", transaction);
        }
    }
}
