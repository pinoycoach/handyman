import React, { useState, useRef } from 'react';
import { Music, Play, Pause, Download, Volume2, Sparkles, AlertCircle, Upload, Image as ImageIcon } from 'lucide-react';
import { generateMusic, fileToBase64 } from '../services/geminiService';
import Spinner from './Spinner';

const MusicTab: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('Gentle acoustic folk guitar with birdsong for a morning in the garden');
  const [modelType, setModelType] = useState<'lyria-3-clip-preview' | 'lyria-3-pro-preview'>('lyria-3-clip-preview');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please provide a music description prompt.');
      return;
    }

    setLoading(true);
    setError(null);
    setAudioUrl(null);
    setLyrics(null);
    setIsPlaying(false);

    try {
      let imagePayload: { data: string; mimeType: string } | undefined;
      if (imageFile) {
        imagePayload = await fileToBase64(imageFile);
      }

      const res = await generateMusic({
        prompt: prompt.trim(),
        model: modelType,
        image: imagePayload,
      });

      // Decode base64 audio into a Blob URL
      const binaryString = atob(res.audioBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: res.mimeType || 'audio/wav' });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setLyrics(res.lyrics || null);
    } catch (err: any) {
      console.error('Music generation error:', err);
      setError(err.message || 'Failed to generate music with Lyria 3.');
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-900 via-orange-900 to-slate-900 p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-600/80 border border-amber-400/40 shadow-lg">
              <Music className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">Lyria 3 Music Generator</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/30 font-mono">
                  {modelType}
                </span>
              </div>
              <p className="text-xs text-amber-200/80 mt-1">
                Compose custom ambient garden soundtracks, workshop focus grooves, and background music
              </p>
            </div>
          </div>

          {/* Model toggle */}
          <div className="flex bg-slate-950/60 p-1 rounded-xl border border-amber-500/30 text-xs">
            <button
              onClick={() => setModelType('lyria-3-clip-preview')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
                modelType === 'lyria-3-clip-preview'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-amber-200 hover:text-white'
              }`}
            >
              Short Clip (up to 30s)
            </button>
            <button
              onClick={() => setModelType('lyria-3-pro-preview')}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
                modelType === 'lyria-3-pro-preview'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-amber-200 hover:text-white'
              }`}
            >
              Full-Length Track
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Column */}
        <div className="lg:col-span-6 space-y-5">
          {/* Prompt */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Music Style & Mood Description
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="e.g. Peaceful Celtic acoustic harp and wooden flute for pruning fruit trees..."
              className="w-full bg-slate-50 border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 rounded-xl p-3 text-sm text-slate-800 outline-none"
              disabled={loading}
            />
          </div>

          {/* Quick Inspirations */}
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-slate-500">Inspiring DIY & Garden Themes:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Uplifting acoustic guitar & birdsong for morning gardening',
                'Focused lo-fi beat with rhythmic wood percussion for carpentry workshop',
                'Peaceful Japanese garden ambient koto and gentle stream water',
                'Rustic bluegrass banjo and stomp for outdoor deck building',
              ].map((theme, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(theme)}
                  className="text-xs bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors text-left"
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Image Inspiration */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Optional: Visual Inspiration Image</span>
              {imageFile && (
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remove image
                </button>
              )}
            </label>
            <div className="border border-slate-200 hover:border-amber-400 rounded-xl p-3 bg-slate-50 relative flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                disabled={loading}
              />
              {imagePreview ? (
                <div className="flex items-center gap-3 w-full">
                  <img
                    src={imagePreview}
                    alt="Inspiration"
                    className="w-14 h-14 object-cover rounded-lg border border-slate-300"
                  />
                  <div className="text-xs">
                    <p className="font-semibold text-slate-700">Image attached</p>
                    <p className="text-slate-500">Lyria will compose melodies harmonizing with this scene</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Upload className="w-4 h-4 text-slate-400" />
                  <span>Upload garden or workshop photo to match the music vibe</span>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            {loading ? (
              <>
                <Spinner size="w-5 h-5" color="border-t-white" />
                <span>Synthesizing Audio with Lyria 3...</span>
              </>
            ) : (
              <>
                <Volume2 className="w-5 h-5" />
                <span>Generate Soundscape</span>
              </>
            )}
          </button>
        </div>

        {/* Audio Player Column */}
        <div className="lg:col-span-6 flex flex-col justify-center items-center bg-slate-900 rounded-2xl p-6 min-h-[350px] border border-slate-800 text-white relative">
          {loading ? (
            <div className="text-center space-y-4 max-w-sm">
              <Spinner size="w-12 h-12" color="border-t-amber-500" className="mx-auto" />
              <h4 className="font-bold text-slate-200">Streaming Lyria Audio Chunks</h4>
              <p className="text-xs text-slate-400">
                Synthesizing acoustic layers, harmonic pacing, and instrumentation...
              </p>
              {/* Animated audio wave bars */}
              <div className="flex items-center justify-center gap-1.5 h-8">
                {[40, 70, 30, 90, 50, 80, 20, 60, 95, 45, 65, 85].map((h, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-amber-500 rounded-full animate-bounce"
                    style={{
                      height: `${h}%`,
                      animationDelay: `${i * 0.08}s`,
                      animationDuration: '0.8s',
                    }}
                  />
                ))}
              </div>
            </div>
          ) : audioUrl ? (
            <div className="w-full space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h4 className="font-bold text-slate-100 text-base">Generated Soundscape</h4>
                  <p className="text-xs text-amber-300 font-mono mt-0.5">Model: {modelType}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Ready to Play
                </span>
              </div>

              {/* Player UI */}
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-inner flex flex-col items-center gap-5">
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  onPause={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  controls
                  className="w-full"
                />

                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlay}
                    className="p-4 rounded-full bg-amber-600 hover:bg-amber-500 text-white shadow-lg transition-transform active:scale-95"
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current" />}
                  </button>
                  <a
                    href={audioUrl}
                    download="lyria-garden-soundtrack.wav"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download WAV</span>
                  </a>
                </div>
              </div>

              {lyrics && (
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                  <span className="font-semibold text-amber-400">Track Lyrics / Theme Notes:</span>
                  <p className="italic whitespace-pre-wrap">{lyrics}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center space-y-3 max-w-xs text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-amber-400 border border-slate-700">
                <Music className="w-8 h-8" />
              </div>
              <h4 className="font-semibold text-slate-200">No Audio Generated Yet</h4>
              <p className="text-xs text-slate-500">
                Select your track length, type a mood description, and Lyria 3 will compose an original soundtrack.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MusicTab;
