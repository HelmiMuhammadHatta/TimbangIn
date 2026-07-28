import React, { useEffect, useState, useRef } from 'react';
import * as signalR from '@microsoft/signalr';

export interface WeighbridgeReading {
  weightKg: number;
  isStable: boolean;
  timestamp: string;
  rawSignal: string;
}

const WeighbridgeDisplay: React.FC = () => {
  const [reading, setReading] = useState<WeighbridgeReading | null>(null);
  const [connectionState, setConnectionState] = useState<signalR.HubConnectionState>(signalR.HubConnectionState.Disconnected);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    // Determine the base URL dynamically or from env
    const hubUrl = 'https://localhost:7154/hubs/weighbridge';

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        withCredentials: true // needed if authentication is active
      })
      .withAutomaticReconnect()
      .build();

    connectionRef.current = newConnection;

    const startConnection = async () => {
      try {
        await newConnection.start();
        setConnectionState(newConnection.state);
        // Subscribe to server streaming method
        await newConnection.invoke('SubscribeToWeight');
      } catch (err) {
        console.error('SignalR Connection Error: ', err);
        setConnectionState(newConnection.state);
      }
    };

    newConnection.on('WeightUpdate', (newReading: WeighbridgeReading) => {
      setReading(newReading);
    });

    newConnection.onreconnecting(() => setConnectionState(signalR.HubConnectionState.Reconnecting));
    newConnection.onreconnected(() => {
      setConnectionState(signalR.HubConnectionState.Connected);
      newConnection.invoke('SubscribeToWeight').catch(console.error);
    });
    newConnection.onclose(() => setConnectionState(signalR.HubConnectionState.Disconnected));

    startConnection();

    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
      }
    };
  }, []);

  const getStatusColor = () => {
    if (connectionState !== signalR.HubConnectionState.Connected) return 'text-red-500';
    if (!reading) return 'text-gray-500';
    return reading.isStable ? 'text-green-500' : 'text-yellow-400 animate-pulse';
  };

  const getStatusText = () => {
    if (connectionState === signalR.HubConnectionState.Reconnecting) return 'RECONNECTING...';
    if (connectionState !== signalR.HubConnectionState.Connected) return 'DISCONNECTED';
    if (!reading) return 'WAITING FOR DATA...';
    return reading.isStable ? 'STABLE' : 'MEASURING...';
  };

  const weightValue = reading ? reading.weightKg.toLocaleString('id-ID') : '0';

  return (
    <div className="bg-gray-900 rounded-xl p-8 shadow-2xl border-4 border-gray-800 w-full max-w-2xl mx-auto flex flex-col items-center justify-center">
      <div className="w-full flex justify-between items-center mb-4">
        <span className="text-gray-400 font-mono text-sm tracking-wider uppercase">Scale Indicator</span>
        <div className={`font-mono font-bold tracking-widest ${getStatusColor()}`}>
          {getStatusText()}
        </div>
      </div>
      
      <div className="bg-black w-full h-48 rounded flex items-center justify-end px-8 py-4 border-2 border-gray-700 shadow-inner overflow-hidden relative">
        <div className="absolute top-2 left-4 text-gray-600 font-mono text-xs">
          {reading?.rawSignal || 'NO_SIGNAL'}
        </div>
        <div className="flex items-baseline space-x-4">
          <span 
            className={`font-mono text-8xl md:text-9xl tracking-tight tabular-nums ${reading?.isStable ? 'text-green-400' : 'text-blue-400'}`}
            style={{ textShadow: '0 0 20px currentColor' }}
          >
            {weightValue}
          </span>
          <span className="font-mono text-4xl text-gray-500">KG</span>
        </div>
      </div>
      
      <div className="w-full flex justify-between mt-6 text-gray-500 font-mono text-xs uppercase">
        <span>Model: TB-5000</span>
        <span>Max: 60,000 KG</span>
        <span>Div: 10 KG</span>
      </div>
    </div>
  );
};

export default WeighbridgeDisplay;
