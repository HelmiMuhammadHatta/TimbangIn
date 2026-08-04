using System;

namespace TimbangIn.Application.DTOs.Weighbridge
{
    public class WeighbridgeConnectionStatus
    {
        public bool IsConnected { get; set; }
        public string ComPort { get; set; } = string.Empty;
        public DateTime? LastDataReceivedAt { get; set; }
    }
}
