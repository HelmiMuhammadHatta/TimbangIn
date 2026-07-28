namespace TimbangIn.Domain.Entities
{
    public class MaterialType : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string Unit { get; set; } = "Kg"; // e.g. Kg, Ton
        public bool IsActive { get; set; } = true;
    }
}
