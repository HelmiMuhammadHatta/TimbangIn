using TimbangIn.Domain.Enums;

namespace TimbangIn.Domain.Entities
{
    public class RolePermission : BaseEntity
    {
        public Role Role { get; set; }
        
        public Guid PermissionId { get; set; }
        public Permission? Permission { get; set; }
    }
}
