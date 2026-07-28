using TimbangIn.Domain.Enums;

namespace TimbangIn.Domain.Interfaces
{
    public interface IPermissionRepository
    {
        Task<IEnumerable<string>> GetPermissionsByRoleAsync(Role role);
    }
}
