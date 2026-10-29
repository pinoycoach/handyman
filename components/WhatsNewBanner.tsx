import React, { useState } from 'react';
import { Sparkles, ArrowRight, Video, Music, Image as ImageIcon, Mic, MapPin, Search, Cpu, CheckCircle2 } from 'lucide-react';

interface WhatsNewBannerProps {
  onNavigateTab: (tabId: string) => void;
}

const WhatsNewBanner: React.FC<WhatsNewBannerProps> = ({ onNavigateTab }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const capabilities = [
    {
      icon: <Video className="w-5 h-5 text-purple-400" />,
      title: "Omni Flash Video Synthesis & Animation",
      model: "gemini-omni-1.1-flash",
      desc: "Turn DIY prompts into realistic 720p/1080p videos or animate backyard photos into flowing garden vistas.",
      tab: "video",
    },
    {
      icon: <Music className="w-5 h-5 text-amber-400" />,
      title: "Lyria 3 Studio Music Engine",
      model: "lyria-3-clip-preview & pro",
      desc: "Compose custom acoustic garden ambiance or rhythmic workshop soundtracks from text or photo inspiration.",
      tab: "music",
    },
    {
      icon: <ImageIcon className="w-5 h-5 text-emerald-400" />,
      title: "Nano Banana 2.1 Image Studio",
      model: "gemini-nano-banana-2.1",
      desc: "Generate and edit landscaping and DIY blueprints up to 4K resolution with real-time web & image search context.",
      tab: "image",
    },
    {
      icon: <Mic className="w-5 h-5 text-rose-400" />,
      title: "Hands-Free Voice Copilot (Live API)",
      model: "gemini-3.8-live",
      desc: "Talk in real time while your hands are muddy or operating power tools with bidirectional PCM audio streaming.",
      tab: "voice",
    },
    {
      icon: <Cpu className="w-5 h-5 text-blue-400" />,
      title: "Gemini 4 Argon & 3.8 Chatbot",
      model: "gemini-4-argon / 3.8-flash / 3.1-lite",
      desc: "Deep structural calculations with Argon, general DIY guidance with Flash, and lightning answers with Lite.",
      tab: "chat",
    },
    {
      icon: <MapPin className="w-5 h-5 text-cyan-400" />,
      title: "Live Google Search & Maps Grounding",
      model: "gemini-3.8-flash",
      desc: "Pinpoint local plant nurseries and hardware supplies or fetch real-time 2026 frost dates with cited sources.",
      tab: "grounding",
    },
  ];

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 mb-8 shadow-2xl text-white">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-indigo-500/20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 shadow-md">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                What's Now Possible (2026 vs 2025)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                Major Upgrade
              </span>
            </div>
            <p className="text-xs text-indigo-200/80 mt-0.5">
              In 2025, apps were limited to basic text generation and legacy models. Here are the breakthrough multimodal capabilities unlocked today:
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 transition-colors border border-indigo-400/30"
        >
          {isExpanded ? 'Collapse Overview' : 'Explore Breakthroughs'}
        </button>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-4">
          {capabilities.map((c, idx) => (
            <div
              key={idx}
              className="group bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/50 rounded-xl p-3.5 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-700/50">
                    {c.icon}
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/90 text-indigo-300 border border-indigo-500/30">
                    {c.model}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-100 group-hover:text-indigo-200 transition-colors">
                  {c.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {c.desc}
                </p>
              </div>
              <button
                onClick={() => onNavigateTab(c.tab)}
                className="mt-3 text-xs font-semibold text-indigo-300 hover:text-white flex items-center gap-1.5 transition-colors self-start"
              >
                Launch Feature <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WhatsNewBanner;
