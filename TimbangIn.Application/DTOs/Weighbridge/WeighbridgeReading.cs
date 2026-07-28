using System;

namespace TimbangIn.Application.DTOs.Weighbridge
{
    public class WeighbridgeReading
    {
        public decimal WeightKg { get; set; }
        public bool IsStable { get; set; }
        public DateTime Timestamp { get; set; }
        public string RawSignal { get; set; } = string.Empty;
    }
}
