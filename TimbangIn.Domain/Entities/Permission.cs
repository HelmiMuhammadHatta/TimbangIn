namespace TimbangIn.Domain.Entities
{
    public class Permission : BaseEntity
    {
        public string Name { get; set; } = string.Empty; // e.g. "customer.create"
    }
}
