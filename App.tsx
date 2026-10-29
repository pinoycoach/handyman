import React, { useState } from 'react';
import {
  Wrench,
  Bot,
  Video,
  Music,
  Image as ImageIcon,
  Mic,
  FileText,
  MapPin,
  Sparkles,
  Hammer,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import WhatsNewBanner from './components/WhatsNewBanner';
import ChatTab from './components/ChatTab';
import VideoTab from './components/VideoTab';
import MusicTab from './components/MusicTab';
import ImageTab from './components/ImageTab';
import VoiceLiveTab from './components/VoiceLiveTab';
import TranscribeTab from './components/TranscribeTab';
import GroundingTab from './components/GroundingTab';
import ProjectPlannerTab from './components/ProjectPlannerTab';
import Disclaimer from './components/Disclaimer';

export type ActiveTab =
  | 'chat'
  | 'video'
  | 'music'
  | 'image'
  | 'voice'
  | 'transcribe'
  | 'grounding'
  | 'planner';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');

  const navItems = [
    { id: 'chat', label: 'AI Advisor', icon: Bot, badge: 'Argon / Flash' },
    { id: 'video', label: 'Omni Video', icon: Video, badge: 'Omni Flash' },
    { id: 'music', label: 'Lyria Music', icon: Music, badge: 'Lyria 3' },
    { id: 'image', label: 'Banana 2.1 Studio', icon: ImageIcon, badge: 'Up to 4K' },
    { id: 'voice', label: 'Live Voice Copilot', icon: Mic, badge: 'Real-Time' },
    { id: 'transcribe', label: 'Transcribe Audio', icon: FileText, badge: '3.5 Transcribe' },
    { id: 'grounding', label: 'Search & Maps', icon: Compass, badge: 'Live Grounding' },
    { id: 'planner', label: 'Project Blueprint', icon: Hammer, badge: 'Supplies & Fixes' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-900/30">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-white">
                  DIY Home & Garden Helper
                </h1>
                <span className="hidden sm:inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Multimodal 2026 Edition
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Full-stack intelligent assistant for carpentry, plumbing, electrical, landscaping & botanical care
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Full-Stack Server Backend Active</span>
            </div>
          </div>
        </div>

        {/* Horizontal Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex items-center space-x-1 overflow-x-auto py-2 no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as ActiveTab)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`hidden lg:inline text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        isActive
                          ? 'bg-emerald-800/80 text-emerald-100'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Interactive "What's Now Possible (2026 vs 2025)" feature showcase */}
        <WhatsNewBanner onNavigateTab={(tab) => setActiveTab(tab as ActiveTab)} />

        {/* Tab Panels */}
        {activeTab === 'chat' && <ChatTab />}
        {activeTab === 'video' && <VideoTab />}
        {activeTab === 'music' && <MusicTab />}
        {activeTab === 'image' && <ImageTab />}
        {activeTab === 'voice' && <VoiceLiveTab />}
        {activeTab === 'transcribe' && <TranscribeTab />}
        {activeTab === 'grounding' && <GroundingTab />}
        {activeTab === 'planner' && <ProjectPlannerTab amazonAssociateTag="mytreat-20" />}

        {/* General DIY Safety Disclaimer */}
        <Disclaimer>
          Always adhere to local building codes, electrical and plumbing safety regulations, and personal protective equipment (PPE) requirements when executing DIY home improvements or operating power tools and chemical garden treatments.
        </Disclaimer>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p>
            Powered by modern Google GenAI models: <strong>gemini-4-argon</strong>, <strong>gemini-3.8-flash</strong>, <strong>gemini-3.1-flash-lite</strong>, <strong>gemini-omni-1.1-flash</strong>, <strong>gemini-nano-banana-2.1</strong>, <strong>lyria-3</strong>, <strong>gemini-3.8-live</strong>, and <strong>gemini-3.5-transcribe</strong>.
          </p>
          <p className="text-slate-600">
            DIY Home & Garden Helper • Full-Stack AI Studio Applet
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;