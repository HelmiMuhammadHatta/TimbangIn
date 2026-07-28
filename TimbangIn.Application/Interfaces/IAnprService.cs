using System.Threading.Tasks;
using TimbangIn.Application.DTOs.Weighbridge;

namespace TimbangIn.Application.Interfaces
{
    public interface IAnprService
    {
        Task<AnprResult> DetectPlateAsync(byte[] imageBytes, string fileName);
    }
}
