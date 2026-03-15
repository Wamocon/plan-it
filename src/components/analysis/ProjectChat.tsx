'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { Project, ChatMessage } from '@/types';
import { useAppStore } from '@/stores/appStore';
import { Send, Trash2, Bot } from 'lucide-react';

const SUGGESTIONS = [
  'Was bedeutet Welle 1 konkret für uns?',
  'Wie priorisiere ich die Risiken?',
  'Was ist ein Monorepo und warum brauchen wir es?',
  'Wie lange dauert die Umsetzung realistisch?',
  'Was bedeutet mein Score von X/100?',
  'Welches Risiko sollen wir zuerst angehen?',
];

export function ProjectChat({ project, apiKey }: { project: Project; apiKey: string }) {
  const addChatMessage = useAppStore(s => s.addChatMessage);
  const clearChat = useAppStore(s => s.clearChat);
  const messages = useMemo(() => project.chatHistory || [], [project.chatHistory]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput('');
    setError(null);

    addChatMessage(project.id, { role: 'user', content: q });
    setLoading(true);

    // Chat-History für API (ohne aktuelle Frage, die wird separat gesendet)
    const history = messages.map(m => ({
      role: m.role === 'user' ? 'user' as const : 'model' as const,
      text: m.content,
    }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project, question: q, history, apiKey }),
      });
      const data = await res.json();
      if (res.status === 429) { setError('KI-Limit erreicht. Bitte später erneut versuchen.'); }
      else if (!res.ok || data.error) { setError(data.error || 'Fehler bei der Anfrage'); }
      else { addChatMessage(project.id, { role: 'assistant', content: data.answer }); }
    } catch {
      setError('Netzwerkfehler. Bitte erneut versuchen.');
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="flex flex-col h-full min-h-0" style={{ maxHeight: '620px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.07]"
        style={{ background: 'rgba(88,28,135,0.15)' }}>
        <div className="flex items-center gap-2">
          <Bot size={14} className="text-purple-400" />
          <span className="text-sm font-bold text-white">KI-Assistent</span>
          <span className="text-[9px] bg-purple-900/50 text-purple-300 border border-purple-500/20 px-1.5 py-0.5 rounded-full font-bold">
            Analyse-Kontext geladen
          </span>
        </div>
        {messages.length > 0 && (
          <button onClick={() => clearChat(project.id)}
            className="text-white/25 hover:text-red-400 transition-colors cursor-pointer bg-transparent border-none p-1">
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <div className="text-3xl mb-2">🤖</div>
            <p className="text-white/40 text-sm mb-4">
              Frag mich alles zur Analyse von <strong className="text-white/60">{project.data.projectName}</strong>
            </p>
            <div className="grid grid-cols-1 gap-1.5 max-w-sm mx-auto">
              {SUGGESTIONS.slice(0, 4).map(s => (
                <button key={s} onClick={() => sendMessage(s)}
                  className="text-left text-xs text-purple-300/70 bg-purple-900/20 border border-purple-500/15 rounded-lg px-3 py-2 hover:bg-purple-900/35 hover:text-purple-200 transition-all cursor-pointer">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <ChatBubble key={msg.id} message={msg} />
        ))}

        {loading && (
          <div className="flex gap-2 items-start">
            <div className="w-6 h-6 rounded-full bg-purple-900/60 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <Bot size={10} className="text-purple-400" />
            </div>
            <div className="bg-purple-950/40 border border-purple-500/20 rounded-2xl rounded-tl-sm px-3 py-2">
              <div className="flex gap-1 items-center py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-950/40 border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-300">
            ⚠️ {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/[0.07]" style={{ background: 'rgba(0,0,0,0.2)' }}>
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Frage zur Analyse stellen… (Enter zum Senden)"
            rows={1}
            maxLength={1000}
            className="flex-1 resize-none rounded-xl px-3 py-2 text-sm text-white/90 placeholder:text-white/30 border border-white/10 focus:border-purple-500/50 focus:outline-none transition-colors"
            style={{ background: 'rgba(255,255,255,0.04)', minHeight: '38px', maxHeight: '120px' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center cursor-pointer border-none hover:bg-purple-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            <Send size={14} className="text-white" />
          </button>
        </div>
        <p className="text-[9px] text-white/15 mt-1.5 text-right">{input.length}/1000 · Enter = Senden · Shift+Enter = Zeilenumbruch</p>
      </div>
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  // Einfaches Markdown: **bold**, `code`, ```block```
  const renderContent = (text: string) => {
    const parts = text.split(/(```[\s\S]*?```|`[^`]+`|\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const code = part.slice(3, -3).replace(/^[a-z]+\n/, '');
        return <pre key={i} className="bg-black/40 rounded-lg p-2 text-xs font-mono text-green-300 overflow-x-auto mt-1.5 mb-1.5 whitespace-pre-wrap">{code}</pre>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="bg-black/30 text-green-300 px-1 rounded text-[11px] font-mono">{part.slice(1, -1)}</code>;
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>;
      }
      // Zeilenumbrüche
      return <span key={i}>{part.split('\n').map((line, j) => j === 0 ? line : <span key={j}><br />{line}</span>)}</span>;
    });
  };

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-[#ff1a1a]/20 border border-[#ff1a1a]/25 text-white/90 text-xs rounded-2xl rounded-tr-sm px-3 py-2">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 items-start">
      <div className="w-6 h-6 rounded-full bg-purple-900/60 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5">
        <Bot size={10} className="text-purple-400" />
      </div>
      <div className="max-w-[85%] bg-purple-950/40 border border-purple-500/20 text-white/85 text-xs rounded-2xl rounded-tl-sm px-3 py-2 leading-relaxed">
        {renderContent(message.content)}
        <div className="text-white/20 text-[9px] mt-1">
          {new Date(message.createdAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
