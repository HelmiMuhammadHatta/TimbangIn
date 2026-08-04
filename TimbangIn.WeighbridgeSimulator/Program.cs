using System;
using System.IO.Ports;
using System.Threading;
using System.Threading.Tasks;

namespace TimbangIn.WeighbridgeSimulator
{
    class Program
    {
        static decimal _currentWeight = 0;
        static decimal _targetWeight = 0;
        static bool _isStable = true;
        static readonly Random _random = new Random();
        static bool _isRunning = true;

        static async Task Main(string[] args)
        {
            Console.WriteLine("=== TimbangIn Weighbridge Simulator ===");
            
            string comPort = args.Length > 0 ? args[0] : "COM5";
            int baudRate = 9600;

            SerialPort serialPort = null;
            
            try
            {
                serialPort = new SerialPort(comPort, baudRate)
                {
                    DataBits = 8,
                    Parity = Parity.None,
                    StopBits = StopBits.One,
                    Handshake = Handshake.None
                };

                serialPort.Open();
                Console.WriteLine($"Simulator connected to {comPort}");
                Console.WriteLine("Press 'R' to reset (truck leaves)");
                Console.WriteLine("Press 'Q' to quit");
                Console.WriteLine("=======================================");

                // Run keyboard listener in background
                _ = Task.Run(ListenToKeyboard);

                // Main loop
                while (_isRunning)
                {
                    SimulateScaleBehavior();
                    
                    string prefix = _isStable ? "ST" : "US";
                    string weightStr = Math.Round(_currentWeight, 0).ToString().PadLeft(6, '0');
                    string payload = $"{prefix},+{weightStr}kg\r\n";
                    
                    if (serialPort.IsOpen)
                    {
                        serialPort.Write(payload);
                        Console.WriteLine($"Sent: {payload.TrimEnd()}");
                    }

                    await Task.Delay(_random.Next(300, 501));
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
                Console.WriteLine("Pastikan com0com sudah terinstall dan COM port tersedia.");
            }
            finally
            {
                if (serialPort != null && serialPort.IsOpen)
                {
                    serialPort.Close();
                }
            }
        }

        static void ListenToKeyboard()
        {
            while (_isRunning)
            {
                if (Console.KeyAvailable)
                {
                    var key = Console.ReadKey(intercept: true).Key;
                    if (key == ConsoleKey.Q)
                    {
                        _isRunning = false;
                    }
                    else if (key == ConsoleKey.R)
                    {
                        Console.WriteLine("\n[RESET] Truck left the scale.");
                        _currentWeight = 0;
                        _targetWeight = 0;
                        _isStable = true;
                    }
                }
                Thread.Sleep(50);
            }
        }

        static void SimulateScaleBehavior()
        {
            // 1% chance to randomly have a new truck arrive (if currently 0)
            if (_targetWeight == 0 && _random.Next(100) < 5)
            {
                _targetWeight = _random.Next(5000, 25000);
                _isStable = false;
                Console.WriteLine($"\n[EVENT] Truck arrived. Target weight: {_targetWeight}kg");
            }

            if (_targetWeight > 0)
            {
                if (Math.Abs(_currentWeight - _targetWeight) > 50)
                {
                    // Approaching target weight (truck driving onto the scale)
                    _isStable = false;
                    decimal step = _targetWeight * 0.15m; // move 15% closer
                    _currentWeight += step + _random.Next(-100, 100);
                }
                else
                {
                    // Near target weight
                    _isStable = _random.Next(100) < 80; // 80% chance to report stable when near target
                    // Add some noise (+/- 5kg) typical of wind/vibration on large scales
                    _currentWeight = _targetWeight + _random.Next(-5, 6);
                }
            }
            else
            {
                // Idle at zero
                _isStable = true;
                _currentWeight = _random.Next(0, 2); // Zero drift simulation (0 or 1 kg)
            }
        }
    }
}
