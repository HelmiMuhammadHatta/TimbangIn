namespace TimbangIn.Domain.Entities
{
    public class TruckMaster : BaseEntity
    {
        public string PlateNumber { get; set; } = string.Empty;
        public string DriverName { get; set; } = string.Empty;
        
        public Guid CustomerId { get; set; }
        public Customer? Customer { get; set; }

        public decimal MaxCapacityKg { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
