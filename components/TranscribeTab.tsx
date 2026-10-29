import React, { useState, useRef } from 'react';
import { Mic, MicOff, Upload, FileAudio, Copy, Check, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { transcribeAudio, blobToBase64, fileToBase64 } from '../services/geminiService';
import Spinner from './Spinner';

const TranscribeTab: React.FC = () => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const startRecording = async () => {
    setError(null);
    setTranscription(null);
    setSelectedFile(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingDuration(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone recording error:', err);
      setError(err.message || 'Could not access microphone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setAudioBlob(null);
      setAudioUrl(URL.createObjectURL(file));
      setError(null);
      setTranscription(null);
    }
  };

  const handleTranscribe = async () => {
    setLoading(true);
    setError(null);

    try {
      let base64String = '';
      let mimeType = 'audio/webm';

      if (audioBlob) {
        const converted = await blobToBase64(audioBlob);
        base64String = converted.data;
        mimeType = converted.mimeType;
      } else if (selectedFile) {
        const converted = await fileToBase64(selectedFile);
        base64String = converted.data;
        mimeType = converted.mimeType;
      } else {
        throw new Error('Please record audio with your microphone or upload an audio file first.');
      }

      const res = await transcribeAudio({
        audioData: base64String,
        mimeType,
      });

      setTranscription(res.transcription);
    } catch (err: any) {
      console.error('Transcription error:', err);
      setError(err.message || 'Audio transcription failed with Gemini 3.5 Transcribe.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!transcription) return;
    navigator.clipboard.writeText(transcription);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-900 via-blue-900 to-slate-900 p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-sky-600/80 border border-sky-400/40 shadow-lg">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">Audio Transcription Studio</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/30 text-sky-200 border border-sky-400/30 font-mono">
                  gemini-3.5-transcribe
                </span>
              </div>
              <p className="text-xs text-sky-200/80 mt-1">
                Record voice notes from the workshop or upload recordings to get accurate technical transcripts
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Column */}
        <div className="lg:col-span-6 space-y-6">
          {/* Mic Record Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <Mic className="w-4 h-4 text-sky-600" />
              <span>Record Voice Memo with Microphone</span>
            </h4>
            <p className="text-xs text-slate-500">
              Dictate supply lists, plant diagnoses, measurements, or repair steps on the go.
            </p>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={loading}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all shadow-md ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                    : 'bg-sky-600 hover:bg-sky-700 text-white'
                }`}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    <span>Stop Recording ({formatSeconds(recordingDuration)})</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    <span>Start Recording</span>
                  </>
                )}
              </button>

              {audioUrl && !isRecording && (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Audio Captured ({formatSeconds(recordingDuration)})
                </span>
              )}
            </div>
          </div>

          {/* File Upload Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">or upload audio file</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* File Upload Card */}
          <div>
            <div className="border border-slate-200 hover:border-sky-400 rounded-xl p-4 bg-slate-50 relative flex items-center justify-between gap-3">
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                disabled={loading || isRecording}
              />
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-sky-100 text-sky-700">
                  <FileAudio className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    {selectedFile ? selectedFile.name : 'Choose an audio file'}
                  </p>
                  <p className="text-xs text-slate-400">MP3, WAV, WEBM, M4A up to 25MB</p>
                </div>
              </div>
              <span className="text-xs px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-semibold text-slate-700">
                Browse
              </span>
            </div>
          </div>

          {/* Audio Preview if available */}
          {audioUrl && (
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Audio Playback Preview</label>
              <audio src={audioUrl} controls className="w-full" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleTranscribe}
            disabled={loading || (!audioBlob && !selectedFile)}
            className="w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            {loading ? (
              <>
                <Spinner size="w-5 h-5" color="border-t-white" />
                <span>Transcribing with Gemini 3.5 Transcribe...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Transcribe Audio into Text</span>
              </>
            )}
          </button>
        </div>

        {/* Output Column */}
        <div className="lg:col-span-6 flex flex-col justify-between bg-slate-50 rounded-2xl p-6 border border-slate-200 min-h-[380px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h4 className="font-bold text-slate-800 text-base">Transcription Output</h4>
              {transcription && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors shadow-sm"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {loading ? (
              <div className="py-16 text-center space-y-3">
                <Spinner size="w-10 h-10" color="border-t-sky-600" className="mx-auto" />
                <h5 className="font-semibold text-slate-700">Analyzing Technical Audio</h5>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Gemini 3.5 Transcribe is parsing accents, terminology, botanical names, and tool numbers...
                </p>
              </div>
            ) : transcription ? (
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                {transcription}
              </div>
            ) : (
              <div className="py-16 text-center space-y-2 text-slate-400">
                <FileAudio className="w-12 h-12 mx-auto text-slate-300" />
                <p className="text-sm font-medium text-slate-600">No Transcript Yet</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Record your voice or upload an audio memo, then hit transcribe to see the generated text here.
                </p>
              </div>
            )}
          </div>

          {transcription && (
            <div className="pt-4 border-t border-slate-200 text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>Model: gemini-3.5-transcribe</span>
              <span className="text-emerald-600 font-semibold">✓ Transcription Complete</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TranscribeTab;
