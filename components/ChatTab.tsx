import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { sendChatMessage, ChatMessage } from '../services/geminiService';
import Spinner from './Spinner';

type ModelOption = 'gemini-4-argon' | 'gemini-3.8-flash' | 'gemini-3.1-flash-lite';

const ChatTab: React.FC = () => {
  const [model, setModel] = useState<ModelOption>('gemini-3.8-flash');
  const [systemRole, setSystemRole] = useState<string>(
    'Master DIY Craftsman & Landscape Architect'
  );
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: "Hello! I'm your DIY & Garden AI Consultant. Whether you're building a timber deck, wiring a 3-way switch, debugging a lawn sprinkler valve, or propagating heirloom tomatoes, ask away! You can switch models anytime depending on task complexity.",
    },
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const threadEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || loading) return;

    const userMessage = inputText.trim();
    setInputText('');
    setError(null);

    const updatedHistory: ChatMessage[] = [
      ...messages,
      { role: 'user', text: userMessage },
    ];
    setMessages(updatedHistory);
    setLoading(true);

    try {
      const systemInstruction = `You are the ${systemRole}. Provide meticulous, safe, clear, step-by-step guidance. Recommend specific measurements, materials, tools, and safety protocols. Note any hazards (e.g. electrical voltage, structural load-bearing limits, toxic garden pests).`;
      
      const res = await sendChatMessage({
        model,
        history: updatedHistory.slice(0, -1), // pass previous turns
        message: userMessage,
        systemInstruction,
      });

      setMessages((prev) => [...prev, { role: 'model', text: res.text }]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setError(err.message || 'Failed to receive a response from Gemini');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        role: 'model',
        text: `Chat reset. I am currently operating as the ${systemRole} using ${model}. What project are we tackling?`,
      },
    ]);
    setError(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col h-[750px]">
      {/* Top Controls Bar */}
      <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              Gemini Multi-Turn Advisor
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Active Session
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Preserves full conversation context across troubleshooting turns
            </p>
          </div>
        </div>

        {/* Model Selector & Role */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg p-1 text-xs">
            <span className="text-slate-400 font-medium pl-1.5">Model:</span>
            <button
              type="button"
              onClick={() => setModel('gemini-4-argon')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                model === 'gemini-4-argon'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Best for complex engineering, structural framing, complex wiring diagrams"
            >
              Argon (Complex)
            </button>
            <button
              type="button"
              onClick={() => setModel('gemini-3.8-flash')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                model === 'gemini-3.8-flash'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Best for general DIY, gardening, repair, and planning"
            >
              3.8 Flash (General)
            </button>
            <button
              type="button"
              onClick={() => setModel('gemini-3.1-flash-lite')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                model === 'gemini-3.1-flash-lite'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Ultra-fast for quick calculations and rapid lookups"
            >
              3.1 Lite (Fast)
            </button>
          </div>

          <button
            onClick={handleClearHistory}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Role customization banner */}
      <div className="bg-slate-100/70 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Role Persona:</span>
          <select
            value={systemRole}
            onChange={(e) => setSystemRole(e.target.value)}
            className="bg-white border border-slate-300 rounded px-2 py-0.5 font-medium text-slate-800"
          >
            <option value="Master DIY Craftsman & Landscape Architect">
              Master DIY Craftsman & Landscape Architect (Default)
            </option>
            <option value="Licensed Structural & Carpentry Specialist">
              Licensed Structural & Carpentry Specialist
            </option>
            <option value="Master Electrician & Smart Home Advisor">
              Master Electrician & Smart Home Advisor
            </option>
            <option value="Botanist & Organic Soil Scientist">
              Botanist & Organic Soil Scientist
            </option>
            <option value="Home Safety & Building Inspector">
              Home Safety & Building Inspector
            </option>
          </select>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
          <span>Active: {model}</span>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={index}
              className={`flex items-start gap-3 ${
                isUser ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                  isUser
                    ? 'bg-slate-700 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed ${
                  isUser
                    ? 'bg-slate-800 text-white rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none whitespace-pre-wrap'
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-3 text-slate-500 text-sm">
              <Spinner size="w-5 h-5" color="border-t-emerald-600" />
              <span>{model === 'gemini-4-argon' ? 'Argon is analyzing deep structural requirements...' : 'Gemini is drafting advice...'}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-center gap-2 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={threadEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="bg-white px-4 py-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-xs text-slate-500">
        <span className="font-medium text-slate-400 shrink-0">Try asking:</span>
        {[
          'How do I calculate joist span for a 12x16 deck?',
          'Why are my tomato leaves curling and yellowing?',
          'Steps to replace a faulty GFCI outlet safely',
          'Best organic mulch for drought-prone perennial beds',
        ].map((sample, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setInputText(sample)}
            className="shrink-0 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            {sample}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSend}
        className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Ask the ${systemRole}...`}
          className="flex-1 bg-slate-50 border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={!inputText.trim() || loading}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium px-5 py-3 rounded-xl flex items-center gap-2 transition-all shadow-md shrink-0"
        >
          {loading ? (
            <Spinner size="w-4 h-4" color="border-t-white" />
          ) : (
            <>
              <span>Send</span>
              <Send className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ChatTab;
