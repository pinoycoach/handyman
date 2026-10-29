import React, { useState } from 'react';
import { Image as ImageIcon, Sparkles, Download, Wand2, Upload, AlertCircle, Search, Sliders } from 'lucide-react';
import { generateOrEditImage, fileToBase64 } from '../services/geminiService';
import Spinner from './Spinner';

const ImageTab: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('Modern Japanese zen backyard garden with a cedar hot tub, stone stepping stones, and moss lawn');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Banana 2.1 specific configs
  const [resolution, setResolution] = useState<'1K' | '2K' | '4K'>('1K');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [useSearchGrounding, setUseSearchGrounding] = useState<boolean>(true);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please provide a prompt describing the image to generate or edit.');
      return;
    }

    setLoading(true);
    setError(null);
    setResultImage(null);
    setResultText(null);

    try {
      let baseImage: { data: string; mimeType: string } | undefined;
      if (selectedFile) {
        baseImage = await fileToBase64(selectedFile);
      }

      const res = await generateOrEditImage({
        prompt: prompt.trim(),
        baseImage,
        aspectRatio,
        imageSize: resolution,
        useSearch: useSearchGrounding,
      });

      setResultImage(res.imageUrl);
      setResultText(res.text || null);
    } catch (err: any) {
      console.error('Image generation error:', err);
      setError(err.message || 'Image generation failed with Gemini Nano Banana 2.1');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-600/80 border border-emerald-400/40 shadow-lg">
              <ImageIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">Nano Banana 2.1 Visual Studio</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 font-mono">
                  gemini-nano-banana-2.1
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 mt-1">
                Generate and edit photorealistic DIY designs, landscapes, and blueprints up to 4K resolution
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/30 text-xs">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-emerald-300">Google Image Search Grounding Enabled</span>
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Column */}
        <div className="lg:col-span-6 space-y-5">
          {/* Prompt */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Design / Modification Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Describe your garden concept or edits (e.g. Add a timber pergola with wisteria, raised cedar garden beds, and gravel walkway)..."
              className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl p-3 text-sm text-slate-800 outline-none"
              disabled={loading}
            />
          </div>

          {/* Quick DIY Design Presets */}
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-slate-500">Inspiration Presets:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Raised garden beds with drip irrigation and heirloom tomato trellises',
                'Custom backyard firepit patio with flagstone and Adirondack cedar chairs',
                'Organized garage workshop with French cleat tool wall and butcher block workbench',
              ].map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(preset)}
                  className="text-xs bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors text-left"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Image to Edit */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Upload Image to Edit (Optional)</span>
              {selectedFile && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="text-xs text-red-500 hover:underline"
                >
                  Clear image (create from scratch)
                </button>
              )}
            </label>
            <div className="border border-slate-200 hover:border-emerald-400 rounded-xl p-3 bg-slate-50 relative flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                disabled={loading}
              />
              {previewUrl ? (
                <div className="flex items-center gap-3 w-full">
                  <img
                    src={previewUrl}
                    alt="Upload"
                    className="w-16 h-16 object-cover rounded-lg border border-slate-300"
                  />
                  <div className="text-xs">
                    <p className="font-semibold text-slate-700">Image Loaded for Editing</p>
                    <p className="text-slate-500">Prompt will edit, replace, or add elements to this photo</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Upload className="w-4 h-4 text-slate-400" />
                  <span>Upload your existing yard, patio, or workshop photo to edit</span>
                </div>
              )}
            </div>
          </div>

          {/* Banana 2.1 Settings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Resolution</label>
              <select
                value={resolution}
                onChange={(e: any) => setResolution(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-semibold text-slate-800"
                disabled={loading}
              >
                <option value="1K">1K (Standard HD)</option>
                <option value="2K">2K (High Res)</option>
                <option value="4K">4K (Ultra Detail)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Aspect Ratio</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-semibold text-slate-800"
                disabled={loading}
              >
                <option value="1:1">1:1 Square</option>
                <option value="16:9">16:9 Widescreen</option>
                <option value="9:16">9:16 Vertical</option>
                <option value="4:3">4:3 Landscape</option>
                <option value="3:4">3:4 Portrait</option>
                <option value="4:1">4:1 Banner Panoramic</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Web & Image Search</label>
              <label className="flex items-center gap-2 mt-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useSearchGrounding}
                  onChange={(e) => setUseSearchGrounding(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                  disabled={loading}
                />
                <span>Real-world reference search</span>
              </label>
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
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            {loading ? (
              <>
                <Spinner size="w-5 h-5" color="border-t-white" />
                <span>Rendering High-Res Image with Banana 2.1...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                <span>{selectedFile ? 'Edit Uploaded Image' : 'Generate New Design'}</span>
              </>
            )}
          </button>
        </div>

        {/* Output Column */}
        <div className="lg:col-span-6 flex flex-col justify-center items-center bg-slate-900 rounded-2xl p-6 min-h-[380px] border border-slate-800 text-white relative">
          {loading ? (
            <div className="text-center space-y-4 max-w-sm">
              <Spinner size="w-12 h-12" color="border-t-emerald-500" className="mx-auto" />
              <h4 className="font-bold text-slate-200">Generating {resolution} Render</h4>
              <p className="text-xs text-slate-400">
                Nano Banana 2.1 is calculating photorealistic textures, shadows, and botanical geometries...
              </p>
            </div>
          ) : resultImage ? (
            <div className="w-full space-y-4">
              <div className="rounded-xl overflow-hidden border border-slate-700 bg-black shadow-2xl">
                <img
                  src={resultImage}
                  alt="Generated Design"
                  className="w-full max-h-[440px] object-contain mx-auto"
                />
              </div>

              {resultText && (
                <div className="bg-slate-950 p-3 rounded-lg text-xs text-slate-300">
                  {resultText}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-emerald-400">Model: gemini-nano-banana-2.1 ({resolution})</span>
                <a
                  href={resultImage}
                  download="banana-2-1-garden-design.png"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Image</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-3 max-w-xs text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-emerald-400 border border-slate-700">
                <ImageIcon className="w-8 h-8" />
              </div>
              <h4 className="font-semibold text-slate-200">No Image Generated Yet</h4>
              <p className="text-xs text-slate-500">
                Choose your aspect ratio and resolution (up to 4K), then click generate to visualize your DIY or garden project.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageTab;
