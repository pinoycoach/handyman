import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Radio, Volume2, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import Spinner from './Spinner';

// Utility functions for PCM audio encoding & decoding
function encodePCM(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decodePCM(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

const VoiceLiveTab: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isModelSpeaking, setIsModelSpeaking] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Ready to start hands-free voice conversation');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  // Stop all playing audio chunks when interrupted
  const stopAllPlayback = () => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
      } catch (e) {}
    });
    activeSourcesRef.current = [];
    if (outputAudioCtxRef.current) {
      nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
    }
    setIsModelSpeaking(false);
  };

  const playAudioChunk = (base64Audio: string) => {
    try {
      const outputCtx = outputAudioCtxRef.current;
      if (!outputCtx) return;

      const pcmBytes = decodePCM(base64Audio);
      const int16Array = new Int16Array(pcmBytes.buffer);
      const float32Array = new Float32Array(int16Array.length);

      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const buffer = outputCtx.createBuffer(1, float32Array.length, 24000);
      buffer.copyToChannel(float32Array, 0);

      const source = outputCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(outputCtx.destination);

      const now = outputCtx.currentTime;
      if (nextStartTimeRef.current < now) {
        nextStartTimeRef.current = now;
      }

      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += buffer.duration;
      activeSourcesRef.current.push(source);
      setIsModelSpeaking(true);

      source.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
        if (activeSourcesRef.current.length === 0) {
          setIsModelSpeaking(false);
        }
      };
    } catch (e) {
      console.error('Audio playback chunk error:', e);
    }
  };

  const startVoiceSession = async () => {
    setErrorMessage(null);
    setStatusMessage('Connecting to Gemini 3.8 Live API...');

    try {
      // 1. Setup audio contexts
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioCtx({ sampleRate: 16000 });
      const outputCtx = new AudioCtx({ sampleRate: 24000 });
      inputAudioCtxRef.current = inputCtx;
      outputAudioCtxRef.current = outputCtx;
      nextStartTimeRef.current = outputCtx.currentTime;

      // 2. Request microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaStreamRef.current = stream;

      // 3. Connect WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setStatusMessage('Live Voice session connected. Speak naturally!');

        // Setup microphone processor node
        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return;
          const inputData = e.inputBuffer.getChannelData(0);
          
          // Check if user is actively speaking (amplitude threshold)
          let sum = 0;
          for (let i = 0; i < inputData.length; i++) {
            sum += Math.abs(inputData[i]);
          }
          const avg = sum / inputData.length;
          setIsSpeaking(avg > 0.02);

          // Convert Float32 to 16-bit PCM
          const pcm16 = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }

          const base64 = encodePCM(new Uint8Array(pcm16.buffer));
          ws.send(JSON.stringify({ audio: base64 }));
        };

        source.connect(processor);
        processor.connect(inputCtx.destination);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'audio' && msg.audio) {
            playAudioChunk(msg.audio);
          } else if (msg.type === 'interrupted') {
            stopAllPlayback();
            setStatusMessage('User interrupted; listening to your next question...');
          } else if (msg.type === 'error') {
            setErrorMessage(msg.error);
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      ws.onerror = (e) => {
        console.error('Live WebSocket error:', e);
        setErrorMessage('WebSocket connection error. Check server logs.');
      };

      ws.onclose = () => {
        setIsConnected(false);
        setStatusMessage('Voice session closed.');
        cleanupAudio();
      };
    } catch (err: any) {
      console.error('Failed to initialize voice session:', err);
      setErrorMessage(err.message || 'Microphone access denied or connection failed.');
      cleanupAudio();
    }
  };

  const cleanupAudio = () => {
    stopAllPlayback();

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }
    setIsSpeaking(false);
    setIsModelSpeaking(false);
  };

  const endVoiceSession = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    cleanupAudio();
    setIsConnected(false);
    setStatusMessage('Session stopped. Click below to reconnect.');
  };

  useEffect(() => {
    return () => {
      endVoiceSession();
    };
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-900 via-pink-900 to-slate-900 p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-rose-600/80 border border-rose-400/40 shadow-lg">
              <Radio className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">Gemini Live Real-Time Voice Copilot</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-400/30 font-mono">
                  gemini-3.8-live
                </span>
              </div>
              <p className="text-xs text-rose-200/80 mt-1">
                Hands-free spoken conversations with low-latency bidirectional PCM audio streaming
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-rose-500/30 text-xs">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
            <span className="font-semibold text-rose-300">
              {isConnected ? 'Live WebSocket Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-10 flex flex-col items-center justify-center space-y-8 max-w-2xl mx-auto text-center">
        {/* Pulsing Visualizer / Mic Button */}
        <div className="relative">
          {isConnected && (
            <div
              className={`absolute -inset-4 rounded-full transition-all duration-300 ${
                isSpeaking
                  ? 'bg-rose-500/30 animate-ping'
                  : isModelSpeaking
                  ? 'bg-emerald-500/30 animate-pulse'
                  : 'bg-rose-500/10'
              }`}
            />
          )}

          <button
            onClick={isConnected ? endVoiceSession : startVoiceSession}
            className={`relative z-10 w-32 h-32 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all duration-300 transform active:scale-95 ${
              isConnected
                ? isSpeaking
                  ? 'bg-rose-600 text-white ring-8 ring-rose-300'
                  : isModelSpeaking
                  ? 'bg-emerald-600 text-white ring-8 ring-emerald-300'
                  : 'bg-slate-800 text-white hover:bg-slate-700'
                : 'bg-gradient-to-tr from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white'
            }`}
          >
            {isConnected ? (
              <>
                <Mic className="w-10 h-10 mb-1" />
                <span className="text-xs font-bold uppercase tracking-wider">End Call</span>
              </>
            ) : (
              <>
                <Mic className="w-10 h-10 mb-1" />
                <span className="text-xs font-bold uppercase tracking-wider">Start Call</span>
              </>
            )}
          </button>
        </div>

        {/* Status indicator */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
            {isConnected ? (
              isSpeaking ? (
                <span className="text-rose-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                  Listening to you...
                </span>
              ) : isModelSpeaking ? (
                <span className="text-emerald-600 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                  Gemini Copilot is answering...
                </span>
              ) : (
                <span className="text-slate-600">Connected — Speak freely anytime</span>
              )
            ) : (
              <span>Ready for hands-free mode</span>
            )}
          </div>
          <p className="text-sm text-slate-600 font-medium">{statusMessage}</p>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl flex items-center gap-2 text-xs text-left max-w-md w-full">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Real-world DIY scenarios */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-left pt-4 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <h5 className="font-bold text-slate-800 mb-1">🧤 Muddy Garden Hands</h5>
            <p className="text-slate-500">Ask: "How deep do I plant these bare-root raspberry canes?" without touching your phone.</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <h5 className="font-bold text-slate-800 mb-1">🛠️ Under the Sink</h5>
            <p className="text-slate-500">Ask: "Which direction does the P-trap compression washer bevel face?"</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <h5 className="font-bold text-slate-800 mb-1">⚡ On the Ladder</h5>
            <p className="text-slate-500">Ask: "What screw length is required for 5/8-inch ceiling drywall?"</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceLiveTab;
