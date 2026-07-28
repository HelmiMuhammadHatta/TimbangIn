using System;
using TimbangIn.Application.DTOs.Master;

namespace TimbangIn.Application.DTOs.Weighbridge
{
    public class AnprResult
    {
        public string PlateNumber { get; set; } = string.Empty;
        public decimal Confidence { get; set; }
        public int ProcessingTimeMs { get; set; }
        public bool IsMatched { get; set; }
        public Guid? TruckId { get; set; }
        public DateTime DetectedAt { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        
        // Optional: Include truck info if matched
        public TruckDto? MatchedTruck { get; set; }
    }
}
