namespace TimbangIn.Application.DTOs.Master
{
    public class TruckDto
    {
        public Guid Id { get; set; }
        public string PlateNumber { get; set; } = string.Empty;
        public string PlateNumberNormalized { get; set; } = string.Empty;
        public string DriverName { get; set; } = string.Empty;
        public Guid CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public decimal MaxCapacityKg { get; set; }
        public bool IsActive { get; set; }
    }

    public class TruckCreateDto
    {
        public string PlateNumber { get; set; } = string.Empty;
        public string DriverName { get; set; } = string.Empty;
        public Guid CustomerId { get; set; }
        public decimal MaxCapacityKg { get; set; }
    }

    public class TruckUpdateDto
    {
        public string PlateNumber { get; set; } = string.Empty;
        public string DriverName { get; set; } = string.Empty;
        public Guid CustomerId { get; set; }
        public decimal MaxCapacityKg { get; set; }
        public bool IsActive { get; set; }
    }
}
