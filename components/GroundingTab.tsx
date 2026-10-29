import React, { useState } from 'react';
import { Search, MapPin, ExternalLink, Globe, Compass, AlertCircle } from 'lucide-react';
import { searchGrounding, mapsGrounding, GroundingUrl } from '../services/geminiService';
import Spinner from './Spinner';

const GroundingTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'search' | 'maps'>('search');

  // Search Grounding state
  const [searchPrompt, setSearchPrompt] = useState<string>(
    'What are the latest 2026 organic recommendations for controlling spotted lanternfly on fruit trees?'
  );
  const [searchOutput, setSearchOutput] = useState<string | null>(null);
  const [groundingUrls, setGroundingUrls] = useState<GroundingUrl[]>([]);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Maps Grounding state
  const [mapsPrompt, setMapsPrompt] = useState<string>(
    'Where are the best native plant nurseries and organic garden supply centers?'
  );
  const [locationContext, setLocationContext] = useState<string>('Austin, TX');
  const [mapsOutput, setMapsOutput] = useState<string | null>(null);
  const [mapsChunks, setMapsChunks] = useState<any[]>([]);
  const [mapsLoading, setMapsLoading] = useState<boolean>(false);
  const [mapsError, setMapsError] = useState<string | null>(null);

  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchPrompt.trim() || searchLoading) return;

    setSearchLoading(true);
    setSearchError(null);
    setSearchOutput(null);
    setGroundingUrls([]);

    try {
      const res = await searchGrounding({
        prompt: searchPrompt.trim(),
      });
      setSearchOutput(res.text);
      setGroundingUrls(res.groundingUrls || []);
    } catch (err: any) {
      console.error('Search grounding error:', err);
      setSearchError(err.message || 'Search grounding request failed.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleMapsSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!mapsPrompt.trim() || mapsLoading) return;

    setMapsLoading(true);
    setMapsError(null);
    setMapsOutput(null);
    setMapsChunks([]);

    try {
      const res = await mapsGrounding({
        prompt: mapsPrompt.trim(),
        locationContext: locationContext.trim(),
      });
      setMapsOutput(res.text);
      setMapsChunks(res.groundingChunks || []);
    } catch (err: any) {
      console.error('Maps grounding error:', err);
      setMapsError(err.message || 'Maps grounding request failed.');
    } finally {
      setMapsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-900 via-cyan-900 to-slate-900 p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-teal-600/80 border border-teal-400/40 shadow-lg">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">Google Search & Maps Grounding</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-500/30 text-teal-200 border border-teal-400/30 font-mono">
                  gemini-3.8-flash
                </span>
              </div>
              <p className="text-xs text-teal-200/80 mt-1">
                Grounded live knowledge with real-time web citations and geographic hardware & nursery lookups
              </p>
            </div>
          </div>

          {/* Toggle between Search & Maps */}
          <div className="flex bg-slate-950/60 p-1 rounded-xl border border-teal-500/30 text-xs">
            <button
              onClick={() => setActiveSubTab('search')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
                activeSubTab === 'search'
                  ? 'bg-teal-600 text-white shadow'
                  : 'text-teal-200 hover:text-white'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Google Search Grounding</span>
            </button>
            <button
              onClick={() => setActiveSubTab('maps')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
                activeSubTab === 'maps'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-cyan-200 hover:text-white'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Google Maps Grounding</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {activeSubTab === 'search' ? (
          <div className="space-y-6">
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Search Query for Live Web Verification
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchPrompt}
                    onChange={(e) => setSearchPrompt(e.target.value)}
                    placeholder="e.g. Current 2026 spring frost dates for zone 7b, or latest local lumber prices..."
                    className="flex-1 bg-slate-50 border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none"
                    disabled={searchLoading}
                  />
                  <button
                    type="submit"
                    disabled={searchLoading || !searchPrompt.trim()}
                    className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl flex items-center gap-2 shadow-md transition-all shrink-0"
                  >
                    {searchLoading ? <Spinner size="w-4 h-4" color="border-t-white" /> : <Search className="w-4 h-4" />}
                    <span>Search Ground</span>
                  </button>
                </div>
              </div>

              {/* Sample Queries */}
              <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                <span className="font-semibold text-slate-400 self-center">Try:</span>
                {[
                  'What are the 2026 USDA plant hardiness zone updates?',
                  'Current building code requirements for residential deck handrails in 2026',
                  'Latest EPA regulations on consumer lawn fertilizers and runoff prevention',
                ].map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSearchPrompt(sample)}
                    className="bg-slate-100 hover:bg-teal-50 hover:text-teal-800 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </form>

            {searchError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{searchError}</span>
              </div>
            )}

            {/* Results */}
            {searchLoading && (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                <Spinner size="w-8 h-8" color="border-t-teal-600" className="mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">Connecting with Google Search...</p>
                <p className="text-xs text-slate-400">Grounding facts and extracting verified source URLs</p>
              </div>
            )}

            {searchOutput && (
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-teal-600" />
                    <span>Search-Grounded Intelligence:</span>
                  </h4>
                  <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {searchOutput}
                  </div>
                </div>

                {groundingUrls.length > 0 && (
                  <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-4">
                    <h5 className="text-xs font-bold text-teal-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Verified Web Sources ({groundingUrls.length})</span>
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {groundingUrls.map((g, idx) => (
                        <a
                          key={idx}
                          href={g.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-white border border-teal-200 text-teal-800 hover:bg-teal-100 hover:text-teal-900 transition-colors shadow-xs"
                        >
                          <span className="truncate max-w-[240px]">{g.title || g.uri}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <form onSubmit={handleMapsSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    What are you looking for?
                  </label>
                  <input
                    type="text"
                    value={mapsPrompt}
                    onChange={(e) => setMapsPrompt(e.target.value)}
                    placeholder="e.g. Local hardware store open on Sunday with tool rental..."
                    className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none"
                    disabled={mapsLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Your Location / City
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-cyan-600 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={locationContext}
                      onChange={(e) => setLocationContext(e.target.value)}
                      placeholder="e.g. Seattle, WA or ZIP code"
                      className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 outline-none"
                      disabled={mapsLoading}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                  <span className="font-semibold text-slate-400 self-center">Try:</span>
                  {[
                    'Best local nurseries with drought-resistant perennials',
                    'Where can I find bulk hardwood mulch and topsoil delivery?',
                    'Tool rental shops with gas-powered aerators and tillers',
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setMapsPrompt(preset)}
                      className="bg-slate-100 hover:bg-cyan-50 hover:text-cyan-800 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={mapsLoading || !mapsPrompt.trim()}
                  className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl flex items-center gap-2 shadow-md transition-all shrink-0"
                >
                  {mapsLoading ? <Spinner size="w-4 h-4" color="border-t-white" /> : <Compass className="w-4 h-4" />}
                  <span>Locate Places</span>
                </button>
              </div>
            </form>

            {mapsError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{mapsError}</span>
              </div>
            )}

            {/* Results */}
            {mapsLoading && (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                <Spinner size="w-8 h-8" color="border-t-cyan-600" className="mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">Querying Google Maps Grounding...</p>
                <p className="text-xs text-slate-400">Finding verified addresses, service areas, and local spots</p>
              </div>
            )}

            {mapsOutput && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-600" />
                  <span>Geographically Grounded Results:</span>
                </h4>
                <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {mapsOutput}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GroundingTab;
