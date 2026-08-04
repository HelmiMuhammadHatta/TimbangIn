using System;
using System.Collections.Generic;
using System.IO.Ports;
using System.Runtime.CompilerServices;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TimbangIn.Application.DTOs.Weighbridge;
using TimbangIn.Application.Interfaces;
using TimbangIn.Infrastructure.Configuration;

namespace TimbangIn.Infrastructure.Services
{
    public class RealWeighbridgeService : IWeighbridgeService, IDisposable
    {
        private readonly ILogger<RealWeighbridgeService> _logger;
        private readonly WeighbridgeOptions _options;
        private SerialPort _serialPort;
        private StringBuilder _buffer = new StringBuilder();
        
        private WeighbridgeReading _latestReading;
        private bool _isConnected;
        private DateTime? _lastDataReceivedAt;
        
        private readonly Regex _weighbridgeRegex = new Regex(@"(ST|US|OL)?.*?\+?(\d+)\s*(kg|g|t)?", RegexOptions.IgnoreCase | RegexOptions.Compiled);
        
        private CancellationTokenSource _reconnectCts;

        public RealWeighbridgeService(ILogger<RealWeighbridgeService> logger, IOptions<WeighbridgeOptions> options)
        {
            _logger = logger;
            _options = options.Value;
            
            _latestReading = new WeighbridgeReading
            {
                WeightKg = 0,
                IsStable = false,
                Timestamp = DateTime.UtcNow,
                RawSignal = "WAITING"
            };
            
            _reconnectCts = new CancellationTokenSource();
            _ = ReconnectLoopAsync(_reconnectCts.Token);
        }

        private async Task ReconnectLoopAsync(CancellationToken ct)
        {
            while (!ct.IsCancellationRequested)
            {
                if (!_isConnected)
                {
                    TryOpenPort();
                }
                await Task.Delay(5000, ct); // Check every 5 seconds
            }
        }

        private void TryOpenPort()
        {
            try
            {
                if (_serialPort != null)
                {
                    _serialPort.DataReceived -= SerialPort_DataReceived;
                    _serialPort.ErrorReceived -= SerialPort_ErrorReceived;
                    if (_serialPort.IsOpen) _serialPort.Close();
                    _serialPort.Dispose();
                }

                _serialPort = new SerialPort(_options.ComPort, _options.BaudRate)
                {
                    DataBits = _options.DataBits,
                    Parity = Enum.TryParse<Parity>(_options.Parity, true, out var p) ? p : Parity.None,
                    StopBits = Enum.TryParse<StopBits>(_options.StopBits, true, out var s) ? s : StopBits.One,
                    Handshake = Handshake.None,
                    ReadTimeout = 2000,
                    WriteTimeout = 2000
                };

                _serialPort.DataReceived += SerialPort_DataReceived;
                _serialPort.ErrorReceived += SerialPort_ErrorReceived;

                _serialPort.Open();
                _isConnected = true;
                _logger.LogInformation($"Successfully connected to weighbridge on {_options.ComPort}");
            }
            catch (Exception ex)
            {
                _isConnected = false;
                _logger.LogWarning($"Port {_options.ComPort} tidak ditemukan atau gagal dibuka: {ex.Message}. Pastikan kabel/virtual port terpasang.");
            }
        }

        private void SerialPort_ErrorReceived(object sender, SerialErrorReceivedEventArgs e)
        {
            _logger.LogError($"Serial port error: {e.EventType}");
            _isConnected = false;
        }

        private void SerialPort_DataReceived(object sender, SerialDataReceivedEventArgs e)
        {
            try
            {
                string data = _serialPort.ReadExisting();
                _buffer.Append(data);
                
                string bufferStr = _buffer.ToString();
                int newLineIdx;
                while ((newLineIdx = bufferStr.IndexOf('\n')) >= 0)
                {
                    string line = bufferStr.Substring(0, newLineIdx).Trim();
                    bufferStr = bufferStr.Substring(newLineIdx + 1);
                    _buffer.Clear();
                    _buffer.Append(bufferStr);
                    
                    if (!string.IsNullOrEmpty(line))
                    {
                        ParseLine(line);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reading from serial port");
                _isConnected = false;
            }
        }

        private void ParseLine(string line)
        {
            _lastDataReceivedAt = DateTime.UtcNow;
            
            var match = _weighbridgeRegex.Match(line);
            if (match.Success)
            {
                string prefix = match.Groups[1].Value.ToUpper();
                string weightStr = match.Groups[2].Value;
                
                if (decimal.TryParse(weightStr, out decimal weight))
                {
                    bool isStable = prefix == "ST" || string.IsNullOrEmpty(prefix); // Assume stable if no prefix, or "ST"
                    if (prefix == "US" || prefix == "OL")
                    {
                        isStable = false;
                    }

                    _latestReading = new WeighbridgeReading
                    {
                        WeightKg = weight,
                        IsStable = isStable,
                        Timestamp = DateTime.UtcNow,
                        RawSignal = line
                    };
                }
            }
        }

        public Task<WeighbridgeReading> GetCurrentWeightAsync()
        {
            return Task.FromResult(_latestReading);
        }

        public async IAsyncEnumerable<WeighbridgeReading> StreamWeightAsync([EnumeratorCancellation] CancellationToken ct)
        {
            while (!ct.IsCancellationRequested)
            {
                yield return _latestReading;
                await Task.Delay(300, ct);
            }
        }

        public Task ResetAsync()
        {
            _logger.LogInformation("Reset request received for real weighbridge (not fully implemented in software).");
            return Task.CompletedTask;
        }

        public Task<WeighbridgeConnectionStatus> GetConnectionStatusAsync()
        {
            return Task.FromResult(new WeighbridgeConnectionStatus
            {
                IsConnected = _isConnected && (_serialPort?.IsOpen == true),
                ComPort = _options.ComPort,
                LastDataReceivedAt = _lastDataReceivedAt
            });
        }

        public void Dispose()
        {
            _reconnectCts?.Cancel();
            if (_serialPort != null)
            {
                if (_serialPort.IsOpen) _serialPort.Close();
                _serialPort.Dispose();
            }
        }
    }
}
