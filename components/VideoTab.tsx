import React, { useState } from 'react';
import { Video, Film, Image as ImageIcon, Sparkles, Download, Play, RefreshCw, AlertCircle, Upload } from 'lucide-react';
import { generateTextToVideo, animateImageToVideo, fileToBase64 } from '../services/geminiService';
import Spinner from './Spinner';

const VideoTab: React.FC = () => {
  const [subMode, setSubMode] = useState<'textToVideo' | 'animateImage'>('animateImage');
  
  // Text-to-Video state
  const [textPrompt, setTextPrompt] = useState<string>('');
  const [textAspectRatio, setTextAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [duration, setDuration] = useState<'5s' | '10s'>('5s');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');

  // Animate Image state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [motionPrompt, setMotionPrompt] = useState<string>('Gentle cinematic pan across the garden as leaves sway in the breeze');
  const [animAspectRatio, setAnimAspectRatio] = useState<'16:9' | '9:16'>('16:9');

  // Generation result & status
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setGeneratedVideoUrl(null);

    try {
      if (subMode === 'textToVideo') {
        if (!textPrompt.trim()) {
          throw new Error('Please enter a description of the video to generate.');
        }
        setProgressMsg('Contacting Gemini Omni Flash Interactions API (rendering video frames)...');
        const res = await generateTextToVideo({
          prompt: textPrompt.trim(),
          aspectRatio: textAspectRatio,
          duration,
          resolution,
        });
        setGeneratedVideoUrl(res.videoUrl);
      } else {
        if (!selectedFile) {
          throw new Error('Please upload an image to animate into video.');
        }
        setProgressMsg('Uploading photo & interpolating motion physics with Omni Flash...');
        const base64Data = await fileToBase64(selectedFile);
        const res = await animateImageToVideo({
          image: base64Data,
          motionPrompt: motionPrompt.trim() || 'Cinematic ambient motion',
          aspectRatio: animAspectRatio,
        });
        setGeneratedVideoUrl(res.videoUrl);
      }
    } catch (err: any) {
      console.error('Video generation error:', err);
      setError(err.message || 'Video generation failed.');
    } finally {
      setLoading(false);
      setProgressMsg('');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-600/80 border border-purple-400/40 shadow-lg">
              <Film className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">Omni Flash Video Studio</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/30 font-mono">
                  gemini-omni-1.1-flash
                </span>
              </div>
              <p className="text-xs text-purple-200/80 mt-1">
                Produce realistic 16:9 or 9:16 videos from text prompts or bring static yard and DIY photos to life
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-slate-950/60 p-1 rounded-xl border border-purple-500/30 text-xs">
            <button
              onClick={() => setSubMode('animateImage')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
                subMode === 'animateImage'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-purple-200 hover:text-white'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Animate Photo</span>
            </button>
            <button
              onClick={() => setSubMode('textToVideo')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
                subMode === 'textToVideo'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-purple-200 hover:text-white'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Text to Video</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Column */}
        <div className="lg:col-span-6 space-y-5">
          {subMode === 'animateImage' ? (
            <>
              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Upload Starting Photo (Garden, Patio, Woodwork, or Tool)
                </label>
                <div className="border-2 border-dashed border-slate-300 hover:border-purple-500 rounded-xl p-4 text-center bg-slate-50 transition-colors relative cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    disabled={loading}
                  />
                  {imagePreview ? (
                    <div className="space-y-2">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-48 mx-auto rounded-lg object-contain shadow-sm border border-slate-200"
                      />
                      <p className="text-xs text-purple-700 font-medium">Click or drop to replace photo</p>
                    </div>
                  ) : (
                    <div className="py-6 flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-slate-400" />
                      <p className="text-sm font-medium text-slate-700">Drop an image here or click to browse</p>
                      <p className="text-xs text-slate-400">PNG, JPG, WEBP up to 20MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Motion Prompt */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Motion Prompt & Camera Movement
                </label>
                <textarea
                  value={motionPrompt}
                  onChange={(e) => setMotionPrompt(e.target.value)}
                  rows={3}
                  placeholder="Describe camera motion, water flow, fluttering leaves, or sparks..."
                  className="w-full bg-slate-50 border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-xl p-3 text-sm text-slate-800 outline-none"
                  disabled={loading}
                />
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Target Aspect Ratio
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAnimAspectRatio('16:9')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                      animAspectRatio === '16:9'
                        ? 'border-purple-600 bg-purple-50 text-purple-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    16:9 Landscape (Desktop / TV)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnimAspectRatio('9:16')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                      animAspectRatio === '9:16'
                        ? 'border-purple-600 bg-purple-50 text-purple-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    9:16 Portrait (Mobile / Reels)
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Text to Video Prompt */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Detailed Video Prompt
                </label>
                <textarea
                  value={textPrompt}
                  onChange={(e) => setTextPrompt(e.target.value)}
                  rows={4}
                  placeholder="e.g. A hyper-realistic 4k time-lapse of a raised cedar garden bed being planted with fresh basil, thyme, and lavender as the morning sun casts golden beams..."
                  className="w-full bg-slate-50 border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-xl p-3 text-sm text-slate-800 outline-none"
                  disabled={loading}
                />
              </div>

              {/* Presets */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-slate-500">Inspiring Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Gentle garden sprinkler misting red rose bushes in slow motion',
                    'A master craftsman using a Japanese pull saw on walnut timber with wood shavings flying',
                    'Backyard patio stone walkway glowing under solar lantern lights at dusk',
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTextPrompt(preset)}
                      className="text-xs bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors text-left"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Settings Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Aspect Ratio</label>
                  <select
                    value={textAspectRatio}
                    onChange={(e: any) => setTextAspectRatio(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800"
                    disabled={loading}
                  >
                    <option value="16:9">16:9 Landscape</option>
                    <option value="9:16">9:16 Portrait</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Duration</label>
                  <select
                    value={duration}
                    onChange={(e: any) => setDuration(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800"
                    disabled={loading}
                  >
                    <option value="5s">5 Seconds</option>
                    <option value="10s">10 Seconds</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Resolution</label>
                  <select
                    value={resolution}
                    onChange={(e: any) => setResolution(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-800"
                    disabled={loading}
                  >
                    <option value="720p">720p HD</option>
                    <option value="1080p">1080p Full HD</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            {loading ? (
              <>
                <Spinner size="w-5 h-5" color="border-t-white" />
                <span>Generating Video with Omni Flash...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>{subMode === 'animateImage' ? 'Animate Photo to Video' : 'Generate Video from Prompt'}</span>
              </>
            )}
          </button>
        </div>

        {/* Video Player / Output Column */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center bg-slate-900 rounded-2xl p-6 min-h-[380px] border border-slate-800 text-white relative">
          {loading ? (
            <div className="text-center space-y-4 max-w-sm">
              <Spinner size="w-12 h-12" color="border-t-purple-500" className="mx-auto" />
              <h4 className="font-bold text-slate-200">Rendering Video Synthesis</h4>
              <p className="text-xs text-slate-400">{progressMsg || 'Omni Flash is computing neural motion vectors...'}</p>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full animate-pulse w-3/4"></div>
              </div>
            </div>
          ) : generatedVideoUrl ? (
            <div className="w-full space-y-4">
              <div className="rounded-xl overflow-hidden border border-slate-700 bg-black shadow-2xl">
                <video
                  src={generatedVideoUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full max-h-[420px] object-contain mx-auto"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-purple-300">Model: gemini-omni-1.1-flash</span>
                <a
                  href={generatedVideoUrl}
                  download="diy-garden-video.mp4"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download MP4</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-3 max-w-xs text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-purple-400 border border-slate-700">
                <Film className="w-8 h-8" />
              </div>
              <h4 className="font-semibold text-slate-200">No Video Generated Yet</h4>
              <p className="text-xs text-slate-500">
                Select a photo to animate or enter a creative text prompt on the left to synthesize high-fidelity video.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoTab;
