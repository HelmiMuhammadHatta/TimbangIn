namespace TimbangIn.Infrastructure.Configuration
{
    public class WeighbridgeOptions
    {
        public bool UseRealHardware { get; set; } = false;
        public string ComPort { get; set; } = "COM1";
        public int BaudRate { get; set; } = 9600;
        public int DataBits { get; set; } = 8;
        public string Parity { get; set; } = "None";
        public string StopBits { get; set; } = "One";
    }
}
