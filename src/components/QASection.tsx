import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, Send, Sparkles, AlertCircle, Copy, Check, MessageSquare } from 'lucide-react';
import { Message } from '../types';

interface QASectionProps {
  onIncrementQA: () => void;
}

export default function QASection({ onIncrementQA }: QASectionProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I am your AI Smart Learning Companion. Ask me any academic question, and I will break it down for you using high-retention frameworks, everyday analogies, structured points, and a motivational takeaway.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const quickPrompts = [
    { label: "Quantum Computing Analogy", query: "Can you explain Quantum Computing using a simple real-world analogy? Keep it intuitive." },
    { label: "Mnemonic for Mitosis", query: "Create a memorable mnemonic device and breakdown for the stages of Mitosis (IPMAT)." },
    { label: "Newton's Laws Breakdown", query: "Explain Newton's Three Laws of Motion with real-life sports examples." },
    { label: "Photosynthesis Step-by-Step", query: "I need a structured step-by-step breakdown of light-dependent vs light-independent reactions of photosynthesis." }
  ];

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    setError(null);
    const userMsg: Message = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // API call to Express full-stack proxy
      const response = await fetch('/api/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: textToSend,
          // Limit history to last 5 messages to avoid blowing up context tokens
          history: messages.slice(-5)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate companion response');
      }

      const data = await response.json();
      const assistantMsg: Message = {
        id: `assistant_${Date.now()}`,
        sender: 'assistant',
        text: data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
      onIncrementQA();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected communication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Basic custom renderer for structured Markdown styling
  const renderMarkdownText = (rawText: string) => {
    const lines = rawText.split('\n');
    return lines.map((line, lineIdx) => {
      // Check for code blocks
      if (line.startsWith('```')) {
        return null; // For simplicity in line-by-line, we treat code blocks inline or format basic
      }

      // Headers (e.g. ### Title)
      if (line.startsWith('###')) {
        return (
          <h4 key={lineIdx} className="font-bold text-slate-800 text-base mt-4 mb-2 first:mt-0 font-display flex items-center gap-1.5 border-b border-slate-100 pb-1">
            <Sparkles className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            {line.replace(/^###\s*/, '')}
          </h4>
        );
      }
      if (line.startsWith('##')) {
        return (
          <h3 key={lineIdx} className="font-bold text-slate-900 text-lg mt-5 mb-2.5 first:mt-0 font-display text-indigo-950 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-indigo-600 rounded-sm" />
            {line.replace(/^##\s*/, '')}
          </h3>
        );
      }
      if (line.startsWith('#')) {
        return (
          <h2 key={lineIdx} className="font-extrabold text-slate-950 text-xl mt-6 mb-3 first:mt-0 font-display select-none">
            {line.replace(/^#\s*/, '')}
          </h2>
        );
      }

      // Blockquote
      if (line.startsWith('>')) {
        return (
          <blockquote key={lineIdx} className="border-l-4 border-indigo-400 bg-indigo-50/50 px-4 py-2 my-3 rounded-r-lg text-slate-700 italic text-sm">
            {line.replace(/^>\s*/, '')}
          </blockquote>
        );
      }

      // Check bullet point
      if (line.startsWith('* ') || line.startsWith('- ') || line.startsWith('• ')) {
        const textContent = line.replace(/^[\*\-\•]\s*/, '');
        return (
          <div key={lineIdx} className="flex items-start gap-2.5 my-1.5 pl-2 leading-relaxed text-slate-700 text-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
            <span dangerouslySetInnerHTML={{ __html: parseBoldText(textContent) }} />
          </div>
        );
      }

      // Empty line
      if (line.trim() === '') {
        return <div key={lineIdx} className="h-2" />;
      }

      // Ordinary line
      return (
        <p key={lineIdx} className="text-slate-700 leading-relaxed text-sm my-1" 
           dangerouslySetInnerHTML={{ __html: parseBoldText(line) }} />
      );
    });
  };

  // Helper function to turn **bold** text to HTML formatted bold
  const parseBoldText = (text: string): string => {
    // Basic formatting for **bold**
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-950">$1</strong>');
    // Formatting for `code`
    formatted = formatted.replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-xs text-indigo-700">$1</code>');
    return formatted;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col h-[calc(100vh-140px)] min-h-[550px] animate-fade-in">
      
      {/* Top Section Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
            <HelpCircle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 font-display">Chat AI</h2>
            <p className="text-xs text-slate-400">Discuss educational theoretical questions with AI Smart Learning Companion</p>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex items-start gap-3.5 max-w-[85%] ${
              msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
            }`}
          >
            {/* Avatar block */}
            <div className={`p-2.5 rounded-xl flex-shrink-0 text-white shadow-sm font-semibold text-xs ${
              msg.sender === 'user' 
                ? 'bg-slate-900' 
                : 'bg-indigo-600'
            }`}>
              {msg.sender === 'user' ? 'ME' : 'AI'}
            </div>

            {/* Bubble contents */}
            <div className="space-y-1 relative group">
              <div className={`rounded-3xl px-5 py-4 text-slate-800 ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none shadow-sm'
                  : 'bg-slate-50/80 border border-slate-100 rounded-tl-none'
              }`}>
                {msg.sender === 'user' ? (
                  <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  <div className="space-y-1.5">
                    {renderMarkdownText(msg.text)}
                  </div>
                )}
              </div>
              
              {/* Message Meta Info */}
              <div className={`flex items-center gap-2 text-[10px] text-slate-400 px-2 ${
                msg.sender === 'user' ? 'justify-end' : ''
              }`}>
                <span>{msg.timestamp}</span>
                {msg.sender === 'assistant' && (
                  <button
                    onClick={() => copyToClipboard(msg.text, msg.id)}
                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                    title="Copy response text"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3.5 max-w-[85%]">
            <div className="p-2.5 rounded-xl flex-shrink-0 text-white bg-indigo-600 shadow-sm font-semibold text-xs animate-bounce">
              AI
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-3xl rounded-tl-none px-6 py-4.5 flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs font-semibold text-slate-400 font-mono tracking-wide">Synthesizing educational response...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start gap-3 text-rose-800">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-rose-500" />
            <div className="space-y-1">
              <h5 className="font-bold text-sm">Educational Sync Failed</h5>
              <p className="text-xs text-rose-700/90 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggested Input Tiles (only displays on startup or minimal messages) */}
      {messages.length === 1 && (
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/20">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
            Selected Inquiry Presets
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                id={`preset-${idx}`}
                onClick={() => handleSend(p.query)}
                className="text-left p-3 rounded-xl bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 transition-all text-xs font-medium text-slate-700 hover:text-indigo-900 group"
              >
                💡 {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Text Form Input */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="px-6 py-4.5 bg-slate-50/50 border-t border-slate-100 flex items-center gap-3.5"
      >
        <input
          id="qa-input-field"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask any educational question or request academic breakdowns..."
          className="flex-1 px-5 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 text-sm shadow-sm transition-all text-slate-800 placeholder-slate-400"
          disabled={loading}
        />
        <button
          id="qa-submit-btn"
          type="submit"
          className="p-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center flex-shrink-0"
          disabled={!input.trim() || loading}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

    </div>
  );
}
