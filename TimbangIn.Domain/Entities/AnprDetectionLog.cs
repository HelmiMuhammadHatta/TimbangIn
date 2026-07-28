using System;

namespace TimbangIn.Domain.Entities
{
    public class AnprDetectionLog : BaseEntity
    {
        public string PlateNumber { get; set; } = string.Empty;
        public decimal Confidence { get; set; }
        public string ImagePath { get; set; } = string.Empty;
        public bool IsMatched { get; set; }
        public Guid? TruckId { get; set; }
        public DateTime DetectedAt { get; set; }
    }
}
