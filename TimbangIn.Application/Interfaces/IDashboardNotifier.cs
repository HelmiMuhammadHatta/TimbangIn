using System.Threading.Tasks;
using TimbangIn.Application.DTOs.WeighTransaction;

namespace TimbangIn.Application.Interfaces
{
    public interface IDashboardNotifier
    {
        Task NotifyNewTransactionAsync(WeighTransactionResponse transaction);
    }
}
