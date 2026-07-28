using Microsoft.EntityFrameworkCore;
using TimbangIn.Domain.Enums;
using TimbangIn.Domain.Interfaces;
using TimbangIn.Infrastructure.Persistence;

namespace TimbangIn.Infrastructure.Repositories
{
    public class PermissionRepository : IPermissionRepository
    {
        private readonly AppDbContext _context;

        public PermissionRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<string>> GetPermissionsByRoleAsync(Role role)
        {
            return await _context.RolePermissions
                .Include(rp => rp.Permission)
                .Where(rp => rp.Role == role)
                .Select(rp => rp.Permission!.Name)
                .ToListAsync();
        }
    }
}
