import React, { useEffect, useState, useRef } from 'react';
import * as signalR from '@microsoft/signalr';

export interface WeighbridgeReading {
  weightKg: number;
  isStable: boolean;
  timestamp: string;
  rawSignal: string;
}

interface WeighbridgeDisplayProps {
  onWeightChange?: (weight: number, isStable: boolean) => void;
}

const WeighbridgeDisplay: React.FC<WeighbridgeDisplayProps> = ({ onWeightChange }) => {
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
      if (onWeightChange) {
        onWeightChange(newReading.weightKg, newReading.isStable);
      }
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
    if (connectionState !== signalR.HubConnectionState.Connected) return 'text-alert-red';
    if (!reading) return 'text-gray-500 dark:text-gray-400';
    return reading.isStable ? 'text-signal-green shadow-signal-green' : 'text-safety-amber animate-pulse shadow-safety-amber';
  };

  const getStatusText = () => {
    if (connectionState === signalR.HubConnectionState.Reconnecting) return 'RECONNECTING...';
    if (connectionState !== signalR.HubConnectionState.Connected) return 'DISCONNECTED';
    if (!reading) return 'WAITING FOR DATA...';
    return reading.isStable ? 'STABLE' : 'MEASURING...';
  };

  const weightValue = reading ? reading.weightKg.toLocaleString('id-ID') : '0';

  return (
    <div className="bg-steel-800 dark:bg-steel-800 rounded-xl p-8 shadow-2xl border-[6px] border-steel-900 dark:border-steel-900 w-full max-w-2xl mx-auto flex flex-col items-center justify-center relative overflow-hidden">
      {/* Metallic highlight effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-lg" />
      
      <div className="w-full flex justify-between items-center mb-4 relative z-10">
        <span className="text-gray-400 dark:text-gray-400 font-display font-bold text-sm tracking-widest uppercase">Scale Indicator</span>
        <div className={`font-display font-extrabold tracking-widest text-sm bg-black/40 px-3 py-1 rounded shadow-inner border border-black/50 ${getStatusColor()}`}>
          {getStatusText()}
        </div>
      </div>
      
      <div className="bg-black/90 w-full h-48 rounded-lg flex items-center justify-end px-8 py-4 border-4 border-black shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] overflow-hidden relative z-10">
        {/* LED Grid Background */}
        <div className="absolute inset-0 bg-[radial-gradient(#222_1px,transparent_1px)] [background-size:4px_4px] opacity-30 pointer-events-none" />
        
        <div className="absolute top-3 left-4 text-gray-700 dark:text-gray-700 font-mono font-bold text-xs tracking-wider">
          {reading?.rawSignal || 'NO_SIGNAL'}
        </div>
        <div className="flex items-baseline space-x-4 relative z-10">
          <span 
            className={`font-mono text-7xl sm:text-8xl md:text-9xl tracking-tight tabular-nums font-bold ${reading?.isStable ? 'text-signal-green' : 'text-safety-amber'}`}
            style={{ textShadow: reading?.isStable ? '0 0 20px #3DDC84, 0 0 40px #3DDC84' : '0 0 20px #F2A900, 0 0 40px #F2A900' }}
          >
            {weightValue}
          </span>
          <span className="font-display font-bold text-4xl text-gray-700">KG</span>
        </div>
      </div>
      
      <div className="w-full flex justify-between mt-6 text-gray-500 font-display font-bold text-xs uppercase tracking-widest relative z-10">
        <span>Model: TB-5000</span>
        <span>Max: 60,000 KG</span>
        <span>Div: 10 KG</span>
      </div>
    </div>
  );
};

export default WeighbridgeDisplay;
