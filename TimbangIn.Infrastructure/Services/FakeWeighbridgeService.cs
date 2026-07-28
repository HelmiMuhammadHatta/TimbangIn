using System;
using System.Collections.Generic;
using System.Runtime.CompilerServices;
using System.Threading;
using System.Threading.Tasks;
using TimbangIn.Application.DTOs.Weighbridge;
using TimbangIn.Application.Interfaces;

namespace TimbangIn.Infrastructure.Services
{
    /// <summary>
    /// FakeWeighbridgeService simulates a physical digital scale hardware.
    /// It uses IAsyncEnumerable to push data continuously, which closely mimics 
    /// a serial port stream from a real hardware indicator (like a scale head).
    /// By using this abstraction, swapping to a RealWeighbridgeService that reads from 
    /// a COM port will not require any changes to the SignalR Hub or Controllers.
    /// </summary>
    public class FakeWeighbridgeService : IWeighbridgeService
    {
        private decimal _currentWeight = 0;
        private bool _isStable = true;
        private decimal _targetWeight = 0;
        private readonly Random _random = new Random();

        public Task<WeighbridgeReading> GetCurrentWeightAsync()
        {
            return Task.FromResult(GenerateReading());
        }

        public Task ResetAsync()
        {
            // Reset simulates a truck leaving the scale
            _currentWeight = 0;
            _targetWeight = 0;
            _isStable = true;
            return Task.CompletedTask;
        }

        public async IAsyncEnumerable<WeighbridgeReading> StreamWeightAsync([EnumeratorCancellation] CancellationToken ct)
        {
            while (!ct.IsCancellationRequested)
            {
                // Simulate state changes
                SimulateScaleBehavior();

                yield return GenerateReading();

                // Delay between 200ms and 500ms to simulate hardware refresh rate
                await Task.Delay(_random.Next(200, 501), ct);
            }
        }

        private void SimulateScaleBehavior()
        {
            // 1% chance to randomly have a new truck arrive (if currently 0)
            if (_targetWeight == 0 && _random.Next(100) < 5)
            {
                _targetWeight = _random.Next(5000, 25000);
                _isStable = false;
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

        private WeighbridgeReading GenerateReading()
        {
            return new WeighbridgeReading
            {
                WeightKg = Math.Round(_currentWeight, 0),
                IsStable = _isStable,
                Timestamp = DateTime.UtcNow,
                RawSignal = $"+{Math.Round(_currentWeight, 0).ToString().PadLeft(6, '0')}kg"
            };
        }
    }
}
